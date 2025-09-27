import { useState, useEffect } from 'react';
import { Listing } from '@/lib/mock-listings';

interface UseListingsParams {
  city?: string;
  state?: string;
  maxPrice?: number;
  minBedrooms?: number;
  limit?: number;
}

export function useListings(params: UseListingsParams = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'mock'>('mock');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams();
        
        if (params.city) searchParams.set('city', params.city);
        if (params.state) searchParams.set('state', params.state);
        if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
        if (params.minBedrooms) searchParams.set('minBedrooms', params.minBedrooms.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());

        const response = await fetch(`/api/listings?${searchParams}`);
        const data = await response.json();
        
        setListings(data.listings);
        setSource(data.source);
        setError(null);
      } catch (err) {
        setError('Failed to fetch listings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.city, params.state, params.maxPrice, params.minBedrooms, params.limit]);

  return { listings, loading, error, source };
}