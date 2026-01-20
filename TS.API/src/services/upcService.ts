import axios from 'axios';
import { config } from '../config/env';

interface UpcLookupResult {
  found: boolean;
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

interface UpcItemDbResponse {
  code: string;
  total: number;
  offset: number;
  items?: Array<{
    ean: string;
    title: string;
    description?: string;
    brand?: string;
    model?: string;
    category?: string;
    images?: string[];
  }>;
}

interface SearchResult {
  upc: string;
  name: string;
  brand?: string;
}

// Simple in-memory cache for UPC lookups to reduce API calls
// Cache entries expire after 24 hours
interface CacheEntry {
  result: UpcLookupResult;
  timestamp: number;
}

const upcCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if a cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Clean up expired cache entries (call periodically)
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of upcCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      upcCache.delete(key);
    }
  }
}

// Run cache cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Normalize barcode to standard formats
 * Handles UPC-A (12 digits), EAN-13 (13 digits), UPC-E (8 digits), EAN-8 (8 digits)
 * Returns array of formats to try, in order of likelihood
 */
function normalizeBarcode(code: string): string[] {
  const digits = code.replace(/\D/g, '');

  if (!digits) {
    return [];
  }

  const formats: string[] = [];
  const len = digits.length;

  // Standard lengths - use as-is
  if (len === 12 || len === 13 || len === 8) {
    formats.push(digits);
  }

  // Non-standard lengths - try padding to standard formats
  if (len < 12) {
    // Pad to UPC-A (12 digits)
    formats.push(digits.padStart(12, '0'));
  }

  if (len < 13 && len !== 12) {
    // Pad to EAN-13 (13 digits)
    formats.push(digits.padStart(13, '0'));
  }

  // If already standard length but different from what we've added
  if (len === 12 && !formats.includes(digits)) {
    formats.push(digits);
  }
  if (len === 13 && !formats.includes(digits)) {
    formats.push(digits);
  }

  // Add original if not already included (for cases > 13 digits)
  if (!formats.includes(digits)) {
    formats.push(digits);
  }

  // Remove duplicates while preserving order
  return [...new Set(formats)];
}

/**
 * Perform a single UPC lookup against the API
 */
async function performUpcLookup(upc: string): Promise<UpcLookupResult> {
  const response = await axios.get<UpcItemDbResponse>(config.UPCITEMDB_API_URL, {
    params: { upc },
    headers: {
      'Accept': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });

  if (response.data.items && response.data.items.length > 0) {
    const item = response.data.items[0];
    return {
      found: true,
      name: item.title,
      brand: item.brand,
      model: item.model,
      description: item.description,
      category: mapCategory(item.category),
      imageUrl: item.images?.[0],
    };
  }

  return { found: false };
}

/**
 * Look up product information by UPC code
 * Results are cached for 24 hours to reduce API calls
 * Handles various barcode formats including partial/truncated codes
 */
export async function lookupUpc(upc: string): Promise<UpcLookupResult> {
  // Get normalized barcode formats to try
  const formatsToTry = normalizeBarcode(upc);

  if (formatsToTry.length === 0) {
    return { found: false };
  }

  // Check cache first for any format
  for (const format of formatsToTry) {
    const cached = upcCache.get(format);
    if (cached && isCacheValid(cached) && cached.result.found) {
      console.log(`UPC cache hit for: ${format}`);
      return cached.result;
    }
  }

  // Try each format until we find a result
  for (const format of formatsToTry) {
    try {
      console.log(`UPC API lookup for: ${format}`);
      const result = await performUpcLookup(format);

      // Cache the result
      upcCache.set(format, {
        result,
        timestamp: Date.now(),
      });

      if (result.found) {
        return result;
      }
    } catch (error) {
      console.error(`UPC lookup error for ${format}:`, error);
      // Continue to next format on error
    }
  }

  // Cache the not-found result for the original normalized code
  const primaryFormat = formatsToTry[0];
  if (!upcCache.has(primaryFormat)) {
    upcCache.set(primaryFormat, {
      result: { found: false },
      timestamp: Date.now(),
    });
  }

  return { found: false };
}

/**
 * Search for products by name
 * Note: UPCitemdb free tier has limited search capability
 * This implementation uses the trial search endpoint
 */
export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    console.log('Product search query:', query);

    // UPCitemdb trial/free tier search endpoint
    // Note: This has very limited functionality on free tier
    // The search endpoint format is: https://api.upcitemdb.com/prod/trial/search?s={query}&match_mode=0&type=product
    const searchUrl = 'https://api.upcitemdb.com/prod/trial/search';

    const response = await axios.get<UpcItemDbResponse>(searchUrl, {
      params: {
        s: query.trim(),
        match_mode: 0, // 0 = any word, 1 = all words
        type: 'product',
      },
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items.slice(0, 10).map(item => ({
        upc: item.ean,
        name: item.title,
        brand: item.brand,
      }));
    }

    return [];
  } catch (error) {
    // Free tier may not support search - return empty array gracefully
    console.error('Product search error:', error);
    return [];
  }
}

