/**
 * Unit tests for imageProcessingService
 * Tests image resize and compression functionality
 */

import { processToolPhoto, processLoanPhoto, getMimeType } from '../../services/imageProcessingService';
import sharp from 'sharp';

describe('imageProcessingService', () => {
  // Helper to create a test image buffer
  async function createTestImage(
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<Buffer> {
    const pipeline = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    });

    if (format === 'jpeg') {
      return pipeline.jpeg().toBuffer();
    } else if (format === 'png') {
      return pipeline.png().toBuffer();
    } else {
      return pipeline.webp().toBuffer();
    }
  }

  describe('processToolPhoto', () => {
    it('should resize large images to max 1200x1200', async () => {
      const largeImage = await createTestImage(2000, 1500);
      const result = await processToolPhoto(largeImage);

      expect(result.width).toBeLessThanOrEqual(1200);
      expect(result.height).toBeLessThanOrEqual(1200);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const image = await createTestImage(2000, 1000); // 2:1 aspect ratio
      const result = await processToolPhoto(image);

      // Should be resized to 1200x600 (maintaining 2:1 ratio)
      expect(result.width).toBe(1200);
      expect(result.height).toBe(600);
    });

    it('should not upscale small images', async () => {
      const smallImage = await createTestImage(400, 300);
      const result = await processToolPhoto(smallImage);

      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });

    it('should convert webp to jpeg', async () => {
      const webpImage = await createTestImage(800, 600, 'webp');
      const result = await processToolPhoto(webpImage);

      expect(result.format).toBe('jpeg');
    });

    it('should keep png format for png images', async () => {
      const pngImage = await createTestImage(800, 600, 'png');
      const result = await processToolPhoto(pngImage);

      expect(result.format).toBe('png');
    });

    it('should compress the image', async () => {
      const image = await createTestImage(1000, 1000, 'jpeg');
      const result = await processToolPhoto(image);

      // Processed image should have reasonable size
      expect(result.size).toBeGreaterThan(0);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('processLoanPhoto', () => {
    it('should resize large images to max 1600x1600', async () => {
      const largeImage = await createTestImage(3000, 2000);
      const result = await processLoanPhoto(largeImage);

      expect(result.width).toBeLessThanOrEqual(1600);
      expect(result.height).toBeLessThanOrEqual(1600);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const image = await createTestImage(3200, 1600); // 2:1 aspect ratio
      const result = await processLoanPhoto(image);

      // Should be resized to 1600x800 (maintaining 2:1 ratio)
      expect(result.width).toBe(1600);
      expect(result.height).toBe(800);
    });

    it('should not upscale small images', async () => {
      const smallImage = await createTestImage(800, 600);
      const result = await processLoanPhoto(smallImage);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  describe('getMimeType', () => {
    it('should return correct mime type for jpeg', () => {
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('jpg')).toBe('image/jpeg');
    });

    it('should return correct mime type for png', () => {
      expect(getMimeType('png')).toBe('image/png');
    });

    it('should return correct mime type for webp', () => {
      expect(getMimeType('webp')).toBe('image/webp');
    });

    it('should return correct mime type for gif', () => {
      expect(getMimeType('gif')).toBe('image/gif');
    });

    it('should default to jpeg for unknown formats', () => {
      expect(getMimeType('unknown')).toBe('image/jpeg');
    });
  });
});
