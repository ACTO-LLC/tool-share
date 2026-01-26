import sharp from 'sharp';

// Configuration for image processing
const IMAGE_CONFIG = {
  // Maximum dimensions for tool photos
  tool: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
  },
  // Maximum dimensions for loan condition photos
  loan: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 80,
  },
};

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Process and resize an image for tool photos
 * - Resizes to max 1200x1200 while maintaining aspect ratio
 * - Compresses with quality setting
 * - Converts WEBP to JPEG for better compatibility
 */
export async function processToolPhoto(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, IMAGE_CONFIG.tool);
}

/**
 * Process and resize an image for loan condition photos
 * - Resizes to max 1600x1600 while maintaining aspect ratio
 * - Compresses with quality setting
 * - Converts WEBP to JPEG for better compatibility
 */
export async function processLoanPhoto(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, IMAGE_CONFIG.loan);
}

/**
 * Generic image processing function
 */
async function processImage(
  buffer: Buffer,
  config: { maxWidth: number; maxHeight: number; quality: number }
): Promise<ProcessedImage> {
  // Get image metadata
  const metadata = await sharp(buffer).metadata();

  // Determine output format (convert WebP to JPEG)
  let format: 'jpeg' | 'png' = 'jpeg';
  if (metadata.format === 'png') {
    format = 'png';
  }

  // Process the image
  let pipeline = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(config.maxWidth, config.maxHeight, {
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: true, // Don't upscale small images
    });

  // Apply format-specific compression
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality: config.quality,
      mozjpeg: true, // Use mozjpeg for better compression
    });
  } else {
    pipeline = pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    });
  }

  const processedBuffer = await pipeline.toBuffer();

  // Get final metadata
  const finalMetadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    format: format,
    size: processedBuffer.length,
  };
}

/**
 * Get the MIME type for a format
 */
export function getMimeType(format: string): string {
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}
