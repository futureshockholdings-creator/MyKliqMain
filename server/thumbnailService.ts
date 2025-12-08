import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { objectStorageClient, ObjectStorageService } from "./objectStorage";

const execAsync = promisify(exec);

export class ThumbnailService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  async generateThumbnailFromVideo(videoPath: string, movieconId: string): Promise<string | null> {
    const tmpDir = os.tmpdir();
    const videoLocalPath = path.join(tmpDir, `video_${movieconId}_${Date.now()}.mp4`);
    const thumbLocalPath = path.join(tmpDir, `thumb_${movieconId}_${Date.now()}.jpg`);

    try {
      await this.downloadVideo(videoPath, videoLocalPath);
      
      const cmd = `ffmpeg -i "${videoLocalPath}" -ss 00:00:00.100 -vframes 1 -vf "scale=400:-1" -q:v 2 "${thumbLocalPath}" -y`;
      await execAsync(cmd);

      if (!fs.existsSync(thumbLocalPath)) {
        console.error("Thumbnail generation failed - file not created");
        return null;
      }

      const thumbnailUrl = await this.uploadThumbnail(thumbLocalPath, movieconId);
      
      this.cleanup(videoLocalPath, thumbLocalPath);
      
      return thumbnailUrl;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      this.cleanup(videoLocalPath, thumbLocalPath);
      return null;
    }
  }

  private async downloadVideo(objectPath: string, localPath: string): Promise<void> {
    const file = await this.objectStorageService.getObjectEntityFile(objectPath);
    const writeStream = fs.createWriteStream(localPath);

    return new Promise((resolve, reject) => {
      file
        .createReadStream()
        .on("error", reject)
        .pipe(writeStream)
        .on("finish", resolve)
        .on("error", reject);
    });
  }

  private async uploadThumbnail(localPath: string, thumbnailId: string): Promise<string> {
    const privateDir = this.objectStorageService.getPrivateObjectDir();
    const objectPath = `${privateDir}/thumbnails/${thumbnailId}.jpg`;

    const pathParts = objectPath.split("/").filter(Boolean);
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join("/");

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const fileBuffer = fs.readFileSync(localPath);
    await file.save(fileBuffer, {
      contentType: "image/jpeg",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    return `/objects/thumbnails/${thumbnailId}.jpg`;
  }

  private cleanup(...paths: string[]) {
    for (const p of paths) {
      try {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

export const thumbnailService = new ThumbnailService();
