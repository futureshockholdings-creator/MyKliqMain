import { db } from "../server/db";
import { moviecons } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";
import { objectStorageClient, ObjectStorageService } from "../server/objectStorage";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);
const objectStorageService = new ObjectStorageService();

async function generateThumbnail(videoPath: string, outputPath: string): Promise<void> {
  const cmd = `ffmpeg -i "${videoPath}" -ss 00:00:00.100 -vframes 1 -vf "scale=400:-1" -q:v 2 "${outputPath}" -y`;
  await execAsync(cmd);
}

async function downloadVideo(objectPath: string, localPath: string): Promise<void> {
  const file = await objectStorageService.getObjectEntityFile(objectPath);
  const writeStream = fs.createWriteStream(localPath);
  
  return new Promise((resolve, reject) => {
    file.createReadStream()
      .on("error", reject)
      .pipe(writeStream)
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function uploadThumbnail(localPath: string, thumbnailId: string): Promise<string> {
  const privateDir = objectStorageService.getPrivateObjectDir();
  const objectPath = `${privateDir}/thumbnails/${thumbnailId}.jpg`;
  
  const { bucketName, objectName } = parseObjectPath(objectPath);
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

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path");
  }
  return {
    bucketName: pathParts[1],
    objectName: pathParts.slice(2).join("/"),
  };
}

async function main() {
  console.log("🎬 Starting moviecon thumbnail generation...");
  
  const movieconsWithoutThumbnails = await db
    .select()
    .from(moviecons)
    .where(isNull(moviecons.thumbnailUrl));
  
  console.log(`Found ${movieconsWithoutThumbnails.length} moviecons without thumbnails`);
  
  const tmpDir = os.tmpdir();
  let successCount = 0;
  let errorCount = 0;
  
  for (const moviecon of movieconsWithoutThumbnails) {
    try {
      console.log(`Processing: ${moviecon.title} (${moviecon.id})`);
      
      const videoLocalPath = path.join(tmpDir, `video_${moviecon.id}.mp4`);
      const thumbLocalPath = path.join(tmpDir, `thumb_${moviecon.id}.jpg`);
      
      await downloadVideo(moviecon.videoUrl, videoLocalPath);
      
      await generateThumbnail(videoLocalPath, thumbLocalPath);
      
      if (!fs.existsSync(thumbLocalPath)) {
        throw new Error("Thumbnail generation failed - file not created");
      }
      
      const thumbnailUrl = await uploadThumbnail(thumbLocalPath, moviecon.id);
      
      await db
        .update(moviecons)
        .set({ thumbnailUrl })
        .where(eq(moviecons.id, moviecon.id));
      
      fs.unlinkSync(videoLocalPath);
      fs.unlinkSync(thumbLocalPath);
      
      successCount++;
      console.log(`✅ Generated thumbnail for: ${moviecon.title}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${moviecon.title}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total: ${movieconsWithoutThumbnails.length}`);
  
  process.exit(0);
}

main().catch(console.error);
