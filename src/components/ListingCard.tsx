"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ListingResult = {
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

export default function ListingCard({
  data,
  selected,
  onToggleCompare,
}: {
  data: ListingResult;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}) {
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition", selected && "ring-2 ring-primary")}> 
      <div className="relative h-40 w-full">
        <Image
          src={data.imageUrl}
          alt={data.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-sm font-semibold">
          ${data.price.toLocaleString()}/mo
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {data.title}
          {typeof data.score === "number" && (
            <Badge variant="secondary">Score {data.score.toFixed(1)}</Badge>
          )}
        </CardTitle>
        <div className="text-sm text-muted-foreground">{data.address}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge>{data.bedrooms} BR</Badge>
          <Badge variant="outline">{data.bathrooms} BA</Badge>
          {data.sqft && <Badge variant="outline">{data.sqft} sqft</Badge>}
          <Badge variant={data.petsAllowed ? "default" : "secondary"}>
            {data.petsAllowed ? "Pet-friendly" : "No pets"}
          </Badge>
        </div>
        {data.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.amenities.slice(0, 5).map((a) => (
              <Badge key={a} variant="secondary">{a}</Badge>
            ))}
          </div>
        )}
        {data.explanation?.length > 0 && (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {data.explanation.slice(0, 3).map((why, idx) => (
              <li key={idx}>{why}</li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          {data.url && (
            <Button asChild size="sm">
              <a href={data.url} target="_blank" rel="noreferrer">View</a>
            </Button>
          )}
          {onToggleCompare && (
            <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => onToggleCompare?.(data.id)}>
              {selected ? "In compare" : "Compare"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}