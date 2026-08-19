import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import BusMarker from './BusMarker';
import RouteMap from './RouteMap';

// Sub-component to dynamically fly/pan the map when coordinates change
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center[0] != null && center[1] != null && !isNaN(Number(center[0])) && !isNaN(Number(center[1]))) {
      map.setView([Number(center[0]), Number(center[1])], 14, { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
};

const MapView = ({ bus, stopEstimates = [] }) => {
  if (!bus) {
    return (
      <div 
        className="map-wrapper-card" 
        style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}
      >
        Select a bus to load the map view.
      </div>
    );
  }

  const validLat = (bus.latitude != null && !isNaN(Number(bus.latitude))) ? Number(bus.latitude) : 12.884713;
  const validLng = (bus.longitude != null && !isNaN(Number(bus.longitude))) ? Number(bus.longitude) : 78.479812;
  const defaultCenter = [validLat, validLng];
  const renderedStops = (stopEstimates && stopEstimates.length > 0) ? stopEstimates : (bus.stops || []);

  return (
    <div className="map-wrapper-card" style={{ height: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="map-element"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Helper to pan/center map when coordinates change */}
        <ChangeMapView center={[validLat, validLng]} />

        {/* Render route path and stop markers with live ETA */}
        <RouteMap stops={renderedStops} path={bus.path} />

        {/* Render active bus marker */}
        <BusMarker bus={{ ...bus, latitude: validLat, longitude: validLng }} />
      </MapContainer>
    </div>
  );
};

export default MapView;
export { ChangeMapView };
