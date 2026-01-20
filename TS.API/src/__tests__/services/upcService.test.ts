/**
 * Unit tests for upcService
 * Tests UPC lookup with caching and external API mocking
 */

// Note: The upcService uses an in-memory cache and setInterval which persists across tests.
// We test specific behaviors while acknowledging these limitations.

import axios from 'axios';

// Mock axios before importing the service
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Re-import the service for each describe block to get fresh cache
let lookupUpc: (upc: string) => Promise<{ found: boolean; name?: string; brand?: string; model?: string; category?: string; imageUrl?: string }>;
let searchProducts: (query: string) => Promise<Array<{ upc: string; name: string; brand?: string }>>;

describe('upcService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-import with fresh module
    jest.isolateModules(() => {
      const service = require('../../services/upcService');
      lookupUpc = service.lookupUpc;
      searchProducts = service.searchProducts;
    });
  });

  describe('lookupUpc', () => {
    it('should return product info when UPC is found', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 1,
          offset: 0,
          items: [
            {
              ean: '012345678901',
              title: 'DeWalt Cordless Drill',
              description: '20V MAX cordless drill driver',
              brand: 'DeWalt',
              model: 'DCD771C2',
              category: 'Power Tools',
              images: ['http://example.com/drill.jpg'],
            },
          ],
        },
      });

      const result = await lookupUpc('012345678901');

      expect(result.found).toBe(true);
      expect(result.name).toBe('DeWalt Cordless Drill');
      expect(result.brand).toBe('DeWalt');
      expect(result.model).toBe('DCD771C2');
      expect(result.imageUrl).toBe('http://example.com/drill.jpg');
    });

    it('should return not found for unknown UPC', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 0,
          offset: 0,
          items: [],
        },
      });

      const result = await lookupUpc('999999999999');

      expect(result.found).toBe(false);
      expect(result.name).toBeUndefined();
    });

    it('should normalize UPC by removing non-digit characters', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 1,
          items: [
            {
              ean: '012345678901',
              title: 'Test Product',
            },
          ],
        },
      });

      await lookupUpc('012-345-678-901');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { upc: '012345678901' },
        })
      );
    });

    it('should return not found for empty UPC', async () => {
      const result = await lookupUpc('');

      expect(result.found).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return not found for UPC with only non-digits', async () => {
      const result = await lookupUpc('abc-def');

      expect(result.found).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    describe('barcode format normalization', () => {
      it('should pad 10-digit barcode to UPC-A (12 digits) and EAN-13 (13 digits)', async () => {
        // First call (12-digit) fails
        mockedAxios.get.mockResolvedValueOnce({
          data: { code: 'OK', total: 0, items: [] },
        });
        // Second call (13-digit) succeeds
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '0009317557847',
                title: 'Australian Tool',
                brand: 'ToolBrand',
              },
            ],
          },
        });

        const result = await lookupUpc('9317557847');

        expect(result.found).toBe(true);
        expect(result.name).toBe('Australian Tool');
        // Should have tried both formats
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
          1,
          expect.any(String),
          expect.objectContaining({ params: { upc: '009317557847' } })
        );
        expect(mockedAxios.get).toHaveBeenNthCalledWith(
          2,
          expect.any(String),
          expect.objectContaining({ params: { upc: '0009317557847' } })
        );
      });

      it('should find product with first format if UPC-A format matches', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '009317557847',
                title: 'Product Found',
                brand: 'Brand',
              },
            ],
          },
        });

        const result = await lookupUpc('9317557847');

        expect(result.found).toBe(true);
        expect(result.name).toBe('Product Found');
        // Should only make one call since first format matched
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });

      it('should handle standard 12-digit UPC-A without extra padding', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [{ ean: '012345678901', title: 'Standard UPC' }],
          },
        });

        const result = await lookupUpc('012345678901');

        expect(result.found).toBe(true);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ params: { upc: '012345678901' } })
        );
      });

      it('should handle standard 13-digit EAN-13 without extra padding', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [{ ean: '5901234123457', title: 'Standard EAN' }],
          },
        });

        const result = await lookupUpc('5901234123457');

        expect(result.found).toBe(true);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ params: { upc: '5901234123457' } })
        );
      });

      it('should handle 8-digit UPC-E/EAN-8 with fallback to padded formats', async () => {
        // 8-digit code tries as-is first
        mockedAxios.get.mockResolvedValueOnce({
          data: { code: 'OK', total: 0, items: [] },
        });
        // Then tries 12-digit
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [{ ean: '000012345678', title: 'Padded Product' }],
          },
        });

        const result = await lookupUpc('12345678');

        expect(result.found).toBe(true);
        expect(result.name).toBe('Padded Product');
      });

      it('should continue to next format if API errors on first format', async () => {
        // First call errors
        mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
        // Second call succeeds
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [{ ean: '0001234567890', title: 'Found After Error' }],
          },
        });

        const result = await lookupUpc('1234567890');

        expect(result.found).toBe(true);
        expect(result.name).toBe('Found After Error');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await lookupUpc('012345678901');

      expect(result.found).toBe(false);
    });

    it('should use cached result for repeated lookups', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 1,
          items: [
            {
              ean: '111111111111',
              title: 'Cached Product',
              brand: 'TestBrand',
            },
          ],
        },
      });

      // First lookup - should call API
      const result1 = await lookupUpc('111111111111');
      // Second lookup - should use cache
      const result2 = await lookupUpc('111111111111');

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
      expect(result1.name).toBe('Cached Product');
    });

    describe('category mapping', () => {
      it('should map power tool category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '123',
                title: 'Drill',
                category: 'Power Drill Tools',
              },
            ],
          },
        });

        const result = await lookupUpc('123');

        expect(result.category).toBe('Power Tools');
      });

      it('should map hand tool category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '124',
                title: 'Wrench Set',
                category: 'Hand Tools & Wrenches',
              },
            ],
          },
        });

        const result = await lookupUpc('124');

        expect(result.category).toBe('Hand Tools');
      });

      it('should map gardening category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '125',
                title: 'Lawn Mower',
                category: 'Lawn & Garden Equipment',
              },
            ],
          },
        });

        const result = await lookupUpc('125');

        expect(result.category).toBe('Gardening');
      });

      it('should map automotive category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '126',
                title: 'Car Jack',
                category: 'Automotive Tools',
              },
            ],
          },
        });

        const result = await lookupUpc('126');

        expect(result.category).toBe('Automotive');
      });

      it('should map plumbing category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '127',
                title: 'Pipe Wrench',
                category: 'Plumbing Supplies',
              },
            ],
          },
        });

        const result = await lookupUpc('127');

        expect(result.category).toBe('Plumbing');
      });

      it('should map electrical category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '128',
                title: 'Wire Stripper',
                category: 'Electrical Tools',
              },
            ],
          },
        });

        const result = await lookupUpc('128');

        expect(result.category).toBe('Electrical');
      });

      it('should map painting category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '129',
                title: 'Paint Roller',
                category: 'Painting Supplies',
              },
            ],
          },
        });

        const result = await lookupUpc('129');

        expect(result.category).toBe('Painting');
      });

      it('should map measuring category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '130',
                title: 'Laser Level',
                category: 'Measuring & Leveling',
              },
            ],
          },
        });

        const result = await lookupUpc('130');

        expect(result.category).toBe('Measuring');
      });

      it('should map safety category', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '131',
                title: 'Safety Goggles',
                category: 'Safety Equipment',
              },
            ],
          },
        });

        const result = await lookupUpc('131');

        expect(result.category).toBe('Safety');
      });

      it('should map unknown category to Other', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '132',
                title: 'Unknown Item',
                category: 'Random Category',
              },
            ],
          },
        });

        const result = await lookupUpc('132');

        expect(result.category).toBe('Other');
      });

      it('should return Other when category is undefined', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            code: 'OK',
            total: 1,
            items: [
              {
                ean: '133',
                title: 'No Category Item',
              },
            ],
          },
        });

        const result = await lookupUpc('133');

        expect(result.category).toBe('Other');
      });
    });
  });

  describe('searchProducts', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchProducts('');

      expect(result).toEqual([]);
    });

    it('should return empty array for short query', async () => {
      const result = await searchProducts('a');

      expect(result).toEqual([]);
    });

    it('should return search results', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 2,
          items: [
            {
              ean: '111111111111',
              title: 'DeWalt Drill',
              brand: 'DeWalt',
            },
            {
              ean: '222222222222',
              title: 'Makita Drill',
              brand: 'Makita',
            },
          ],
        },
      });

      const result = await searchProducts('drill');

      expect(result).toHaveLength(2);
      expect(result[0].upc).toBe('111111111111');
      expect(result[0].name).toBe('DeWalt Drill');
      expect(result[0].brand).toBe('DeWalt');
    });

    it('should limit results to 10 items', async () => {
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        ean: `${i}`.padStart(12, '0'),
        title: `Product ${i}`,
      }));

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 15,
          items: manyItems,
        },
      });

      const result = await searchProducts('product search');

      expect(result).toHaveLength(10);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await searchProducts('drill error');

      expect(result).toEqual([]);
    });

    it('should return empty array when no results', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 'OK',
          total: 0,
          items: [],
        },
      });

      const result = await searchProducts('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
