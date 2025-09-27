export type Filters = {
  maxBedrooms?: number | null;
  minBedrooms?: number | null;
  maxPrice?: number | null;
  minPrice?: number | null;
  minBathrooms?: number | null;
  maxBathrooms?: number | null;
  nearVT?: boolean | null;
  city?: string | null;
  state?: string | null;
};

// Basic, deterministic extraction as a safety net for NL parsing
export function extractBasicFilters(queryRaw: string): Filters {
  const query = String(queryRaw || '').toLowerCase();

  // Bedrooms (e.g., "2br", "2 br", "2 bedrooms", "bedrooms 2")
  let minBedrooms: number | null = null;
  let maxBedrooms: number | null = null;
  const exactBr = query.match(/(?:^|\s)(\d+)\s*(?:br|bed(?:room)?s?)(?:\b|\s)/);
  if (exactBr) {
    minBedrooms = parseInt(exactBr[1], 10);
    maxBedrooms = parseInt(exactBr[1], 10);
  }
  // Ranges like 2-3br or 2 to 3 bedrooms
  const rangeBr = query.match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*(?:br|bed(?:room)?s?)/);
  if (rangeBr) {
    minBedrooms = parseInt(rangeBr[1], 10);
    maxBedrooms = parseInt(rangeBr[2], 10);
  }
  // Minimum like ">= 2br" or "at least 2 bedrooms"
  const minBr = query.match(/(?:>=|at\s*least|minimum|min)\s*(\d+)\s*(?:br|bed(?:room)?s?)/);
  if (minBr) {
    minBedrooms = parseInt(minBr[1], 10);
  }
  // Maximum like "<= 3br" or "max 3 bedrooms"
  const maxBr = query.match(/(?:<=|at\s*most|maximum|max|under)\s*(\d+)\s*(?:br|bed(?:room)?s?)/);
  if (maxBr) {
    maxBedrooms = parseInt(maxBr[1], 10);
  }

  // Bathrooms extraction similar to bedrooms
  let minBathrooms: number | null = null;
  let maxBathrooms: number | null = null;
  const rangeBa = query.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:ba|bath(?:room)?s?)/);
  if (rangeBa) {
    minBathrooms = parseFloat(rangeBa[1]);
    maxBathrooms = parseFloat(rangeBa[2]);
  }
  const exactBa = query.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:ba|bath(?:room)?s?)(?:\b|\s)/);
  if (exactBa) {
    minBathrooms = parseFloat(exactBa[1]);
    maxBathrooms = parseFloat(exactBa[1]);
  }
  const minBa = query.match(/(?:>=|at\s*least|minimum|min)\s*(\d+(?:\.\d+)?)\s*(?:ba|bath(?:room)?s?)/);
  if (minBa) {
    minBathrooms = parseFloat(minBa[1]);
  }
  const maxBa = query.match(/(?:<=|at\s*most|maximum|max|under)\s*(\d+(?:\.\d+)?)\s*(?:ba|bath(?:room)?s?)/);
  if (maxBa) {
    maxBathrooms = parseFloat(maxBa[1]);
  }

  // Price: capture most restrictive budget from phrases like under 1200, <= 1200, max 1200, $1200
  let maxPrice: number | null = null;
  let minPrice: number | null = null;
  const priceMatches: number[] = [];
  // Ranges like 1000-1500, between 1000 and 1500
  const range1 = query.match(/(\$?\d{3,5})\s*(?:-|to|–)\s*(\$?\d{3,5})/);
  if (range1) {
    const a = parseInt(range1[1].replace(/\$/g, ''), 10);
    const b = parseInt(range1[2].replace(/\$/g, ''), 10);
    minPrice = Math.min(a, b);
    maxPrice = Math.max(a, b);
  }
  const between = query.match(/between\s*\$?(\d{3,5})\s*(?:and|to)\s*\$?(\d{3,5})/);
  if (between) {
    const a = parseInt(between[1], 10);
    const b = parseInt(between[2], 10);
    minPrice = Math.min(a, b);
    maxPrice = Math.max(a, b);
  }
  const pricePatterns = [
    /under\s*\$?(\d{3,5})/g,
    /<=\s*\$?(\d{3,5})/g,
    /max(?:imum)?\s*\$?(\d{3,5})/g,
    /\$\s?(\d{3,5})/g,
    /(\d{3,5})\s*\$?/g,
  ];
  for (const re of pricePatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(query))) {
      priceMatches.push(parseInt(m[1], 10));
    }
  }
  if (priceMatches.length > 0) {
    maxPrice = Math.min(...priceMatches);
  }

  // near VT / campus / Virginia Tech
  const nearVT = /(\bvt\b|virginia\s*tech|campus|near\s*campus)/.test(query);

  // city/state simple extraction (very naive; defaults remain null)
  let city: string | null = null;
  let state: string | null = null;
  const cityMatch = query.match(/in\s+([a-z\s]+?)(?:,\s*([a-z]{2}))?(?:\b|$)/);
  if (cityMatch) {
    city = cityMatch[1].trim().replace(/\s+/g, ' ');
    if (cityMatch[2]) state = cityMatch[2].toUpperCase();
  }
  // Hardcode recognition of Blacksburg/VA keywords
  if (/blacksburg/.test(query)) city = city || 'Blacksburg';
  if (/(\bva\b|virginia)/.test(query)) state = state || 'VA';

  return { maxBedrooms, minBedrooms, maxPrice, minPrice, minBathrooms, maxBathrooms, nearVT, city, state };
}

// Merge two filter objects with precedence to primary when values are present
export function mergeFilters(primary: Filters, fallback: Filters): Filters {
  return {
    maxBedrooms: primary.maxBedrooms ?? fallback.maxBedrooms ?? null,
    minBedrooms: primary.minBedrooms ?? fallback.minBedrooms ?? null,
    maxPrice: primary.maxPrice ?? fallback.maxPrice ?? null,
    minPrice: primary.minPrice ?? fallback.minPrice ?? null,
    minBathrooms: primary.minBathrooms ?? fallback.minBathrooms ?? null,
    maxBathrooms: primary.maxBathrooms ?? fallback.maxBathrooms ?? null,
    nearVT: primary.nearVT ?? fallback.nearVT ?? null,
    city: primary.city ?? fallback.city ?? null,
    state: primary.state ?? fallback.state ?? null,
  };
}
