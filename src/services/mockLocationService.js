/**
 * Real Location Service Utilities
 * Note: Synthetic simulation has been deprecated and removed.
 * Location is now driven by real driver GPS broadcast over WebSockets.
 */

// Helper to calculate distance between two lat/lng coordinates in kilometers (Haversine formula)
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate real estimated arrival time (ETA) based on distance and average speed (default 30 km/h)
export const calculateETA = (distanceKm, averageSpeedKmh = 30) => {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm <= 0) return null;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return minutes;
};
