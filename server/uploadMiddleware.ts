import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "ads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed image formats
  const imageFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  // Allowed video formats
  const videoFormats = ['.mp4'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (imageFormats.includes(ext) || videoFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${[...imageFormats, ...videoFormats].join(', ')}`));
  }
};

// Multer upload configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (videos can be large)
  }
});

// Image validation using sharp
export async function validateImage(filePath: string): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  try {
    const metadata = await sharp(filePath).metadata();
    
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Could not read image dimensions" };
    }

    // Check minimum dimensions (1200x628 for images as per requirements)
    if (metadata.width < 1200 || metadata.height < 628) {
      return { 
        valid: false, 
        error: `Image too small. Minimum: 1200x628px, got: ${metadata.width}x${metadata.height}px` 
      };
    }

    // Check maximum dimensions (optional, for performance)
    if (metadata.width > 4000 || metadata.height > 4000) {
      return { 
        valid: false, 
        error: `Image too large. Maximum: 4000x4000px, got: ${metadata.width}x${metadata.height}px` 
      };
    }

    // Check file size (5MB for images)
    const stats = fs.statSync(filePath);
    if (stats.size > 5 * 1024 * 1024) {
      return { 
        valid: false, 
        error: `Image file too large. Maximum: 5MB, got: ${(stats.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    return {
      valid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: stats.size
      }
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Unknown error validating image" 
    };
  }
}

// Video validation (basic checks)
export async function validateVideo(filePath: string): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    size: number;
  };
}> {
  try {
    const stats = fs.statSync(filePath);
    
    // Check file size (100MB for videos)
    if (stats.size > 100 * 1024 * 1024) {
      return { 
        valid: false, 
        error: `Video file too large. Maximum: 100MB, got: ${(stats.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    // Check minimum size (should be at least 100KB)
    if (stats.size < 100 * 1024) {
      return { 
        valid: false, 
        error: "Video file appears to be corrupted or too small" 
      };
    }

    return {
      valid: true,
      metadata: {
        size: stats.size
      }
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Unknown error validating video" 
    };
  }
}
