"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const LeafletMap = dynamic(() => import("@/components/LeafletMap").then(m => m.default), { ssr: false });

export type Result = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  petsAllowed: boolean;
  amenities: string[];
  imageUrl: string;
  explanation: string[];
  url?: string;
  score?: number;
};

export default function Home() {
  const [results, setResults] = useState<Result[]>([]);
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  const loadRealListingsWithFilters = async (filters: any) => {
    try {
      let url = `/api/listings?city=${filters.city || 'Blacksburg'}&state=${filters.state || 'VA'}`;
      if (filters.maxBedrooms) url += `&maxBedrooms=${filters.maxBedrooms}`;
      if (filters.minBedrooms) url += `&minBedrooms=${filters.minBedrooms}`;
      if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
      if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
      if (filters.minBathrooms) url += `&minBathrooms=${filters.minBathrooms}`;
      if (filters.maxBathrooms) url += `&maxBathrooms=${filters.maxBathrooms}`;
      if (filters.nearVT) url += '&nearVT=true';
      
      const response = await fetch(url);
      const data = await response.json();
      const listings = data.listings.map((listing: any) => ({
        ...listing,
        explanation: [`${listing.bedrooms} bedroom property`, `$${listing.price}`, listing.address]
      }));
      setResults(listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selected = results.filter((r) => compareIds.includes(r.id));

  return (
    <div className="min-h-screen font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Vercel-like dark gradient background with subtle grid */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-neutral-900 to-black" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(transparent_1px,rgba(0,0,0,0.9)_1px)] [background-size:16px_16px]" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Badge className="mb-4">MVP</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            HokieHomes AI
          </h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Natural‑language housing search for Virginia Tech students. Describe your ideal place — we'll parse it and rank matches.
          </p>
          <form
            className="mt-6 flex flex-col sm:flex-row gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const text = query.trim();
              if (!text) return;
              
              setLoading(true);
              try {
                // Use Gemini to parse natural language
                const parseResponse = await fetch('/api/parse-query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: text })
                });
                const { filters } = await parseResponse.json();
                
                loadRealListingsWithFilters(filters);
              } catch (error) {
                console.error('Parse error:', error);
                loadRealListingsWithFilters({});
              }
            }}
          >
            <Input
              className="h-12 text-base bg-white/5 text-white placeholder:text-white/50 border-white/10 focus-visible:ring-white/30"
              placeholder="Try: 2BR under $1,200 near VT, pet-friendly with a gym, ≤15-min bus"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="h-12 px-6 bg-gradient-to-b from-white to-neutral-300 text-black hover:from-white hover:to-white border border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-6 py-8">
        {/* Left: results */}
        <div className="lg:col-span-1 space-y-4">
          {selected.length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Comparing {selected.length} homes</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {selected.map((s) => (
                  <Badge key={s.id} variant="secondary">{s.title}</Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={aiLoading}
                  onClick={async () => {
                    try {
                      setAiLoading(true);
                      const payload = {
                        userQuery: query,
                        listings: selected.map((s) => ({
                          id: s.id,
                          title: s.title,
                          address: s.address,
                          price: s.price,
                          bedrooms: s.bedrooms,
                          bathrooms: s.bathrooms,
                          sqft: s.sqft,
                          petsAllowed: s.petsAllowed,
                          amenities: s.amenities,
                          lat: s.lat,
                          lng: s.lng,
                          url: s.url,
                        })),
                      };
                      const res = await fetch('/api/ai/compare', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      const data = await res.json();
                      setAiAnalysis(String(data.analysis || ''));
                    } catch (e) {
                      setAiAnalysis("I couldn't analyze these right now. Please try again.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  {aiLoading ? 'Analyzing…' : 'Ask AI to compare'}
                </Button>
                {aiAnalysis && (
                  <Button size="sm" variant="secondary" onClick={() => setAiAnalysis("")}>Clear</Button>
                )}
              </div>
              {aiAnalysis && (
                <div className="mt-3 whitespace-pre-wrap text-sm bg-background/60 border rounded-md p-3">
                  {aiAnalysis}
                </div>
              )}
            </div>
          )}

          <div className="lg:max-h-[70vh] lg:overflow-y-auto pr-1">
            <div className="grid sm:grid-cols-2 gap-4">
              {results.map((r) => (
                <ListingCard
                  key={r.id}
                  data={r}
                  selected={compareIds.includes(r.id)}
                  onToggleCompare={(id) =>
                    setCompareIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: map */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <div className="h-[420px] lg:h-[70vh] rounded-xl overflow-hidden border">
            <LeafletMap
              listings={results.map((r) => ({
                id: r.id,
                title: r.title,
                lat: r.lat,
                lng: r.lng,
                price: r.price,
              }))}
              className="h-full"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <div>© {new Date().getFullYear()} HokieHomes AI</div>
          <div>
            Built with Leaflet + OSM, mock API, and ready for Gemini + Postgres integration.
          </div>
        </div>
      </footer>
    </div>
  );
}