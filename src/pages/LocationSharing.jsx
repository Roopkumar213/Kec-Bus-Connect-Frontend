import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
  Radio, 
  Play, 
  Square, 
  MapPin, 
  Navigation, 
  Compass, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle,
  Activity,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

const LocationSharing = ({ buses = [], onUpdateBusLocation }) => {
  const navigate = useNavigate();
  const [selectedBusNumber, setSelectedBusNumber] = useState('BUS-01');
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState('0 km/h');
  const [heading, setHeading] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [boardedCount, setBoardedCount] = useState(0);

  const watchIdRef = useRef(null);
  const selectedBus = buses.find(b => b.busNumber === selectedBusNumber) || buses[0] || {};

  // Clean up GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleStartTrip = async () => {
    setGpsError('');
    setIsStarting(true);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device browser.');
      setIsStarting(false);
      return;
    }

    try {
      // 1. Notify Spring Boot backend to transition trip state to RUNNING / ACTIVE
      if (selectedBus.id) {
        await api.startTrip(selectedBus.id);
      }

      // 2. Start Real GPS Tracking using navigator.geolocation.watchPosition
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : 10;
          const rawSpeed = position.coords.speed; // meters per second
          const speedKmh = rawSpeed != null && rawSpeed > 0 ? Math.round(rawSpeed * 3.6) : 0;
          const head = position.coords.heading || 0;

          setCurrentCoords({ lat, lng });
          setAccuracy(acc);
          setSpeed(`${speedKmh} km/h`);
          setHeading(head);
          setLastSentTime(new Date().toLocaleTimeString());
          setUpdateCount(prev => prev + 1);

          // Send real coordinates to Spring Boot
          if (selectedBus.id) {
            try {
              await api.updateBusLocation(selectedBus.id, {
                latitude: lat,
                longitude: lng,
                accuracy: acc,
                speed: speedKmh,
                heading: head,
              });
            } catch (err) {
              console.warn('Location broadcast to backend:', err.message);
            }
          }

          if (onUpdateBusLocation) {
            onUpdateBusLocation(selectedBusNumber, {
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              speed: `${speedKmh} km/h`,
              status: 'RUNNING',
              lastUpdated: 'Just now',
            });
          }
        },
        (error) => {
          console.error('GPS Watch Error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError('GPS permission was denied. Please allow location access in your browser to broadcast live tracking.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError('GPS position unavailable. Please ensure your device location/GPS is turned ON.');
          } else if (error.code === error.TIMEOUT) {
            setGpsError('GPS request timed out. Retrying…');
          } else {
            setGpsError(error.message || 'GPS tracking error occurred.');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

      setIsTracking(true);
    } catch (err) {
      setGpsError(err.message || 'Failed to start trip on backend. Check credentials.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopTrip = async () => {
    setIsStopping(true);
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (selectedBus.id) {
        await api.stopTrip(selectedBus.id);
      }

      if (onUpdateBusLocation) {
        onUpdateBusLocation(selectedBusNumber, {
          status: 'COMPLETED',
          lastUpdated: 'Trip Ended',
          speed: '0 km/h',
        });
      }

      setIsTracking(false);
    } catch (err) {
      setGpsError(err.message || 'Failed to stop trip.');
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="driver" />

      <div className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Driver GPS Broadcaster</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Broadcast real-time bus location to students via GPS
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isTracking ? 'badge-success' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className={`live-pulse-dot ${isTracking ? 'active' : ''}`}></span>
              {isTracking ? 'LIVE BROADCASTING' : 'STANDBY'}
            </span>
          </div>
        </header>

        <main className="dashboard-body" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          
          {/* Driver Instructions Card */}
          <div className="card animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Radio size={18} style={{ color: 'var(--primary)' }} />
              Driver Trip Instructions
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              1. Keep this browser tab open while driving on the route.<br />
              2. Ensure phone <strong>Location / GPS</strong> is enabled with High Accuracy.<br />
              3. Click <strong>Start Trip</strong> when departing from the first bus stop. Coordinates will be broadcasted live to all students.
            </p>
          </div>

          {/* GPS Error Alert */}
          {gpsError && (
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              border: '1px solid hsl(350, 80%, 90%)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} />
              <div>{gpsError}</div>
            </div>
          )}

          {/* Bus Selector & Trip Controls */}
          <div className="card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="bus-select" style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Select Your Assigned Bus
              </label>
              <select
                id="bus-select"
                className="form-control"
                value={selectedBusNumber}
                onChange={(e) => setSelectedBusNumber(e.target.value)}
                disabled={isTracking}
                style={{ fontSize: '16px', fontWeight: 700, padding: '12px 16px' }}
              >
                {buses.map(b => (
                  <option key={b.busNumber} value={b.busNumber}>
                    {b.busNumber} — {b.routeName || b.route || 'Route'} ({b.registrationNumber || 'KEC Fleet'})
                  </option>
                ))}
              </select>
            </div>

            {/* Start / Stop Trip Buttons */}
            {!isTracking ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleStartTrip}
                disabled={isStarting}
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Play size={20} />
                {isStarting ? 'Initiating GPS…' : 'START TRIP (BEGIN BROADCAST)'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger btn-lg"
                onClick={handleStopTrip}
                disabled={isStopping}
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Square size={20} />
                {isStopping ? 'Ending Trip…' : 'END TRIP (STOP BROADCAST)'}
              </button>
            )}
          </div>

          {/* Real-Time Telemetry Dashboard */}
          {isTracking && (
            <div className="card animate-fade-in" style={{ padding: '24px', backgroundColor: 'hsl(215, 28%, 97%)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Live GPS Telemetry (Real-Time)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Current Speed</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    {speed}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GPS Accuracy</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: accuracy && accuracy <= 15 ? 'var(--success)' : 'var(--warning)', marginTop: '4px' }}>
                    {accuracy ? `± ${accuracy} m` : 'Detecting…'}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Broadcasts Sent</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {updateCount}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Last Sent Time</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
                    {lastSentTime || 'Connecting…'}
                  </div>
                </div>
              </div>

              {/* Live Coordinates Detail */}
              {currentCoords && (
                <div style={{ marginTop: '16px', background: 'white', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <MapPin size={16} style={{ color: 'var(--primary)' }} />
                    Lat: <strong>{currentCoords.lat.toFixed(5)}°</strong>, Lng: <strong>{currentCoords.lng.toFixed(5)}°</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)', fontWeight: 700 }}>
                    <CheckCircle size={14} />
                    Hardware GPS Locked
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default LocationSharing;
