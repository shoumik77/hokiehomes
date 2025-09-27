import { NextRequest, NextResponse } from 'next/server';
import { fetchListings } from '../../../lib/listing-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const params = {
    city: searchParams.get('city') || 'Blacksburg',
    state: searchParams.get('state') || 'VA',
    maxBedrooms: searchParams.get('maxBedrooms') ? parseInt(searchParams.get('maxBedrooms')!) : undefined,
    minBedrooms: searchParams.get('minBedrooms') ? parseInt(searchParams.get('minBedrooms')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    nearVT: searchParams.get('nearVT') === 'true',
    limit: 50
  };

  try {
    const zillowListings = await fetchListings(params);
    return NextResponse.json({ listings: zillowListings, source: 'zillow' });
  } catch (error) {
    console.error('Zillow API error:', error);
    return NextResponse.json({ listings: [], error: 'Failed to fetch listings' });
  }
}