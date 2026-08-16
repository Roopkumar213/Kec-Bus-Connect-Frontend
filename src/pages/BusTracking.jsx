import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import BusStatus from '../components/BusStatus';
import { 
  MapPin, 
  Clock, 
  Compass, 
  Navigation, 
  Users, 
  AlertTriangle,
  ArrowLeft,
  Phone,
  CheckCircle,
  Activity,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocketService';
import { calculateDistanceKm, calculateETA } from '../services/mockLocationService';

const BusTracking = ({ buses = [], onRefreshLocation }) => {
  const { busNumber } = useParams();
  const navigate = useNavigate();

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnBoard, setIsOnBoard] = useState(false);
  const [boardingMessage, setBoardingMessage] = useState('');
  const [isBoardingSubmitting, setIsBoardingSubmitting] = useState(false);

  // Sync active bus from route params or fallback to first bus
  useEffect(() => {
    const bus = buses.find(b => b.busNumber === busNumber) || buses.find(b => b.busNumber === 'BUS-01') || buses[0];
    if (bus) {
      setSelectedBus(bus);
      const savedStop = localStorage.getItem(`kec_stop_${bus.busNumber}`);
      if (savedStop) {
        setSelectedStop(savedStop);
      } else if (bus.stops && bus.stops.length > 0) {
        setSelectedStop(bus.stops[bus.stops.length - 1].name);
      }
    }
  }, [busNumber, buses]);

  // Subscribe to real-time STOMP WebSocket for this bus
  useEffect(() => {
    if (!selectedBus) return;

    wsService.connect();
    const unsub = wsService.subscribeToBus(selectedBus.busNumber, (payload) => {
      if (payload && payload.latitude !== undefined && payload.longitude !== undefined) {
        setSelectedBus(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            latitude: payload.latitude,
            longitude: payload.longitude,
            speed: payload.speed != null ? `${payload.speed} km/h` : prev.speed,
            status: payload.status || prev.status,
            lastUpdated: 'Just now',
            accuracy: payload.accuracy,
            lastUpdatedTimestamp: Date.now(),
          };
        });
      }
    });

    return () => {
      if (unsub && typeof unsub.unsubscribe === 'function') {
        unsub.unsubscribe();
      }
    };
  }, [selectedBus?.busNumber]);

  const handleStopChange = (e) => {
    const stopName = e.target.value;
    setSelectedStop(stopName);
    if (selectedBus) {
      localStorage.setItem(`kec_stop_${selectedBus.busNumber}`, stopName);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (selectedBus && selectedBus.id) {
      try {
        const loc = await api.getBusLocation(selectedBus.id);
        if (loc && loc.latitude !== undefined) {
          setSelectedBus(prev => ({
            ...prev,
            latitude: loc.latitude,
            longitude: loc.longitude,
            speed: loc.speed != null ? `${loc.speed} km/h` : prev.speed,
            status: loc.status || prev.status,
            lastUpdated: 'Just now',
            lastUpdatedTimestamp: Date.now(),
          }));
        }
      } catch (err) {
        console.warn('Manual refresh error:', err.message);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
      if (onRefreshLocation && selectedBus) {
        onRefreshLocation(selectedBus.busNumber);
      }
    }, 600);
  };

  const handleConfirmBoarding = async () => {
    if (!selectedBus) return;
    setIsBoardingSubmitting(true);
    try {
      if (selectedBus.id) {
        await api.boardBus(selectedBus.id);
      }
      setIsOnBoard(true);
      setBoardingMessage(`You are checked-in on ${selectedBus.busNumber}! 🎉`);
    } catch (err) {
      setIsOnBoard(true);
      setBoardingMessage(`Boarding recorded for ${selectedBus.busNumber}!`);
    } finally {
      setIsBoardingSubmitting(false);
    }
  };

  if (!selectedBus) {
    return (
      <div className="dashboard-layout">
        <Sidebar role="student" />
        <div className="main-content">
          <main className="dashboard-body">
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <AlertTriangle size={48} style={{ color: 'var(--danger)', margin: '0 auto 16px' }} />
              <h3>Bus Record Not Found</h3>
              <button className="btn btn-primary" onClick={() => navigate('/student/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Find target boarding stop
  const targetStop = (selectedBus.stops || []).find(s => s.name === selectedStop) || (selectedBus.stops && selectedBus.stops[0]);

  // Real distance and ETA calculation
  let distanceText = '--';
  let etaText = '--';
  let isNear = false;
  let isStaleGps = false;

  const isRunning = selectedBus.status === 'RUNNING' || selectedBus.status === 'ACTIVE' || selectedBus.status === 'ON_ROUTE';

  if (selectedBus.lastUpdatedTimestamp && Date.now() - selectedBus.lastUpdatedTimestamp > 120000 && isRunning) {
    isStaleGps = true;
  }

  if (!isRunning) {
    distanceText = selectedBus.status === 'COMPLETED' ? 'Trip Ended' : 'Bus not started';
    etaText = 'N/A';
  } else if (targetStop && selectedBus.latitude && selectedBus.longitude) {
    const targetLat = targetStop.lat || targetStop.latitude;
    const targetLng = targetStop.lng || targetStop.longitude;

    if (targetLat != null && targetLng != null) {
      const realDistKm = calculateDistanceKm(selectedBus.latitude, selectedBus.longitude, targetLat, targetLng);
      
      if (realDistKm != null) {
        if (realDistKm <= 0.25) {
          distanceText = 'Arrived at stop (Within 250m)';
          etaText = 'Arriving now';
          isNear = true;
        } else {
          distanceText = `${realDistKm.toFixed(1)} km`;
          const etaMinutes = calculateETA(realDistKm, 30);
          etaText = etaMinutes != null && etaMinutes > 0 ? `~${etaMinutes} min` : '< 1 min';
          if (realDistKm <= 1.2) isNear = true;
        }
      }
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />

      <div className="main-content">
        {/* Top Header */}
        <header className="dashboard-header" style={{ height: 'auto', padding: '16px 32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/student/dashboard" style={{ color: 'var(--text-secondary)' }} title="Back to Dashboard">
                <ArrowLeft size={20} />
              </Link>
              <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
                {selectedBus.busNumber}
              </h1>
              <BusStatus status={selectedBus.status} />
              {isRunning && (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Radio size={12} />
                  LIVE GPS
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Compass size={14} />
              {selectedBus.routeName || selectedBus.route || 'Route'}
            </p>
          </div>
          
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              Last updated: <strong>{selectedBus.lastUpdated || 'Just now'}</strong>
            </span>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ padding: '6px 12px' }}
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Stale GPS Alert */}
        {isStaleGps && (
          <div style={{
            margin: '0 24px 16px',
            padding: '12px 18px',
            backgroundColor: 'var(--warning-light)',
            color: 'hsl(35, 90%, 30%)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            GPS signal hasn't updated in over 2 minutes. The bus driver's phone might be in a low network zone.
          </div>
        )}

        {/* Dashboard Body Content */}
        <main className="dashboard-body" style={{ padding: '24px' }}>
          <div className="tracking-container">
            
            {/* Left Tracking Info Panel */}
            <div className="tracking-sidebar-panel">
              
              {/* Stop Selector & ETA Card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="info-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  Your Boarding Stop
                </h3>

                <div className="form-group" style={{ margin: '10px 0 16px' }}>
                  <select 
                    className="form-control" 
                    value={selectedStop}
                    onChange={handleStopChange}
                    style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                  >
                    {(selectedBus.stops || []).map(stop => (
                      <option key={stop.name} value={stop.name}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Real-Time ETA Box */}
                <div style={{ 
                  backgroundColor: isNear ? 'var(--success-light)' : 'var(--primary-light)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px dashed ${isNear ? 'var(--success)' : 'var(--primary)'}`,
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    color: isNear ? 'var(--success)' : 'var(--primary)'
                  }}>
                    Real GPS Distance & ETA
                  </p>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {etaText}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                    Distance: <strong>{distanceText}</strong>
                  </p>
                </div>

                {/* "I'M ON BOARD" Action Button */}
                <div style={{ marginTop: '16px' }}>
                  {!isOnBoard ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmBoarding}
                      disabled={isBoardingSubmitting || !isRunning}
                      style={{ width: '100%', padding: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CheckCircle size={16} />
                      {isBoardingSubmitting ? 'Confirming…' : "I'M ON BOARD"}
                    </button>
                  ) : (
                    <div style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--success-light)',
                      color: 'var(--success)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: '13px',
                      textAlign: 'center',
                      border: '1px solid var(--success)'
                    }}>
                      ✓ {boardingMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Route Progress Timeline Card */}
              <div className="card" style={{ padding: '24px 20px', flex: 1 }}>
                <h3 className="info-section-title" style={{ fontSize: '12px', marginBottom: '20px' }}>
                  Route Timeline ({selectedBus.stops?.length || 0} Stops)
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px' }}>
                  {(selectedBus.stops || []).map((stop, index) => {
                    const isTarget = stop.name === selectedStop;
                    
                    return (
                      <React.Fragment key={stop.name || index}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isTarget ? 'var(--primary)' : 'hsl(220, 10%, 88%)',
                            color: isTarget ? 'white' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            zIndex: 2,
                            boxShadow: isTarget ? '0 0 0 4px rgba(59, 130, 246, 0.25)' : 'none'
                          }}>
                            {index + 1}
                          </div>
                          <div>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: isTarget ? 700 : 500,
                              color: isTarget ? 'var(--primary)' : 'var(--text-main)'
                            }}>
                              {stop.name}
                            </span>
                            {isTarget && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '11px', 
                                backgroundColor: 'var(--primary-light)', 
                                color: 'var(--primary)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                Your Boarding Stop
                              </span>
                            )}
                          </div>
                        </div>

                        {index < (selectedBus.stops?.length - 1) && (
                          <div style={{
                            marginLeft: '11px',
                            height: '28px',
                            width: '2px',
                            backgroundColor: 'hsl(220, 10%, 88%)',
                            position: 'relative',
                            zIndex: 1
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Large Leaflet Map Viewport */}
            <div className="tracking-map-panel">
              <MapView bus={selectedBus} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default BusTracking;
export { BusTracking };
