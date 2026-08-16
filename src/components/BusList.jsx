import React from 'react';
import BusCard from './BusCard';

const BusList = ({ buses = [] }) => {
  if (buses.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        <p>No buses available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bus-grid">
      {buses.map((bus) => (
        <BusCard key={bus.id || bus.busNumber} bus={bus} />
      ))}
    </div>
  );
};

export default BusList;
