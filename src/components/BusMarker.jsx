import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create a custom Leaflet DivIcon for the bus marker
const createBusIcon = (busNumber) => {
  return new L.DivIcon({
    className: 'custom-bus-div-icon',
    html: `
      <div class="custom-bus-div-icon-inner" style="
        width: 40px; 
        height: 40px; 
        border-radius: 50%; 
        background-color: var(--primary); 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4); 
        border: 2px solid white;
        font-size: 18px;
        font-weight: bold;
      ">
        🚌
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const BusMarker = ({ bus }) => {
  if (!bus || !bus.latitude || !bus.longitude) return null;

  const position = [bus.latitude, bus.longitude];
  const busIcon = createBusIcon(bus.busNumber);

  return (
    <Marker position={position} icon={busIcon}>
      <Popup>
        <div style={{ padding: '4px', textAlign: 'center' }}>
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{bus.busNumber}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {bus.routeName || bus.route}
          </span>
          <br />
          <span style={{ fontSize: '11px', display: 'inline-block', marginTop: '6px', fontWeight: 'bold' }}>
            Speed: {bus.speed || '0 km/h'}
          </span>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;
export { createBusIcon };
