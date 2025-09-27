import { useListings } from '@/hooks/use-listings';
import ListingCard from './ListingCard';
import { Badge } from './ui/badge';

interface ListingsViewProps {
  city?: string;
  maxPrice?: number;
  minBedrooms?: number;
}

export default function ListingsView({ city, maxPrice, minBedrooms }: ListingsViewProps) {
  const { listings, loading, error, source } = useListings({
    city: city || 'Blacksburg',
    state: 'VA',
    maxPrice,
    minBedrooms,
    limit: 50,
  });

  if (loading) return <div className="text-center py-8">Loading listings...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Listings</h2>
        <Badge variant={source === 'api' ? 'default' : 'secondary'}>
          {source === 'api' ? 'Live Data' : 'Demo Data'}
        </Badge>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            data={{
              ...listing,
              explanation: [`${listing.bedrooms}BR/${listing.bathrooms}BA`, `${listing.sqft} sqft`],
            }}
            selected={false}
            onToggleCompare={() => {}}
          />
        ))}
      </div>
    </div>
  );
}