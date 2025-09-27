"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type SearchResult = {
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

export default function ChatSearch({
  onResults,
}: {
  onResults?: (results: SearchResult[], meta?: any) => void;
}) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me what you're looking for near Virginia Tech — for example: ‘2BR under $1,200 near VT, pet-friendly with a gym, ≤15-min bus’.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      const count = data?.results?.length ?? 0;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: count
            ? `I found ${count} places that fit. I ranked them and updated the map.`
            : "I couldn't find matches. Try adjusting price, bedrooms, or amenities.",
        },
      ]);
      onResults?.(data.results || [], { filters: data.filters, query: data.query });
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-60 rounded-md border p-3 bg-background">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block px-3 py-2 rounded-lg text-sm " +
                  (m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground">Thinking…</div>}
        </div>
      </ScrollArea>
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., 2BR under $1200, pet-friendly, gym, ≤15-min bus"
        />
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>
    </div>
  );
}