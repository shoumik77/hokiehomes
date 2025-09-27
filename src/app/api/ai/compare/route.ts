import { NextRequest, NextResponse } from "next/server";

// Minimal listing shape we need for analysis
type ListingInput = {
  id: string;
  title: string;
  address?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  petsAllowed?: boolean;
  amenities?: string[];
  transitTimeMin?: number;
  walkTimeMin?: number;
  url?: string;
};

const SYSTEM_PROMPT = `You are a helpful rental advisor. Given a set of listings, analyze price fairness and give pros and cons for each.
Return a concise, opinionated comparison in Markdown with:
- A short intro sentence.
- A table comparing Title, Price (mo), BR/BA, Key Pros, Key Cons, Value (1-10).
- Bullet pros/cons per listing (3-5 total lines per listing).
- A final recommendation section with who each option is best for.
Keep it under 250 words. Avoid repeating the address. Use the user's query preferences if provided.`;

function buildUserPrompt(listings: ListingInput[], userQuery?: string) {
  const summary = listings
    .map((l) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      bedrooms: l.bedrooms ?? null,
      bathrooms: l.bathrooms ?? null,
      petsAllowed: !!l.petsAllowed,
      amenities: l.amenities ?? [],
      transitTimeMin: l.transitTimeMin ?? null,
      walkTimeMin: l.walkTimeMin ?? null,
      sqft: l.sqft ?? null,
      url: l.url ?? null,
    }))
    .slice(0, 8); // cap to keep prompt small

  return `User query (optional): ${userQuery || "(none)"}
Listings JSON:\n\n${JSON.stringify(summary)}`;
}

async function callGeminiMarkdown(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: SYSTEM_PROMPT }] },
          { parts: [{ text: prompt }] },
        ],
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.toString?.() ?? "";
  return text || null;
}

function heuristicAnalysis(listings: ListingInput[], userQuery?: string): string {
  // Simple fallback: compute average price and highlight relative value + basic pros/cons
  const priced = listings.filter((l) => typeof l.price === "number");
  const avg = priced.reduce((s, l) => s + l.price, 0) / Math.max(1, priced.length);

  const lines: string[] = [];
  lines.push(`Here’s a quick comparison${userQuery ? ` for: “${userQuery}”` : ""}.`);
  lines.push("");
  lines.push(`Average price across these picks: $${Math.round(avg).toLocaleString()}/mo.`);
  lines.push("");
  lines.push("Pros/Cons:");
  listings.slice(0, 8).forEach((l) => {
    const value = Math.max(1, Math.min(10, Math.round((avg / Math.max(1, l.price)) * 6)));
    const pros: string[] = [];
    const cons: string[] = [];
    if (l.price <= avg) pros.push("Good price vs. group average"); else cons.push("Pricier than average");
    if (l.petsAllowed) pros.push("Pet-friendly"); else cons.push("No pets");
    if ((l.amenities || []).includes("gym")) pros.push("On-site gym");
    if (typeof l.transitTimeMin === "number") {
      if (l.transitTimeMin <= 12) pros.push(`${l.transitTimeMin} min bus to VT`); else cons.push(`${l.transitTimeMin} min bus`);
    }
    lines.push(`- ${l.title} — Value ${value}/10`);
    if (pros.length) lines.push(`  - Pros: ${pros.slice(0, 3).join(", ")}`);
    if (cons.length) lines.push(`  - Cons: ${cons.slice(0, 3).join(", ")}`);
  });
  lines.push("");
  const best = listings.slice().sort((a, b) => a.price - b.price)[0];
  if (best) lines.push(`Recommendation: ${best.title} offers strong value for the price.`);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { listings, userQuery } = await req.json();
    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ analysis: "Please select at least one listing to compare." });
    }

    const prompt = buildUserPrompt(listings as ListingInput[], userQuery);
    const ai = await callGeminiMarkdown(prompt);
    if (ai) return NextResponse.json({ analysis: ai });

    // Fallback heuristic
    const fallback = heuristicAnalysis(listings as ListingInput[], userQuery);
    return NextResponse.json({ analysis: fallback });
  } catch (e) {
    console.error("AI compare route error:", e);
    return NextResponse.json({ analysis: "I couldn't analyze these right now. Please try again." });
  }
}
