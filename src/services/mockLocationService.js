/**
 * Real Location Service Utilities
 * Note: Synthetic simulation has been deprecated and removed.
 * Location is now driven by real driver GPS broadcast over WebSockets.
 */

// Helper to calculate distance between two lat/lng coordinates in kilometers (Haversine formula)
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2) || !isFinite(nLat1) || !isFinite(nLon1) || !isFinite(nLat2) || !isFinite(nLon2)) {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
      Math.cos(nLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const res = R * c;
  return isNaN(res) || !isFinite(res) ? 0 : res;
};

// Calculate real estimated arrival time (ETA) based on distance and average speed (default 30 km/h)
export const calculateETA = (distanceKm, averageSpeedKmh = 30) => {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm <= 0) return null;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return minutes;
};
