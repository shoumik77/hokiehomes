import { Listing } from './mock-listings';

// VT coordinates
const VT_LAT = 37.2284;
const VT_LNG = -80.4234;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const API_CONFIG = {
  key: 'e72b031e5bmsh09b135d72a9f812p1daac6jsnbd790750bcc7',
  host: 'zillow-com1.p.rapidapi.com',
};

function transformToListing(data: any): Listing {
  // Use rent if available, otherwise use sale price but mark it differently
  const rentPrice = data.rentZestimate;
  const salePrice = data.price;
  const isRental = rentPrice && rentPrice > 0;
  
  return {
    id: data.zpid?.toString() || `zillow-${Math.random()}`,
    title: `${data.bedrooms || 0}BR ${data.bathrooms || 0}BA ${data.propertyType || 'Property'}`,
    address: data.address || 'Address not available',
    lat: parseFloat(data.latitude || 37.2284),
    lng: parseFloat(data.longitude || -80.4234),
    price: isRental ? rentPrice : Math.round((salePrice || 0) / 360), // Convert sale price to rough monthly
    bedrooms: parseInt(data.bedrooms || 0),
    bathrooms: parseFloat(data.bathrooms || 0),
    sqft: parseInt(data.livingArea || 0),
    petsAllowed: Math.random() > 0.5,
    amenities: isRental ? ['rental'] : ['for sale'],
    imageUrl: data.imgSrc || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    url: data.detailUrl,
  };
}

export async function fetchListings(params: {
  city?: string;
  state?: string;
  maxPrice?: number;
  minPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  nearVT?: boolean;
  limit?: number;
}): Promise<Listing[]> {
  try {
    const response = await fetch(`https://${API_CONFIG.host}/propertyExtendedSearch?location=${params.city || 'Blacksburg'}%2C%20${params.state || 'VA'}`, {
      headers: {
        'X-RapidAPI-Key': API_CONFIG.key,
        'X-RapidAPI-Host': API_CONFIG.host,
      },
    });

    if (!response.ok) {
      console.error(`Zillow API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const properties = data.props || [];
    
    console.log(`Total properties from API: ${properties.length}`);
    console.log('Sample property:', properties[0]);
    
    const results = properties
      .slice(0, params.limit || 50)
      .map(transformToListing)
      .filter((listing: Listing) => {
        if (params.minPrice && listing.price < params.minPrice) return false;
        if (params.maxPrice && listing.price > params.maxPrice) return false;
        if (params.minBedrooms && listing.bedrooms < params.minBedrooms) return false;
        if (params.maxBedrooms && listing.bedrooms > params.maxBedrooms) return false;
        if (typeof params.minBathrooms === 'number' && (listing.bathrooms ?? 0) < params.minBathrooms) return false;
        if (typeof params.maxBathrooms === 'number' && (listing.bathrooms ?? 0) > params.maxBathrooms) return false;
        if (params.nearVT) {
          const distance = calculateDistance(listing.lat, listing.lng, VT_LAT, VT_LNG);
          if (distance > 10) return false; // Only within 10 miles of VT
        }
        return listing.price > 0;
      });
    
    console.log(`Final filtered results: ${results.length}`);
    return results;
  } catch (error) {
    console.error('Zillow API failed:', error);
    return [];
  }
}