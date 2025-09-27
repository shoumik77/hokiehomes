import { NextResponse } from "next/server";
import { MOCK_LISTINGS, type Listing } from "@/lib/mock-listings";

function extractFilters(query: string) {
  const q = query.toLowerCase();
  const bedroomsMatch = q.match(/(\d+)\s*br|bed(room)?s?\s*(\d+)/);
  const bedrooms = bedroomsMatch
    ? parseInt(bedroomsMatch[1] || bedroomsMatch[3])
    : undefined;

  const priceMatch = q.match(/\$?([0-9]{3,4})\s*(max|under|<|<=)?|under\s*\$?([0-9]{3,4})/);
  const maxPrice = priceMatch
    ? Math.min(
        ...[priceMatch[1], priceMatch[3]]
          .filter(Boolean)
          .map((v) => parseInt(v as string))
      )
    : undefined;

  const pets = /pet-?friendly|pets? allowed|dog|cat/.test(q);
  const wantsGym = /gym|fitness/.test(q);
  const busTimeMatch = q.match(/(<=|<|under)?\s*(\d{1,2})\s*(-|\s*)?min(ute)?s?\s*(bus|transit)/);
  const maxBus = busTimeMatch ? parseInt(busTimeMatch[2]) : undefined;

  return { bedrooms, maxPrice, pets, wantsGym, maxBus };
}

function scoreListing(listing: Listing, f: ReturnType<typeof extractFilters>) {
  let score = 0;
  const reasons: string[] = [];

  if (typeof f.bedrooms === "number") {
    if (listing.bedrooms === f.bedrooms) {
      score += 2;
      reasons.push(`${listing.bedrooms}BR matches your request`);
    } else if (listing.bedrooms > f.bedrooms) {
      score += 1;
      reasons.push(`${listing.bedrooms}BR gives extra room`);
    }
  }

  if (typeof f.maxPrice === "number") {
    if (listing.price <= f.maxPrice) {
      const savings = f.maxPrice - listing.price;
      score += 2;
      reasons.push(`$${listing.price.toLocaleString()} fits under $${f.maxPrice.toLocaleString()}`);
      if (savings >= 100) reasons.push(`Save about $${savings} vs your budget`);
    } else {
      score -= 1;
      reasons.push(`Over budget by $${(listing.price - f.maxPrice).toLocaleString()}`);
    }
  }

  if (f.pets) {
    if (listing.petsAllowed) {
      score += 2;
      reasons.push("Pet-friendly");
    } else {
      score -= 2;
      reasons.push("No pets allowed");
    }
  }

  if (f.wantsGym) {
    if (listing.amenities.includes("gym")) {
      score += 1.5;
      reasons.push("On-site gym");
    } else {
      score -= 0.5;
      reasons.push("No gym mentioned");
    }
  }

  if (typeof f.maxBus === "number" && typeof listing.transitTimeMin === "number") {
    if (listing.transitTimeMin <= f.maxBus) {
      score += 1.5;
      reasons.push(`${listing.transitTimeMin} min by bus to VT`);
    } else {
      score -= 0.5;
      reasons.push(`${listing.transitTimeMin} min bus (over your ${f.maxBus} min target)`);
    }
  }

  // Mild proximity preference to campus (if data present)
  if (typeof listing.walkTimeMin === "number") {
    score += Math.max(0, 20 - Math.min(20, listing.walkTimeMin)) * 0.03;
  }

  return { score, reasons };
}

export async function POST(req: Request) {
  const { query } = await req.json();
  const filters = extractFilters(String(query || ""));

  const ranked = MOCK_LISTINGS.map((l) => {
    const { score, reasons } = scoreListing(l, filters);
    return { ...l, _score: score, _reasons: reasons } as Listing & {
      _score: number;
      _reasons: string[];
    };
  })
    .sort((a, b) => b._score - a._score)
    .slice(0, 12);

  return NextResponse.json({
    query,
    filters,
    results: ranked.map((r) => ({
      id: r.id,
      title: r.title,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      price: r.price,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      sqft: r.sqft,
      petsAllowed: r.petsAllowed,
      amenities: r.amenities,
      imageUrl: r.imageUrl,
      transitTimeMin: r.transitTimeMin,
      walkTimeMin: r.walkTimeMin,
      url: r.url,
      explanation: r._reasons,
      score: Number(r._score.toFixed(2)),
    })),
  });
}