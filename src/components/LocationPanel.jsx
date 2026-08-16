import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Phone, Users, ShieldAlert, Navigation } from 'lucide-react';
import BusStatus from './BusStatus';

const LocationPanel = ({ bus, onRefresh, isRefreshing }) => {
  const navigate = useNavigate();

  if (!bus) return null;

  return (
    <div className="info-panel">
      <div className="card info-card">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{bus.busNumber}</h2>
            <BusStatus status={bus.status} />
          </div>

          <div className="info-item">
            <span className="info-section-title">Route Info</span>
            <p className="info-value-large" style={{ fontSize: '15px', fontWeight: 600 }}>
              {bus.routeName || bus.route}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              <span className="info-section-title" style={{ fontSize: '10px', marginBottom: '2px', display: 'block' }}>Speed</span>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{bus.speed || '0 km/h'}</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              <span className="info-section-title" style={{ fontSize: '10px', marginBottom: '2px', display: 'block' }}>Passengers</span>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>
                <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {bus.passengers || 0}
              </span>
            </div>
          </div>

          <div className="info-item" style={{ marginBottom: '16px' }}>
            <span className="info-section-title">Driver Details</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>{bus.driverName || 'N/A'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bus.driverPhone || 'N/A'}</p>
              </div>
              {bus.driverPhone && (
                <a 
                  href={`tel:${bus.driverPhone}`} 
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px' }}
                  title="Call Driver"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>
          </div>

          {bus.stops && bus.stops.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <span className="info-section-title">Route Stops & Timeline</span>
              <ul className="info-list-stops" style={{ marginTop: '8px' }}>
                {bus.stops.map((stop, index) => {
                  let statusClass = '';
                  if (stop.current) statusClass = 'current';
                  else if (stop.reached) statusClass = 'reached';
                  
                  return (
                    <li key={index} className={`stop-item ${statusClass}`}>
                      {stop.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Navigation size={12} />
            <span>Updated: <strong>{bus.lastUpdated || 'Just now'}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
          <button 
            className="btn btn-primary"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ width: '100%' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Location'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/student/dashboard')}
            style={{ width: '100%' }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPanel;
