import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import BusStatus from '../components/BusStatus';
import { ArrowLeft, ChevronRight, Phone, Navigation, RefreshCw } from 'lucide-react';

const BusDetails = ({ buses = [], onRefreshLocation }) => {
  const { busNumber } = useParams();
  const navigate = useNavigate();
  const [selectedBus, setSelectedBus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync selected bus from route params
  useEffect(() => {
    const bus = buses.find(b => b.busNumber === busNumber) || buses[0];
    setSelectedBus(bus);
  }, [busNumber, buses]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (onRefreshLocation && selectedBus) {
        onRefreshLocation(selectedBus.busNumber);
      }
    }, 800);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="admin" />

      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Fleet Details</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Admin Dashboard</span>
              <ChevronRight size={12} />
              <span>Fleet Map View</span>
              <ChevronRight size={12} />
              <strong>{selectedBus?.busNumber || 'BUS-01'}</strong>
            </div>
          </div>
          <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          {selectedBus ? (
            <div className="admin-details-grid">
              
              {/* Bus Details Card */}
              <div className="card admin-details-card" style={{ gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{selectedBus.busNumber}</h2>
                    <BusStatus status={selectedBus.status} />
                  </div>

                  <div className="info-item">
                    <span className="info-section-title">Route Schedule</span>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                      {selectedBus.routeName || selectedBus.route}
                    </p>
                  </div>

                  <div className="info-item">
                    <span className="info-section-title">Driver Profile</span>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                      {selectedBus.driverName}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {selectedBus.driverPhone || 'N/A'}
                    </p>
                    {selectedBus.driverPhone && (
                      <a href={`tel:${selectedBus.driverPhone}`} className="btn btn-secondary btn-sm" style={{ marginTop: '8px', width: '100%' }}>
                        <Phone size={12} style={{ marginRight: '6px' }} />
                        Call Driver
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span className="info-section-title" style={{ fontSize: '10px' }}>Active Speed</span>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{selectedBus.speed || '0 km/h'}</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span className="info-section-title" style={{ fontSize: '10px' }}>Passenger Load</span>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{selectedBus.passengers || 0}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Navigation size={12} />
                    <span>Last GPS Ping: <strong>{selectedBus.lastUpdated}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{ width: '100%' }}
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Re-fetching...' : 'Re-fetch Coordinates'}
                  </button>
                  <Link to="/admin/dashboard" className="btn btn-secondary" style={{ width: '100%' }}>
                    Return to List
                  </Link>
                </div>
              </div>

              {/* Main Interactive Map */}
              <div style={{ height: '520px' }}>
                <MapView bus={selectedBus} />
              </div>

            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px', textAlign: 'center' }}>
              <h3>Transit Vehicle Not Loaded</h3>
              <Link to="/admin/dashboard" className="btn btn-primary">
                Return to Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BusDetails;
export { BusDetails };
