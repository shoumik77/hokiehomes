import { NextRequest, NextResponse } from 'next/server';
import { fetchListings } from '../../../lib/listing-api';

export async function POST(request: NextRequest) {
  try {
    const { selectedListings } = await request.json();
    
    // Get all available properties from Zillow
    const allProperties = await fetchListings({
      city: 'Blacksburg',
      state: 'VA',
      limit: 100
    });
    
    // Filter out already selected properties
    const selectedIds = selectedListings.map((l: any) => l.id);
    const availableProperties = allProperties.filter(p => !selectedIds.includes(p.id));
    
    // Calculate preferences from selected properties
    const avgPrice = selectedListings.reduce((sum: number, l: any) => sum + l.price, 0) / selectedListings.length;
    const avgBedrooms = selectedListings.reduce((sum: number, l: any) => sum + l.bedrooms, 0) / selectedListings.length;
    
    // Find similar properties
    const similarProperties = availableProperties
      .filter(p => {
        const priceDiff = Math.abs(p.price - avgPrice) / avgPrice;
        const bedroomMatch = Math.abs(p.bedrooms - avgBedrooms) <= 1;
        return priceDiff < 0.4 && bedroomMatch;
      })
      .sort((a, b) => Math.abs(a.price - avgPrice) - Math.abs(b.price - avgPrice))
      .slice(0, 3);
    
    const priceRange = `$${Math.round(avgPrice * 0.8)}-${Math.round(avgPrice * 1.2)}`;
    const bedroomText = Math.round(avgBedrooms) === 1 ? '1 bedroom' : `${Math.round(avgBedrooms)} bedroom`;
    
    const analysisText = `Based on your ${selectedListings.length} selected properties, you prefer ${bedroomText} properties around ${priceRange}. Here are similar options:\n\n${similarProperties.map(p => `• ${p.title} - ${p.address} - $${p.price}`).join('\n')}`;
    
    return NextResponse.json({
      analysis: analysisText
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({
      analysis: "Unable to analyze your preferences. Please try selecting more properties."
    });
  }
}