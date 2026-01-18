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

export async function lookupUpc(upc: string): Promise<UpcLookupResult> {
  try {
    const response = await axios.get<UpcItemDbResponse>(config.UPCITEMDB_API_URL, {
      params: { upc },
      headers: {
        'Accept': 'application/json',
      },
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
  } catch (error) {
    console.error('UPC lookup error:', error);
    return { found: false };
  }
}

export async function searchProducts(query: string): Promise<Array<{
  upc: string;
  name: string;
  brand?: string;
}>> {
  try {
    // Note: UPCitemdb free tier doesn't support search
    // This is a placeholder for when we upgrade or use a different API
    console.log('Product search query:', query);
    return [];
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}

function mapCategory(upcCategory?: string): string {
  if (!upcCategory) return 'Other';

  const categoryLower = upcCategory.toLowerCase();

  if (categoryLower.includes('power') || categoryLower.includes('drill') || categoryLower.includes('saw')) {
    return 'Power Tools';
  }
  if (categoryLower.includes('hand') || categoryLower.includes('wrench') || categoryLower.includes('hammer')) {
    return 'Hand Tools';
  }
  if (categoryLower.includes('garden') || categoryLower.includes('lawn') || categoryLower.includes('yard')) {
    return 'Garden/Yard';
  }
  if (categoryLower.includes('auto') || categoryLower.includes('car') || categoryLower.includes('vehicle')) {
    return 'Automotive';
  }
  if (categoryLower.includes('kitchen') || categoryLower.includes('cooking')) {
    return 'Kitchen';
  }
  if (categoryLower.includes('camp') || categoryLower.includes('outdoor') || categoryLower.includes('hiking')) {
    return 'Camping/Outdoor';
  }
  if (categoryLower.includes('electronic') || categoryLower.includes('tech')) {
    return 'Electronics';
  }

  return 'Other';
}
