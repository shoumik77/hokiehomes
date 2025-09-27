"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapListing = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
};

export function LeafletMap({
  listings,
  className,
}: {
  listings: MapListing[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [37.2296, -80.4206], // Blacksburg, VA
        zoom: 12.2,
      });

      // OSM default tiles
      tileLayerRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(mapRef.current);
    }

    const map = mapRef.current!;

    // Sync markers
    const existing = new Set(Object.keys(markersRef.current));
    const incoming = new Set(listings.map((l) => l.id));

    // Remove stale markers
    for (const id of existing) {
      if (!incoming.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    }

    // Add/update markers
    listings.forEach((l) => {
      const el = document.createElement("div");
      el.className =
        "rounded-full bg-foreground text-background text-[11px] font-semibold px-2 py-1 shadow-md border border-black/10";
      el.textContent = `$${l.price}`;

      const icon = L.divIcon({ html: el, className: "", iconSize: undefined });

      const marker = L.marker([l.lat, l.lng], { icon })
        .bindPopup(
          `<div style="font-weight:600;margin-bottom:4px">${l.title}</div><div>$${l.price.toLocaleString()}</div>`
        )
        .addTo(map);

      if (markersRef.current[l.id]) {
        markersRef.current[l.id].remove();
      }
      markersRef.current[l.id] = marker;
    });

    // Fit bounds to markers
    if (listings.length > 0) {
      const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng]) as [number, number][]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      // nothing here; full cleanup in unmount effect below
    };
  }, [listings]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {} as Record<string, L.Marker>;
      tileLayerRef.current?.remove();
      tileLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden" />
    </div>
  );
}

export default LeafletMap;