import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Parse this apartment search query and extract filters. Return JSON only:
Query: "${query}"

Extract:
- maxBedrooms (number or null)
- minBedrooms (number or null) 
- maxPrice (number or null)
- nearVT (boolean - true if mentions VT, Virginia Tech, campus, near campus)
- city (string or null)

Example: "2 bedroom max under $1200 near VT" → {"maxBedrooms":2,"minBedrooms":null,"maxPrice":1200,"nearVT":true,"city":null}`
          }]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[^}]*\}/);
    const filters = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    return NextResponse.json({ filters });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ filters: {} });
  }
}