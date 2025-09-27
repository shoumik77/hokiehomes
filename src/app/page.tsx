"use client";

import { useState } from "react";
import LeafletMap from "@/components/LeafletMap";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

  const selected = results.filter((r) => compareIds.includes(r.id));

  return (
    <div className="min-h-screen font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-center bg-cover"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=2069&auto=format&fit=crop)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-black/40" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Badge className="mb-4">MVP</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            HokieHomes AI
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl">
            Natural‑language housing search for Virginia Tech students. Describe your ideal place — we'll parse it and rank matches.
          </p>
          <form
            className="mt-6 flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const text = query.trim();
              if (!text) return;
              // simple bridge to ChatSearch behavior via fetch
              fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: text }),
              })
                .then((r) => r.json())
                .then((d) => setResults(d.results || []))
                .catch(() => {});
            }}
          >
            <Input
              className="h-12 text-base bg-white/95"
              placeholder="Try: 2BR under $1,200 near VT, pet-friendly with a gym, ≤15-min bus"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" className="h-12 px-6">Search</Button>
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