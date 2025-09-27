"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Ensure CSP-safe worker (works in iframes and strict CSP environments)
if (typeof window !== "undefined" && !(maplibregl as any).workerClass) {
  // @ts-ignore - construct worker from module URL
  (maplibregl as any).workerClass = class MapLibreWorker extends Worker {
    constructor() {
      // @ts-ignore - Next.js supports new URL(..., import.meta.url)
      return new Worker(
        new URL("maplibre-gl/dist/maplibre-gl-csp-worker.js", import.meta.url),
        { type: "module" }
      );
    }
  };
}

export type MapListing = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
};

export function MapboxMap({
  listings,
  className,
}: {
  listings: MapListing[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  // Use an OpenMapTiles/OSM-compatible style (configurable via env, with a sensible public default)
  const styleUrl =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json";

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [-80.4206, 37.2296], // Blacksburg, VA
        zoom: 12.2,
      });

      mapRef.current.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right"
      );
    }

    const map = mapRef.current;

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

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([l.lng, l.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<div style="font-weight:600;margin-bottom:4px">${l.title}</div><div>$${l.price.toLocaleString()}</div>`
          )
        )
        .addTo(map as maplibregl.Map);

      // Replace existing if present
      if (markersRef.current[l.id]) {
        markersRef.current[l.id].remove();
      }
      markersRef.current[l.id] = marker;
    });

    // Fit bounds to markers
    if (listings.length > 0 && map) {
      const bounds = new maplibregl.LngLatBounds();
      listings.forEach((l) => bounds.extend([l.lng, l.lat]));
      (map as maplibregl.Map).fitBounds(bounds, { padding: 40, duration: 500, maxZoom: 14 });
    }

    return () => {
      // do not destroy map on unmounting effect; handled by component unmount
    };
  }, [listings, styleUrl]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {} as Record<string, maplibregl.Marker>;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden" />
    </div>
  );
}

export default MapboxMap;