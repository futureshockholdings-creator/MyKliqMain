// Audio conversion utilities for client-side processing
// Note: This handles non-DRM protected files only

export interface ConversionResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  originalFormat?: string;
  targetFormat?: string;
}

// Check if a file is likely DRM-protected
export function isDRMProtected(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const isDRMExtension = fileName.endsWith('.m4p');
  
  // M4P files are typically DRM-protected
  // We can also check file size patterns or other heuristics
  return isDRMExtension;
}

// Get file format info
export function getAudioFileInfo(file: File) {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const isLossless = ['.wav', '.flac', '.aiff'].includes(extension);
  const isCompressed = ['.mp3', '.m4a', '.aac', '.ogg'].includes(extension);
  const isDRM = extension === '.m4p';
  
  return {
    extension,
    isLossless,
    isCompressed,
    isDRM,
    needsConversion: isLossless && file.size > 5 * 1024 * 1024, // Convert large lossless files
  };
}

// Convert audio file to MP3 using Web Audio API
export async function convertToMP3(file: File): Promise<ConversionResult> {
  try {
    const fileInfo = getAudioFileInfo(file);
    
    if (fileInfo.isDRM) {
      return {
        success: false,
        error: "Cannot convert DRM-protected files. Please use legitimate desktop software to convert this file first.",
        originalFormat: fileInfo.extension,
      };
    }

    // For already compressed formats, just return as-is
    if (fileInfo.extension === '.mp3') {
      return {
        success: true,
        blob: file,
        originalFormat: fileInfo.extension,
        targetFormat: '.mp3',
      };
    }

    // Use Web Audio API for conversion (for unprotected files)
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to MP3-like quality (we'll actually use WAV format as browsers don't natively encode MP3)
      // This is a simplified approach - for true MP3 encoding, you'd need a library like lame.js
      const mp3Blob = await encodeAsWebAudio(audioBuffer, audioContext);
      
      return {
        success: true,
        blob: mp3Blob,
        originalFormat: fileInfo.extension,
        targetFormat: '.wav', // Actually WAV, but high quality
      };
    } finally {
      audioContext.close();
    }
  } catch (error) {
    console.error('Audio conversion error:', error);
    return {
      success: false,
      error: `Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      originalFormat: getAudioFileInfo(file).extension,
    };
  }
}

// Encode audio buffer as WAV (since browsers don't natively encode MP3)
async function encodeAsWebAudio(audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
  // Create a simpler WAV file from the audio buffer
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2; // 16-bit samples
  
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // Byte rate
  view.setUint16(32, numberOfChannels * 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Convert audio data
  const channelData = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }
  
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Validate if file can be processed
export function canProcessFile(file: File): boolean {
  const fileInfo = getAudioFileInfo(file);
  return !fileInfo.isDRM && (fileInfo.isLossless || fileInfo.isCompressed);
}

// Get recommended actions for user
export function getFileRecommendations(file: File) {
  const fileInfo = getAudioFileInfo(file);
  
  if (fileInfo.isDRM) {
    return {
      canProcess: false,
      recommendation: "DRM-protected file detected",
      message: "This file has copy protection. To use it, you'll need to convert it using desktop software first.",
      suggestedTools: [
        "Use iTunes to burn to CD and re-import as MP3",
        "Use legitimate DRM removal software",
        "Purchase DRM-free version if available"
      ]
    };
  }
  
  if (fileInfo.needsConversion) {
    return {
      canProcess: true,
      recommendation: "Convert to compressed format",
      message: "Large lossless file detected. Converting to compressed format will reduce file size.",
      suggestedTools: ["Auto-convert to optimized format for web playback"]
    };
  }
  
  return {
    canProcess: true,
    recommendation: "File ready to use",
    message: "This file format is compatible and ready for upload.",
    suggestedTools: []
  };
}