/**
 * Map UPCitemdb category to our tool categories
 * Valid categories: 'Power Tools', 'Hand Tools', 'Gardening', 'Automotive',
 *                   'Plumbing', 'Electrical', 'Painting', 'Measuring', 'Safety', 'Other'
 */
function mapCategory(upcCategory?: string): string {
  if (!upcCategory) return 'Other';

  const categoryLower = upcCategory.toLowerCase();

  // Power Tools - drills, saws, sanders, etc.
  if (categoryLower.includes('power') || categoryLower.includes('drill') || categoryLower.includes('saw') ||
      categoryLower.includes('sander') || categoryLower.includes('grinder') || categoryLower.includes('router')) {
    return 'Power Tools';
  }
  // Hand Tools - wrenches, hammers, screwdrivers, etc.
  if (categoryLower.includes('hand') || categoryLower.includes('wrench') || categoryLower.includes('hammer') ||
      categoryLower.includes('screwdriver') || categoryLower.includes('plier') || categoryLower.includes('socket')) {
    return 'Hand Tools';
  }
  // Gardening - lawn, yard, garden tools
  if (categoryLower.includes('garden') || categoryLower.includes('lawn') || categoryLower.includes('yard') ||
      categoryLower.includes('hedge') || categoryLower.includes('mower') || categoryLower.includes('trimmer')) {
    return 'Gardening';
  }
  // Automotive - car, vehicle tools
  if (categoryLower.includes('auto') || categoryLower.includes('car') || categoryLower.includes('vehicle') ||
      categoryLower.includes('mechanic')) {
    return 'Automotive';
  }
  // Plumbing - pipes, faucets, plumbing tools
  if (categoryLower.includes('plumb') || categoryLower.includes('pipe') || categoryLower.includes('drain') ||
      categoryLower.includes('faucet')) {
    return 'Plumbing';
  }
  // Electrical - wiring, electrical tools
  if (categoryLower.includes('electr') || categoryLower.includes('wire') || categoryLower.includes('voltage') ||
      categoryLower.includes('circuit')) {
    return 'Electrical';
  }
  // Painting - brushes, rollers, sprayers
  if (categoryLower.includes('paint') || categoryLower.includes('brush') || categoryLower.includes('roller') ||
      categoryLower.includes('sprayer')) {
    return 'Painting';
  }
  // Measuring - levels, tape measures, squares
  if (categoryLower.includes('measur') || categoryLower.includes('level') || categoryLower.includes('tape') ||
      categoryLower.includes('square') || categoryLower.includes('ruler')) {
    return 'Measuring';
  }
  // Safety - goggles, gloves, masks
  if (categoryLower.includes('safety') || categoryLower.includes('goggles') || categoryLower.includes('mask') ||
      categoryLower.includes('glove') || categoryLower.includes('helmet') || categoryLower.includes('protect')) {
    return 'Safety';
  }

  return 'Other';
}
