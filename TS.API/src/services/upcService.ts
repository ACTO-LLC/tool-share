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
 * Look up product information by UPC code
 * Results are cached for 24 hours to reduce API calls
 */
export async function lookupUpc(upc: string): Promise<UpcLookupResult> {
  // Normalize UPC (remove any non-digit characters)
  const normalizedUpc = upc.replace(/\D/g, '');

  if (!normalizedUpc) {
    return { found: false };
  }

  // Check cache first
  const cached = upcCache.get(normalizedUpc);
  if (cached && isCacheValid(cached)) {
    console.log(`UPC cache hit for: ${normalizedUpc}`);
    return cached.result;
  }

  try {
    console.log(`UPC API lookup for: ${normalizedUpc}`);
    const response = await axios.get<UpcItemDbResponse>(config.UPCITEMDB_API_URL, {
      params: { upc: normalizedUpc },
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    let result: UpcLookupResult;

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      result = {
        found: true,
        name: item.title,
        brand: item.brand,
        model: item.model,
        description: item.description,
        category: mapCategory(item.category),
        imageUrl: item.images?.[0],
      };
    } else {
      result = { found: false };
    }

    // Cache the result (including not-found results to avoid repeated API calls)
    upcCache.set(normalizedUpc, {
      result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('UPC lookup error:', error);
    // Don't cache errors - allow retry
    return { found: false };
  }
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
