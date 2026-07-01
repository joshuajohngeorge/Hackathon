"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { compareRentalAction, CompareActionState } from "./actions";
import type { ComparisonResult, RentalListing } from "@/lib/compareListings";
import { Home as HomeIcon, MapPin, DollarSign, BedDouble, LocateFixed, Search } from "lucide-react";

const initialState: CompareActionState = { success: false };

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type LocationMode = "current" | "address";

export function CompareForm() {
  const [state, formAction, isPending] = useActionState(compareRentalAction, initialState);
  const [locationMode, setLocationMode] = useState<LocationMode>("current");
  const [location, setLocation] = useState<LocationState | null>(null);
  const [address, setAddress] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  function requestCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Location access is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied."
          : "Could not get your current location. Please try again.";

        setLocation(null);
        setLocationError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (locationMode === "current" && !location) {
      event.preventDefault();
      requestCurrentLocation();
    }
  }

  function formatAccuracy(feet: number) {
    if (feet >= 5280) {
      return `${(feet / 5280).toFixed(1)} mi`;
    }

    return `${Math.round(feet)} ft`;
  }

  const locationAccuracyFeet = location ? location.accuracy * 3.28084 : 0;
  const canSubmit = locationMode === "current"
    ? Boolean(location) && !isPending
    : address.trim().length > 0 && !isPending;
  const displayedMarketPrice = state.data?.averageNearbyPrice
    ? Math.round(state.data.averageNearbyPrice * 1.08)
    : 0;
  const displayedPriceDifference = state.data
    ? state.data.targetPrice - displayedMarketPrice
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/beaver.png" alt="Lease Beaver" className="h-16 w-auto object-contain" />
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Form Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[560px] h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Compare Rental Price</h1>
            <p className="text-gray-600 text-sm">Use your current location or enter a location to compare rent against nearby listings.</p>
          </div>

          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="locationMode" value={locationMode} />
            <input type="hidden" name="latitude" value={location?.latitude ?? ""} />
            <input type="hidden" name="longitude" value={location?.longitude ?? ""} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Source</label>
              <div className="grid grid-cols-2 rounded-lg border border-gray-300 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("current");
                    setLocationError("");
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    locationMode === "current" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Current Location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("address");
                    setLocationError("");
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    locationMode === "address" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Enter Location
                </button>
              </div>
            </div>

            {locationMode === "current" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <div className="rounded-lg border border-gray-300 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                        <MapPin className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {location ? "Location ready" : "Location needed"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {location
                            ? `Accuracy about ${formatAccuracy(locationAccuracyFeet)}`
                            : "Your browser will ask for permission"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={requestCurrentLocation}
                    disabled={isLocating}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                  >
                    {isLocating ? (
                      <div className="h-4 w-4 rounded-full border-2 border-green-200 border-t-green-700 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                    {location ? "Refresh Location" : "Use Current Location"}
                  </button>
                </div>
                {locationError && (
                  <p className="mt-2 text-sm text-red-600">{locationError}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="e.g. 301 E Green St, Champaign, IL"
                    className="pl-10 w-full rounded-lg border-gray-300 border p-2.5 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    name="price" 
                    placeholder="900" 
                    required
                    min="0"
                    className="pl-10 w-full rounded-lg border-gray-300 border p-2.5 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BedDouble className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    name="bedrooms" 
                    placeholder="2" 
                    min="1"
                    className="pl-10 w-full rounded-lg border-gray-300 border p-2.5 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Rent Fairness
                </>
              )}
            </button>

            {state.error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {state.error}
              </div>
            )}
          </form>
          </div>

          {/* Results Section */}
          <div className="min-h-[560px] h-full">
            {state.success && state.data ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Comparison Results</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Price</p>
                  <p className="text-2xl font-bold text-gray-900">${state.data.targetPrice}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                  <p className="text-sm text-green-700 mb-1">Market Avg</p>
                  <p className="text-2xl font-bold text-green-700 leading-tight">
                    {displayedMarketPrice > 0 ? `$${displayedMarketPrice}` : "N/A"}
                  </p>
                  <p className="text-xs font-medium text-green-700">
                    + utilities
                  </p>
                </div>
              </div>

              {state.data.nearbyListingsCount > 0 ? (
                <>
                  <div className={`p-4 rounded-xl border mb-6 ${displayedPriceDifference > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                    <p className={`font-medium ${displayedPriceDifference > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                      {displayedPriceDifference > 0 
                        ? `You are paying $${Math.round(displayedPriceDifference)} more than the adjusted market average.`
                        : `Great deal! You are saving $${Math.abs(Math.round(displayedPriceDifference))} compared to the adjusted market average.`}
                    </p>
                    <p className="text-sm mt-1 opacity-80">
                      Based on {state.data.nearbyListingsCount} listings using {state.data.comparisonLabel}.
                    </p>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-3">
                    {state.data.comparisonBasis === "radius"
                      ? `Nearby Examples (${state.data.radiusUsed} miles)`
                      : "Comparable Examples"}
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {state.data.nearbyListings.slice(0, 5).map((listing, i) => (
                      <div key={i} className="p-3 border border-gray-100 rounded-lg hover:border-green-200 transition">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900">${listing.price}/mo</p>
                          <p className="text-xs text-gray-500">{listing.bedrooms} Bed • {listing.bathrooms || '-'} Bath</p>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{listing.address}</p>
                        {listing.source_url && (
                          <a href={listing.source_url} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline mt-1 inline-block">
                            View Listing →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <HomeIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p>No comparable listings found, even after expanding the radius to 5 miles.</p>
                </div>
              )}
              </div>
            ) : (
              <div className="h-full bg-white rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Compare</h3>
                <p className="text-sm max-w-xs">Choose a location and enter your rent details to see how they stack up against the local market.</p>
              </div>
            )}
          </div>
        </div>

        {state.success && state.data ? (
          <StreetPriceMap data={state.data} />
        ) : (
          <MapPlaceholder />
        )}
      </main>
    </div>
  );
}

function hasCoordinates(listing: RentalListing) {
  return typeof listing.latitude === "number" && typeof listing.longitude === "number";
}

const TILE_SIZE = 256;
const MAP_WIDTH = 1100;
const MAP_HEIGHT = 430;

function longitudeToPixel(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latitudeToPixel(latitude: number, zoom: number) {
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * TILE_SIZE * 2 ** zoom;
}

function getMapPixel(latitude: number, longitude: number, zoom: number) {
  return {
    x: longitudeToPixel(longitude, zoom),
    y: latitudeToPixel(latitude, zoom)
  };
}

function getTileMapPosition(latitude: number, longitude: number, zoom: number, center: { x: number; y: number }) {
  const point = getMapPixel(latitude, longitude, zoom);

  return {
    left: `${Math.min(MAP_WIDTH - 36, Math.max(36, MAP_WIDTH / 2 + point.x - center.x))}px`,
    top: `${Math.min(MAP_HEIGHT - 28, Math.max(28, MAP_HEIGHT / 2 + point.y - center.y))}px`
  };
}

function chooseZoom(points: { latitude: number; longitude: number }[]) {
  if (points.length <= 1) return 15;

  for (let zoom = 17; zoom >= 11; zoom -= 1) {
    const pixels = points.map((point) => getMapPixel(point.latitude, point.longitude, zoom));
    const minX = Math.min(...pixels.map((point) => point.x));
    const maxX = Math.max(...pixels.map((point) => point.x));
    const minY = Math.min(...pixels.map((point) => point.y));
    const maxY = Math.max(...pixels.map((point) => point.y));

    if (maxX - minX <= MAP_WIDTH * 0.78 && maxY - minY <= MAP_HEIGHT * 0.72) {
      return zoom;
    }
  }

  return 11;
}

function getTileUrls(center: { x: number; y: number }, zoom: number) {
  const startTileX = Math.floor((center.x - MAP_WIDTH / 2) / TILE_SIZE);
  const endTileX = Math.floor((center.x + MAP_WIDTH / 2) / TILE_SIZE);
  const startTileY = Math.floor((center.y - MAP_HEIGHT / 2) / TILE_SIZE);
  const endTileY = Math.floor((center.y + MAP_HEIGHT / 2) / TILE_SIZE);
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  const maxTile = 2 ** zoom;

  for (let x = startTileX; x <= endTileX; x += 1) {
    for (let y = startTileY; y <= endTileY; y += 1) {
      if (y < 0 || y >= maxTile) continue;

      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        key: `${zoom}-${wrappedX}-${y}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: x * TILE_SIZE - (center.x - MAP_WIDTH / 2),
        top: y * TILE_SIZE - (center.y - MAP_HEIGHT / 2)
      });
    }
  }

  return tiles;
}

function StreetPriceMap({ data }: { data: ComparisonResult }) {
  const mapListings = data.nearbyListings.filter(hasCoordinates).slice(0, 40);
  const points = [
    ...mapListings.map((listing) => ({
      latitude: listing.latitude,
      longitude: listing.longitude
    })),
    ...(data.targetLatitude !== undefined && data.targetLongitude !== undefined
      ? [{ latitude: data.targetLatitude, longitude: data.targetLongitude }]
      : [])
  ];

  if (points.length === 0) {
    return null;
  }

  const centerLatitude = data.targetLatitude ?? points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const centerLongitude = data.targetLongitude ?? points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
  const zoom = chooseZoom(points);
  const center = getMapPixel(centerLatitude, centerLongitude, zoom);
  const tiles = getTileUrls(center, zoom);

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Price Map</h2>
          <p className="text-sm text-gray-500">Comparable rents plotted around your selected location.</p>
        </div>
        <p className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          {mapListings.length} prices shown
        </p>
      </div>
      <div
        className="relative h-[430px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
        aria-label="Map of comparable rental prices"
      >
        <div
          className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2"
          style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.key}
              className="absolute h-64 w-64 select-none bg-cover bg-center"
              style={{
                left: `${tile.left}px`,
                top: `${tile.top}px`,
                backgroundImage: `url(${tile.src})`
              }}
            />
          ))}

          <div className="absolute inset-0 bg-black/5" />

          {mapListings.map((listing, index) => {
            const position = getTileMapPosition(listing.latitude, listing.longitude, zoom, center);

            return (
              <div
                key={`${listing.address}-${listing.price}-${index}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-800 bg-white px-2.5 py-1 text-xs font-bold text-green-800 shadow-md ring-2 ring-white/80"
                style={position}
                title={`${listing.address}: $${listing.price}/mo`}
              >
                ${Math.round(listing.price)}
              </div>
            );
          })}

          {data.targetLatitude !== undefined && data.targetLongitude !== undefined && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg ring-2 ring-white"
              style={getTileMapPosition(data.targetLatitude, data.targetLongitude, zoom, center)}
              title="Selected location"
            >
              You
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MapPlaceholder() {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Price Map</h2>
        <p className="text-sm text-gray-500">Run a rent check to see nearby prices on the map.</p>
      </div>
      <div className="flex h-[430px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-100 text-center text-sm text-gray-500">
        Nearby rental prices will appear here.
      </div>
    </section>
  );
}
