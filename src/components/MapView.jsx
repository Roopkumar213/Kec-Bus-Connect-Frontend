import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import BusMarker from './BusMarker';
import RouteMap from './RouteMap';

// Sub-component to dynamically fly/pan the map when coordinates change
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true, duration: 1 });
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

  const defaultCenter = [bus.latitude || 12.884713, bus.longitude || 78.479812];
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
        <ChangeMapView center={[bus.latitude, bus.longitude]} />

        {/* Render route path and stop markers with live ETA */}
        <RouteMap stops={renderedStops} path={bus.path} />

        {/* Render active bus marker */}
        <BusMarker bus={bus} />
      </MapContainer>
    </div>
  );
};

export default MapView;
export { ChangeMapView };
