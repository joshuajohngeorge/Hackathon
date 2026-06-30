import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface RentalListing {
  building_or_title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  source_url: string;
  method: string;
  address_used_for_geocoding: string;
  latitude: number;
  longitude: number;
  zip_code: string;
  distance_from_uiuc_miles: number;
}

export interface ComparisonResult {
  targetPrice: number;
  targetLatitude?: number;
  targetLongitude?: number;
  averageNearbyPrice: number;
  priceDifference: number; // positive means target is more expensive
  percentageDifference: number;
  nearbyListingsCount: number;
  nearbyListings: RentalListing[];
  radiusUsed: number;
  comparisonBasis: "radius" | "closest" | "overall";
  comparisonLabel: string;
}

function hasPrice(listing: RentalListing): boolean {
  return typeof listing.price === "number" && listing.price > 0;
}

function hasCoordinates(listing: RentalListing): boolean {
  return typeof listing.latitude === "number" && typeof listing.longitude === "number";
}

function matchesBedrooms(listing: RentalListing, targetBedrooms?: number): boolean {
  return targetBedrooms === undefined || listing.bedrooms === targetBedrooms;
}

function averagePrice(listings: RentalListing[]): number {
  if (listings.length === 0) return 0;

  const totalPrice = listings.reduce((sum, listing) => sum + listing.price, 0);
  return totalPrice / listings.length;
}

function buildComparisonResult(
  targetPrice: number,
  comparableListings: RentalListing[],
  radiusUsed: number,
  comparisonBasis: ComparisonResult["comparisonBasis"],
  comparisonLabel: string,
  targetLatitude?: number,
  targetLongitude?: number
): ComparisonResult {
  const averageNearbyPrice = averagePrice(comparableListings);
  const priceDifference = targetPrice - averageNearbyPrice;
  const percentageDifference = averageNearbyPrice > 0
    ? (priceDifference / averageNearbyPrice) * 100
    : 0;

  return {
    targetPrice,
    targetLatitude,
    targetLongitude,
    averageNearbyPrice,
    priceDifference,
    percentageDifference,
    nearbyListingsCount: comparableListings.length,
    nearbyListings: comparableListings,
    radiusUsed,
    comparisonBasis,
    comparisonLabel
  };
}

/**
 * Calculate the great circle distance between two points on the earth (specified in decimal degrees)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);

  const RADIUS_OF_EARTH_IN_MILES = 3958.8;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  const radLat1 = toRadian(lat1);
  const radLat2 = toRadian(lat2);

  const a = Math.pow(Math.sin(dLat / 2), 2) + 
            Math.pow(Math.sin(dLon / 2), 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  return RADIUS_OF_EARTH_IN_MILES * c;
}

/**
 * Loads and parses the uiuc_rentals_clean.csv file
 */
export function loadRentalListings(): RentalListing[] {
  const filePath = path.join(process.cwd(), 'uiuc_rentals_clean.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const { data } = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // Automatically converts numbers
  });

  return data as RentalListing[];
}

/**
 * Retrieves a list of unique addresses from the dataset for the frontend dropdown.
 */
export function getUniqueAddresses(): { address: string; latitude: number; longitude: number }[] {
  const listings = loadRentalListings();
  const addressMap = new Map<string, { address: string; latitude: number; longitude: number }>();

  listings.forEach(listing => {
    if (listing.address_used_for_geocoding && listing.latitude && listing.longitude) {
      if (!addressMap.has(listing.address_used_for_geocoding)) {
        addressMap.set(listing.address_used_for_geocoding, {
          address: listing.address_used_for_geocoding,
          latitude: listing.latitude,
          longitude: listing.longitude
        });
      }
    }
  });

  // Sort alphabetically
  return Array.from(addressMap.values()).sort((a, b) => a.address.localeCompare(b.address));
}

/**
 * Geocodes an address string using the free OpenStreetMap Nominatim API.
 * NOTE: Nominatim requires a user-agent and has strict rate limits.
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const hasLocalContext = /\b(champaign|urbana|savoy|illinois|il)\b/i.test(address);
    const query = hasLocalContext ? address : `${address}, Champaign, IL`;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "us");
    url.searchParams.set("viewbox", "-88.45,40.22,-88.05,39.95");
    url.searchParams.set("bounded", "0");

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        'User-Agent': 'LeaseCheckApp/1.0'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
  }
  return null;
}

/**
 * Compares a target listing against similar listings within an expanding radius
 * 
 * @param targetLat Latitude of the target location
 * @param targetLon Longitude of the target location
 * @param targetPrice Price of the target rental
 * @param targetBedrooms Number of bedrooms (optional, to filter for similar units)
 * @param startRadiusMiles The initial radius in miles to search for comparable listings (default: 1.0)
 * @param maxRadiusMiles The maximum radius to expand to if no listings are found (default: 5.0)
 * @returns ComparisonResult object with stats and matched listings
 */
export function compareListing(
  targetLat: number, 
  targetLon: number, 
  targetPrice: number, 
  targetBedrooms?: number,
  startRadiusMiles: number = 1.0,
  maxRadiusMiles: number = 5.0
): ComparisonResult {
  const listings = loadRentalListings();
  
  let nearbyListings: RentalListing[] = [];
  let currentRadius = startRadiusMiles;
  const bedroomMatchedListings = listings.filter((listing) => (
    hasCoordinates(listing) && hasPrice(listing) && matchesBedrooms(listing, targetBedrooms)
  ));
  const coordinateListings = bedroomMatchedListings.length > 0
    ? bedroomMatchedListings
    : listings.filter((listing) => hasCoordinates(listing) && hasPrice(listing));

  // Expanding radius search
  while (currentRadius <= maxRadiusMiles) {
    nearbyListings = coordinateListings.filter((listing) => {
      const distance = haversineDistance(targetLat, targetLon, listing.latitude, listing.longitude);
      return distance <= currentRadius;
    });

    if (nearbyListings.length > 0) {
      break; // Found listings, stop expanding
    }

    currentRadius += 1.0;
  }

  if (nearbyListings.length > 0) {
    return buildComparisonResult(
      targetPrice,
      nearbyListings,
      currentRadius,
      "radius",
      `similar listings within a ${currentRadius}-mile radius`,
      targetLat,
      targetLon
    );
  }

  if (coordinateListings.length > 0) {
    const closestListings = coordinateListings
      .map((listing) => ({
        listing,
        distance: haversineDistance(targetLat, targetLon, listing.latitude, listing.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
    const radiusUsed = Math.ceil(closestListings[closestListings.length - 1].distance * 10) / 10;

    return buildComparisonResult(
      targetPrice,
      closestListings.map(({ listing }) => listing),
      radiusUsed,
      "closest",
      `the ${closestListings.length} closest available listings`,
      targetLat,
      targetLon
    );
  }

  return compareListingToOverallAverage(targetPrice, targetBedrooms);
}

export function compareListingToOverallAverage(
  targetPrice: number,
  targetBedrooms?: number
): ComparisonResult {
  const listings = loadRentalListings();
  const bedroomMatchedListings = listings.filter((listing) => hasPrice(listing) && matchesBedrooms(listing, targetBedrooms));
  const comparableListings = bedroomMatchedListings.length > 0
    ? bedroomMatchedListings
    : listings.filter(hasPrice);

  return buildComparisonResult(
    targetPrice,
    comparableListings,
    0,
    "overall",
    "the overall available market average"
  );
}
