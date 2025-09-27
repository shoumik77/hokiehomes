import { NextRequest, NextResponse } from 'next/server';
import { extractBasicFilters, mergeFilters, type Filters } from '@/lib/nl-filters';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const local: Filters = extractBasicFilters(String(query || ''));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback to deterministic filters if no key configured
      return NextResponse.json({ filters: local });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a strict JSON generator. Given a natural-language apartment search query, extract a JSON object with EXACTLY these keys and no extra text.
Keys: {"maxBedrooms": number|null, "minBedrooms": number|null, "maxPrice": number|null, "minPrice": number|null, "minBathrooms": number|null, "maxBathrooms": number|null, "nearVT": boolean|null, "city": string|null, "state": string|null}
Return ONLY minified JSON, no prose.
Query: ${String(query || '')}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // Try to parse as JSON directly first, otherwise attempt to extract a JSON block
    let gemini: Filters = {} as Filters;
    try {
      gemini = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          gemini = JSON.parse(jsonMatch[0]);
        } catch {
          gemini = {} as Filters;
        }
      }
    }

    const merged = mergeFilters(gemini || ({} as Filters), local);
    return NextResponse.json({ filters: merged });
  } catch (error) {
    console.error('Gemini API error:', error);
    // On any failure, still provide deterministic filters
    try {
      const { query } = await request.json();
      const fallback = extractBasicFilters(String(query || ''));
      return NextResponse.json({ filters: fallback });
    } catch {
      return NextResponse.json({ filters: {} });
    }
  }
}