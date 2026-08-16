import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const createStopIcon = (stop) => {
  let color = 'hsl(220, 20%, 65%)'; // Unreached (muted gray)
  let shadow = '';
  
  if (stop.current) {
    color = 'var(--success)'; // Current stop (green)
    shadow = 'box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);';
  } else if (stop.reached) {
    color = 'var(--primary)'; // Reached stop (blue)
  }

  return new L.DivIcon({
    className: 'custom-stop-div-icon',
    html: `
      <div class="custom-stop-div-icon-inner" style="
        width: 12px; 
        height: 12px; 
        border-radius: 50%; 
        background-color: ${color}; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all var(--transition-fast);
        ${shadow}
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6]
  });
};

const RouteMap = ({ stops = [], path = [] }) => {
  return (
    <>
      {/* Renders the route path connecting stops */}
      {path.length > 1 && (
        <Polyline 
          positions={path} 
          pathOptions={{
            color: 'var(--primary)',
            weight: 4,
            opacity: 0.6,
            dashArray: '5, 8'
          }} 
        />
      )}

      {/* Renders stops markers */}
      {stops.map((stop, index) => (
        <Marker 
          key={index} 
          position={[stop.lat, stop.lng]} 
          icon={createStopIcon(stop)}
        >
          <Popup>
            <div style={{ padding: '2px' }}>
              <strong>{stop.name}</strong>
              <br />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {stop.current ? 'Current Location' : stop.reached ? 'Reached' : 'Upcoming stop'}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default RouteMap;
