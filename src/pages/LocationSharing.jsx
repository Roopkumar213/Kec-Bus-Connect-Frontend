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
  RefreshCw,
  Users,
  BellRing,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocketService';

const LocationSharing = ({ buses = [], onUpdateBusLocation }) => {
  const navigate = useNavigate();
  const [selectedBusNumber, setSelectedBusNumber] = useState('KEC-07');
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
  const [isRequestingPassenger, setIsRequestingPassenger] = useState(false);
  const [passengerRequestMessage, setPassengerRequestMessage] = useState('');
  
  // Trip Direction & Passenger State
  const [tripDirection, setTripDirection] = useState('MORNING');
  const [activeTrip, setActiveTrip] = useState(null);
  const [passengerSummary, setPassengerSummary] = useState({
    confirmedCount: 0,
    notRespondedCount: 0,
    notOnBusCount: 0,
    totalAssigned: 0,
    isRequestActive: false,
    passengers: []
  });

  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const selectedBus = buses.find(b => b.busNumber === selectedBusNumber) || buses[0] || {};

  // Check active trip and load passengers on mount
  useEffect(() => {
    const fetchActiveTrip = async () => {
      if (!selectedBus.id) return;
      try {
        const trip = await api.getActiveDriverTrip(selectedBus.id);
        if (trip && trip.id) {
          setActiveTrip(trip);
          if (trip.direction) setTripDirection(trip.direction);
          setIsTracking(true);
          const summary = await api.getPassengerSummary(trip.id);
          if (summary) setPassengerSummary(summary);
        }
      } catch (err) {
        // no active trip
      }
    };
    fetchActiveTrip();
  }, [selectedBus.id]);

  // Subscribe to live passenger summary updates via WebSocket
  useEffect(() => {
    if (!activeTrip && !selectedBus?.busNumber) return;
    wsService.connect();

    const unsub = wsService.subscribeToPassengerSummary(selectedBus.busNumber, (payload) => {
      if (payload && payload.confirmedCount !== undefined) {
        setPassengerSummary(payload);
      }
    });

    return () => {
      if (unsub && typeof unsub.unsubscribe === 'function') {
        unsub.unsubscribe();
      }
    };
  }, [activeTrip?.id, selectedBus?.busNumber]);

  // Request & release screen WakeLock to prevent mobile phone sleeping while driving
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock request warning:', err.message);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // ignore
      }
    }
  };

  // Clean up GPS watcher & WakeLock on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, []);

  const handleStartTrip = async () => {
    setGpsError('');
    setIsStarting(true);
    setPassengerRequestMessage('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device browser.');
      setIsStarting(false);
      return;
    }

    try {
      // 1. Create/Start active trip in backend with direction
      let startedTrip = null;
      if (selectedBus.id) {
        try {
          startedTrip = await api.startTrip(selectedBus.id, tripDirection);
          setActiveTrip(startedTrip);
          if (startedTrip && startedTrip.id) {
            const summary = await api.getPassengerSummary(startedTrip.id);
            if (summary) setPassengerSummary(summary);
          }
        } catch (apiErr) {
          console.warn('Trip start warning:', apiErr.message);
        }
      }

      // 2. Request Screen WakeLock so phone screen stays on during driving
      await requestWakeLock();

      // 3. Start real GPS tracking with navigator.geolocation.watchPosition
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

          // Broadcast to Spring Boot
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
              console.warn('Location broadcast error:', err.message);
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
    setPassengerRequestMessage('');
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      releaseWakeLock();

      if (activeTrip && activeTrip.id) {
        await api.stopDriverTrip(activeTrip.id);
      } else if (selectedBus.id) {
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
      setActiveTrip(null);
      setSpeed('0 km/h');
    } catch (err) {
      setGpsError(err.message || 'Failed to stop trip on backend.');
    } finally {
      setIsStopping(false);
    }
  };

  const handleRequestPassengerConfirmation = async () => {
    if (!activeTrip && !selectedBus.id) return;
    setIsRequestingPassenger(true);
    setPassengerRequestMessage('');
    try {
      const tripId = activeTrip?.id || selectedBus.id;
      await api.requestPassengerConfirmation(tripId);
      setPassengerRequestMessage('Passenger confirmation request sent to all students on this route!');
      const summary = await api.getPassengerSummary(tripId);
      if (summary) setPassengerSummary(summary);
    } catch (err) {
      setPassengerRequestMessage('Notice: ' + (err.message || 'Confirmation request broadcasted.'));
    } finally {
      setIsRequestingPassenger(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="driver" />

      <div className="main-content">
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Driver GPS Broadcaster</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live hardware telemetry & trip control for Bus {selectedBusNumber}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isTracking ? 'badge-live' : 'badge-idle'}`}>
              <Radio size={12} className={isTracking ? 'animate-pulse' : ''} />
              {isTracking ? 'GPS BROADCASTING LIVE' : 'TRANSMITTER IDLE'}
            </span>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          
          {/* Active Bus & Trip Controls Card */}
          <div className="card animate-fade-in" style={{ padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>
                  Assigned Vehicle & Route
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedBus.busNumber || 'KEC-07'}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '20px' }}>
                    {selectedBus.registrationNumber || 'AP-39-TJ-2026'}
                  </span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                  Route: <strong>{selectedBus.routeName || selectedBus.route?.name || 'Attikuppam → KEC (via MDR87)'}</strong>
                </p>

                {/* Trip Direction Selection */}
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Select Trip Direction
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isTracking}
                      onClick={() => setTripDirection('MORNING')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: tripDirection === 'MORNING' ? 'var(--primary)' : 'var(--border-color)',
                        background: tripDirection === 'MORNING' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-secondary)',
                        color: tripDirection === 'MORNING' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: isTracking ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🌅 MORNING TRIP
                    </button>
                    <button
                      type="button"
                      disabled={isTracking}
                      onClick={() => setTripDirection('EVENING')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: tripDirection === 'EVENING' ? 'var(--primary)' : 'var(--border-color)',
                        background: tripDirection === 'EVENING' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-secondary)',
                        color: tripDirection === 'EVENING' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: isTracking ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🌆 EVENING TRIP
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div><strong>Starting Point:</strong> {tripDirection === 'EVENING' ? 'Kuppam Engineering College (KEC - Terminus)' : 'Attikuppam (Origin)'}</div>
                  <div><strong>Destination:</strong> {tripDirection === 'EVENING' ? 'Student Stops (Attikuppam)' : 'Kuppam Engineering College (KEC)'}</div>
                </div>

                {activeTrip && (
                  <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} /> Active Trip: {activeTrip.id} ({tripDirection})
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {!isTracking ? (
                  <button
                    onClick={handleStartTrip}
                    disabled={isStarting}
                    className="btn btn-primary"
                    style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 700, gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
                  >
                    <Play size={18} fill="currentColor" />
                    {isStarting ? 'Initiating GPS…' : tripDirection === 'EVENING' ? 'START EVENING TRIP' : 'START MORNING TRIP'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRequestPassengerConfirmation}
                      disabled={isRequestingPassenger}
                      className="btn btn-secondary"
                      style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, gap: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                      <BellRing size={16} />
                      {isRequestingPassenger ? 'Broadcasting…' : 'REQUEST PASSENGER CONFIRMATION'}
                    </button>
                    <button
                      onClick={handleStopTrip}
                      disabled={isStopping}
                      className="btn"
                      style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 700, gap: '8px', background: 'var(--danger)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
                    >
                      <Square size={18} fill="currentColor" />
                      {isStopping ? 'Ending Trip…' : 'STOP TRIP'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {gpsError && (
              <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Passenger Confirmation Message Banner */}
            {passengerRequestMessage && (
              <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span>{passengerRequestMessage}</span>
              </div>
            )}
          </div>

          {/* Telemetry Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Speed Card */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>CURRENT SPEED</span>
                <Activity size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>
                {speed}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {isTracking ? 'Hardware GPS Velocity' : 'Engine Stationary'}
              </p>
            </div>

            {/* GPS Accuracy */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>GPS ACCURACY</span>
                <ShieldCheck size={18} color="var(--success)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: accuracy && accuracy <= 15 ? 'var(--success)' : 'var(--text-main)' }}>
                {accuracy != null ? `±${accuracy} m` : '—'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {accuracy && accuracy <= 15 ? 'High-Precision Fix' : 'Awaiting Satellite Lock'}
              </p>
            </div>

            {/* Heading / Direction */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>HEADING</span>
                <Compass size={18} color="var(--warning)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>
                {heading != null ? `${Math.round(heading)}°` : '0°'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Compass orientation
              </p>
            </div>

            {/* Packets Broadcasted */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>PACKETS SENT</span>
                <RefreshCw size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>
                {updateCount}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Last: {lastSentTime || 'None'}
              </p>
            </div>
          </div>

          {/* Passenger Roster Breakdown Card */}
          <div className="card animate-fade-in" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="var(--primary)" />
                  Passenger Manifest & Boarding Status
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Real-time confirmation status for passengers assigned to this corridor
                </p>
              </div>
              <button 
                onClick={async () => {
                  if (activeTrip?.id) {
                    const s = await api.getPassengerSummary(activeTrip.id);
                    if (s) setPassengerSummary(s);
                  }
                }}
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '12px', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh Roster
              </button>
            </div>

            {/* Passenger Count Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '13px', fontWeight: 600 }}>
                  <UserCheck size={16} /> Confirmed on Bus
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)', marginTop: '6px' }}>
                  {passengerSummary.confirmedCount}
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '13px', fontWeight: 600 }}>
                  <Clock size={16} /> Not Responded
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--warning)', marginTop: '6px' }}>
                  {passengerSummary.notRespondedCount}
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>
                  <UserX size={16} /> Not on Bus
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--danger)', marginTop: '6px' }}>
                  {passengerSummary.notOnBusCount}
                </div>
              </div>
            </div>

            {/* Passenger List Table */}
            {passengerSummary.passengers && passengerSummary.passengers.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 12px' }}>Student Name</th>
                      <th style={{ padding: '10px 12px' }}>Roll Number</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengerSummary.passengers.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{p.studentName}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.studentRollNumber}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: p.status === 'CONFIRMED_ON_BUS' ? 'rgba(16, 185, 129, 0.15)' : p.status === 'NOT_ON_BUS' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: p.status === 'CONFIRMED_ON_BUS' ? 'var(--success)' : p.status === 'NOT_ON_BUS' ? 'var(--danger)' : 'var(--warning)',
                          }}>
                            {p.status === 'CONFIRMED_ON_BUS' ? 'CONFIRMED ON BUS' : p.status === 'NOT_ON_BUS' ? 'NOT ON BUS' : 'NOT RESPONDED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                          {p.confirmedAt ? new Date(p.confirmedAt).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                No students registered on this active trip roster yet.
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default LocationSharing;
