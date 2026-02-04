/**
 * UPC Lookup Script
 *
 * Fetches product data from UPC databases for tool seed data.
 * Usage: npx ts-node scripts/upc-lookup.ts [UPC_CODE]
 *
 * Examples:
 *   npx ts-node scripts/upc-lookup.ts 885911460491
 *   npx ts-node scripts/upc-lookup.ts --batch
 */

import axios from 'axios';

// UPCitemdb.com API (free tier - 100 requests/day)
const UPCITEMDB_API_URL = 'https://api.upcitemdb.com/prod/trial/lookup';

interface UpcLookupResult {
  found: boolean;
  upc: string;
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  error?: string;
}

// Known tool UPCs for batch lookup
const KNOWN_TOOL_UPCS = [
  // Power Tools
  '885911460491', // DeWalt DCD771C2 Drill
  '088381087094', // Makita 5007MGA Circular Saw
  '045242316687', // Milwaukee M18 Impact Driver
  '885911177801', // DeWalt DWE7491RS Table Saw
  '000346458909', // Bosch GWS8-45 Angle Grinder
  '885911782241', // Craftsman CMCW220B Orbital Sander

  // Outdoor Power
  '033287229819', // Ryobi RY142300 Pressure Washer
  '885911485005', // BLACK+DECKER LHT2220 Hedge Trimmer

  // Hand Tools
  '076174900163', // Stanley FatMax Tape Measure
  '076174121360', // Stanley No. 4 Plane
  '091162002471', // Bessey Clamp Set

  // Ladders & Other
  '051751047837', // Werner D1224-2 Ladder
  '648846065052', // Ridgid WD1851 Shop Vac

  // Festool (European barcode)
  '4014549043929', // Festool Domino DF 500
];

/**
 * Look up a single UPC code
 */
async function lookupUpc(upc: string): Promise<UpcLookupResult> {
  try {
    console.log(`Looking up UPC: ${upc}...`);

    const response = await axios.get(UPCITEMDB_API_URL, {
      params: { upc },
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    const data = response.data;

    if (data.code === 'OK' && data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        found: true,
        upc,
        name: item.title,
        brand: item.brand,
        model: item.model,
        description: item.description,
        category: item.category,
        imageUrl: item.images?.[0],
      };
    }

    return {
      found: false,
      upc,
      error: 'Product not found in database',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      found: false,
      upc,
      error: `Lookup failed: ${message}`,
    };
  }
}

/**
 * Generate SQL INSERT statement for a tool
 */
function generateSqlInsert(result: UpcLookupResult, toolId: string, ownerId: string): string {
  if (!result.found) {
    return `-- UPC ${result.upc}: ${result.error}`;
  }

  const name = result.name?.replace(/'/g, "''") || 'Unknown Tool';
  const description = result.description?.replace(/'/g, "''") || '';
  const brand = result.brand?.replace(/'/g, "''") || '';
  const model = result.model?.replace(/'/g, "''") || '';
  const category = mapCategory(result.category);

  return `
-- ${result.name}
INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
VALUES
    ('${toolId}', '${ownerId}',
     '${name}',
     '${description}',
     '${category}', '${brand}', '${model}', '${result.upc}', 'available', 1, 7);
`.trim();
}

/**
 * Map UPC database categories to our tool categories
 */
function mapCategory(upcCategory?: string): string {
  if (!upcCategory) return 'Other';

  const lower = upcCategory.toLowerCase();

  if (lower.includes('drill') || lower.includes('saw') || lower.includes('grinder') ||
      lower.includes('sander') || lower.includes('power tool')) {
    return 'Power Tools';
  }
  if (lower.includes('hand tool') || lower.includes('wrench') || lower.includes('screwdriver') ||
      lower.includes('plier') || lower.includes('clamp') || lower.includes('plane')) {
    return 'Hand Tools';
  }
  if (lower.includes('lawn') || lower.includes('garden') || lower.includes('outdoor') ||
      lower.includes('pressure washer') || lower.includes('trimmer')) {
    return 'Outdoor Power';
  }
  if (lower.includes('ladder') || lower.includes('scaffold')) {
    return 'Ladders & Scaffolding';
  }
  if (lower.includes('measure') || lower.includes('level') || lower.includes('tape')) {
    return 'Measuring & Layout';
  }

  return 'Other';
}

/**
 * Format result for console output
 */
function formatResult(result: UpcLookupResult): string {
  if (!result.found) {
    return `❌ ${result.upc}: ${result.error}`;
  }

  return `
✅ ${result.upc}
   Name:        ${result.name || 'N/A'}
   Brand:       ${result.brand || 'N/A'}
   Model:       ${result.model || 'N/A'}
   Category:    ${result.category || 'N/A'}
   Description: ${(result.description || 'N/A').substring(0, 100)}...
   Image:       ${result.imageUrl || 'N/A'}
`.trim();
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
UPC Lookup Tool
===============

Usage:
  npx ts-node scripts/upc-lookup.ts <UPC_CODE>     Look up a single UPC
  npx ts-node scripts/upc-lookup.ts --batch        Look up all known tool UPCs
  npx ts-node scripts/upc-lookup.ts --sql          Generate SQL for known UPCs

Examples:
  npx ts-node scripts/upc-lookup.ts 885911460491
  npx ts-node scripts/upc-lookup.ts --batch
`);
    return;
  }

  if (args[0] === '--batch') {
    console.log('Batch lookup of known tool UPCs...\n');
    console.log('Note: Free API has rate limits. Waiting 1s between requests.\n');

    for (const upc of KNOWN_TOOL_UPCS) {
      const result = await lookupUpc(upc);
      console.log(formatResult(result));
      console.log('---');

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return;
  }

  if (args[0] === '--sql') {
    console.log('Generating SQL for known tool UPCs...\n');
    console.log('Note: Free API has rate limits. This may take a while.\n');

    const ownerIds = [
      '11111111-1111-1111-1111-111111111111',
      '66666666-6666-6666-6666-666666666666',
      '77777777-7777-7777-7777-777777777777',
    ];

    let sqlOutput = '-- Generated tool inserts from UPC lookup\n\n';
    let toolIndex = 0;

    for (const upc of KNOWN_TOOL_UPCS) {
      const result = await lookupUpc(upc);
      const toolId = `UUUUUUUU-${String(toolIndex).padStart(4, '0')}-0000-0000-000000000000`;
      const ownerId = ownerIds[toolIndex % ownerIds.length];

      sqlOutput += generateSqlInsert(result, toolId, ownerId) + '\n\n';
      toolIndex++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(sqlOutput);
    return;
  }

  // Single UPC lookup
  const upc = args[0];
  const result = await lookupUpc(upc);
  console.log(formatResult(result));

  if (result.found) {
    console.log('\n--- SQL Insert ---');
    console.log(generateSqlInsert(
      result,
      'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      '11111111-1111-1111-1111-111111111111'
    ));
  }
}

main().catch(console.error);
