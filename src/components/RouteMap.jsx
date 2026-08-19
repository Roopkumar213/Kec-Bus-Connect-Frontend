import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const createStopIcon = (stop) => {
  let color = 'hsl(220, 20%, 65%)'; // Unreached (muted gray)
  let shadow = '';
  
  if (stop.status === 'CURRENT' || stop.current) {
    color = 'var(--success)'; // Current stop (green)
    shadow = 'box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);';
  } else if (stop.status === 'PASSED' || stop.reached) {
    color = 'var(--primary)'; // Reached stop (blue)
  }

  return new L.DivIcon({
    className: 'custom-stop-div-icon',
    html: `
      <div class="custom-stop-div-icon-inner" style="
        width: 14px; 
        height: 14px; 
        border-radius: 50%; 
        background-color: ${color}; 
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all var(--transition-fast);
        ${shadow}
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });
};

const RouteMap = ({ stops = [], path = [] }) => {
  const validPath = Array.isArray(path)
    ? path.filter(p => Array.isArray(p) && p.length >= 2 && !isNaN(Number(p[0])) && !isNaN(Number(p[1])))
    : [];

  return (
    <>
      {/* Renders the route path connecting stops */}
      {validPath.length > 1 && (
        <Polyline 
          positions={validPath} 
          pathOptions={{
            color: 'var(--primary)',
            weight: 4,
            opacity: 0.6,
            dashArray: '5, 8'
          }} 
        />
      )}

      {/* Renders stops markers with detailed ETA popups */}
      {Array.isArray(stops) && stops.map((stop, index) => {
        if (!stop) return null;
        const lat = Number(stop.lat ?? stop.latitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[1] : null));
        const lng = Number(stop.lng ?? stop.longitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[0] : null));
        if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;

        return (
          <Marker 
            key={index} 
            position={[lat, lng]} 
            icon={createStopIcon(stop)}
          >
            <Popup>
              <div style={{ padding: '4px', minWidth: '160px' }}>
                <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-main)' }}>
                  {index + 1}. {stop.name}
                </strong>
                
                {stop.status === 'CURRENT' ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', marginTop: '4px', display: 'block' }}>
                    ● Bus is currently at this stop
                  </span>
                ) : stop.status === 'PASSED' ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    ✓ Stop reached / passed
                  </span>
                ) : (
                  <div style={{ marginTop: '6px', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      ⏱ ETA: {stop.etaText || 'Calculating…'} {stop.clockTime && `(${stop.clockTime})`}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      Distance: <strong>{stop.distanceKm != null ? `${stop.distanceKm} km` : '—'}</strong>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default RouteMap;
