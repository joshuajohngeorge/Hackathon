"use server";

import { compareListing, compareListingToOverallAverage, geocodeAddress, getUniqueAddresses, ComparisonResult } from "@/lib/compareListings";

export type CompareActionState = {
  success: boolean;
  error?: string;
  data?: ComparisonResult;
};

export async function compareRentalAction(
  prevState: CompareActionState | null,
  formData: FormData
): Promise<CompareActionState> {
  const locationMode = formData.get("locationMode") as string;
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const price = parseFloat(formData.get("price") as string);
  const bedroomsStr = formData.get("bedrooms") as string;

  if (isNaN(price)) {
    return { success: false, error: "Monthly rent is required." };
  }

  const bedrooms = bedroomsStr ? parseInt(bedroomsStr) : undefined;

  try {
    let targetLatitude = latitude;
    let targetLongitude = longitude;

    if (locationMode === "address") {
      if (!address) {
        return { success: false, error: "Please enter a location before comparing rent." };
      }

      const knownAddress = getUniqueAddresses()
        .find((item) => item.address.toLowerCase() === address.toLowerCase());
      const geocodedAddress = knownAddress ?? await geocodeAddress(address);

      if (!geocodedAddress) {
        const result = compareListingToOverallAverage(price, bedrooms);
        return { success: true, data: result };
      }

      targetLatitude = geocodedAddress.latitude;
      targetLongitude = geocodedAddress.longitude;
    }

    if (isNaN(targetLatitude) || isNaN(targetLongitude)) {
      return { success: false, error: "Please allow location access before comparing rent." };
    }

    const result = compareListing(targetLatitude, targetLongitude, price, bedrooms);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}
