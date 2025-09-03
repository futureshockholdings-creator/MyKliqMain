import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class VideoConverter {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  private async loadFFmpeg(): Promise<void> {
    if (this.isLoaded && this.ffmpeg) return;

    this.ffmpeg = new FFmpeg();
    
    // Configure FFmpeg with CDN URLs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    this.isLoaded = true;
  }

  /**
   * Convert HEVC/H.265 video to H.264 MP4
   * @param file - Input video file (HEVC/H.265 format)
   * @param onProgress - Progress callback function
   * @returns Promise<File> - Converted MP4 file
   */
  async convertHEVCToMP4(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<File> {
    await this.loadFFmpeg();
    
    if (!this.ffmpeg) {
      throw new Error('FFmpeg failed to load');
    }

    const inputName = `input.${this.getFileExtension(file.name)}`;
    const outputName = 'output.mp4';

    try {
      // Set up progress monitoring
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(Math.round(progress * 100));
        });
      }

      // Write input file to FFmpeg virtual filesystem
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      // Convert HEVC to H.264 MP4 with optimized settings
      await this.ffmpeg.exec([
        '-i', inputName,                    // Input file
        '-c:v', 'libx264',                 // Use H.264 codec
        '-crf', '23',                      // Quality setting (18-28, lower = better quality)
        '-preset', 'medium',               // Encoding speed vs compression (faster, fast, medium, slow, slower)
        '-c:a', 'aac',                     // Audio codec
        '-b:a', '128k',                    // Audio bitrate
        '-movflags', '+faststart',         // Optimize for web streaming
        '-pix_fmt', 'yuv420p',            // Pixel format for better compatibility
        '-max_muxing_queue_size', '1024',  // Handle large files
        outputName
      ]);

      // Read the converted file
      const convertedData = await this.ffmpeg.readFile(outputName);
      
      // Clean up files from virtual filesystem
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      // Create a new File object with the converted data
      const convertedBlob = new Blob([convertedData], { type: 'video/mp4' });
      const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const convertedFile = new File([convertedBlob], `${originalNameWithoutExt}_converted.mp4`, {
        type: 'video/mp4'
      });

      return convertedFile;

    } catch (error) {
      console.error('Video conversion error:', error);
      throw new Error(`Failed to convert video: ${error}`);
    }
  }

  /**
   * Check if a file needs conversion (is HEVC format)
   */
  needsConversion(file: File): boolean {
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    // Common HEVC file extensions
    const hevcExtensions = ['hevc', 'h265', 'mov'];
    
    // Check file extension
    if (hevcExtensions.includes(extension)) {
      return true;
    }

    // For .mp4 files, we'd need to check the actual codec, but that requires
    // processing the file. For now, we'll assume .mp4 files don't need conversion
    // unless specifically indicated
    return false;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Get estimated file size reduction
   */
  getEstimatedSizeReduction(): number {
    // HEVC to H.264 typically results in 20-40% larger files
    // but better compatibility. Return as percentage increase.
    return 1.3; // 30% size increase estimate
  }

  /**
   * Check if browser supports the required features
   */
  static isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  /**
   * Clean up FFmpeg instance
   */
  dispose(): void {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.isLoaded = false;
    }
  }
}

// Export singleton instance
export const videoConverter = new VideoConverter();

// Export utility functions
export const isHEVCFile = (file: File): boolean => {
  return videoConverter.needsConversion(file);
};

export const convertVideoToMP4 = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<File> => {
  return videoConverter.convertHEVCToMP4(file, onProgress);
};

export const isVideoConversionSupported = (): boolean => {
  return VideoConverter.isSupported();
};