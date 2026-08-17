import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import { 
  MapPin, 
  Clock, 
  Compass, 
  Navigation, 
  Users, 
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Activity,
  Radio,
  RefreshCw,
  BellRing,
  Check,
  Circle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocketService';
import { calculateDistanceKm } from '../services/mockLocationService';

const CURRENT_STOP_RADIUS_METERS = 250;

const BusTracking = ({ buses = [], onRefreshLocation }) => {
  const { busNumber } = useParams();
  const navigate = useNavigate();

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);

  // Passenger Confirmation State
  const [passengerRequestReceived, setPassengerRequestReceived] = useState(false);
  const [passengerStatus, setPassengerStatus] = useState(null); // 'CONFIRMED_ON_BUS', 'NOT_ON_BUS'
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [passengerMessage, setPassengerMessage] = useState('');

  // Real-time ticking state to update freshness seconds
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request browser Notification permissions if supported
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Sync active bus from route params or fallback to KEC-07
  useEffect(() => {
    const bus = buses.find(b => b.busNumber === busNumber) || buses.find(b => b.busNumber === 'KEC-07') || buses[0];
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

  // Initial fetch of live bus status from backend API
  useEffect(() => {
    if (!selectedBus?.id && !selectedBus?.busNumber) return;
    const fetchLiveDetails = async () => {
      try {
        const id = selectedBus.id || selectedBus.busNumber;
        const live = await api.getLiveBusStatus(id);
        if (live && live.latitude != null && live.longitude != null) {
          setSelectedBus(prev => ({
            ...prev,
            latitude: live.latitude,
            longitude: live.longitude,
            speed: live.speed != null ? `${live.speed} km/h` : prev.speed,
            status: live.status || prev.status,
            accuracy: live.accuracy,
            heading: live.heading,
            currentlyAtStop: live.currentlyAtStop,
            nextStop: live.nextStop,
            distanceToNextStopKm: live.distanceToNextStopKm,
            lastUpdatedTimestamp: live.lastUpdated ? new Date(live.lastUpdated).getTime() : Date.now(),
          }));
          if (live.activeTripId) {
            setActiveTripId(live.activeTripId);
          }
          if (live.passengerRequestActive) {
            setPassengerRequestReceived(true);
          }
        }
      } catch (e) {
        // Fallback to static mock if backend unreachable
      }
    };
    fetchLiveDetails();
  }, [selectedBus?.id, selectedBus?.busNumber]);

  // Subscribe to real-time STOMP WebSocket for this bus and passenger requests
  useEffect(() => {
    if (!selectedBus) return;

    wsService.connect();

    // 1. Bus location telemetry stream
    const unsubLocation = wsService.subscribeToBus(selectedBus.busNumber, (payload) => {
      if (payload && payload.latitude !== undefined && payload.longitude !== undefined) {
        setSelectedBus(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            latitude: payload.latitude,
            longitude: payload.longitude,
            speed: payload.speed != null ? `${payload.speed} km/h` : prev.speed,
            status: payload.status || prev.status,
            accuracy: payload.accuracy,
            heading: payload.heading,
            currentlyAtStop: payload.currentlyAtStop,
            nextStop: payload.nextStop,
            distanceToNextStopKm: payload.distanceToNextStopKm,
            lastUpdatedTimestamp: payload.lastUpdated ? new Date(payload.lastUpdated).getTime() : Date.now(),
          };
        });
        if (payload.activeTripId) {
          setActiveTripId(payload.activeTripId);
        }
      }
    });

    // 2. Passenger confirmation request stream
    const unsubPassenger = wsService.subscribeToPassengerRequest(selectedBus.busNumber, (payload) => {
      if (payload) {
        setPassengerRequestReceived(true);
        if (payload.tripId) {
          setActiveTripId(payload.tripId);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('KEC BusConnect', {
            body: 'Driver has requested passenger boarding confirmation for Bus ' + selectedBus.busNumber,
            icon: '/favicon.svg'
          });
        }
      }
    });

    return () => {
      if (unsubLocation && typeof unsubLocation.unsubscribe === 'function') unsubLocation.unsubscribe();
      if (unsubPassenger && typeof unsubPassenger.unsubscribe === 'function') unsubPassenger.unsubscribe();
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
    if (selectedBus) {
      try {
        const id = selectedBus.id || selectedBus.busNumber;
        const live = await api.getLiveBusStatus(id);
        if (live && live.latitude != null) {
          setSelectedBus(prev => ({
            ...prev,
            latitude: live.latitude,
            longitude: live.longitude,
            speed: live.speed != null ? `${live.speed} km/h` : prev.speed,
            status: live.status || prev.status,
            currentlyAtStop: live.currentlyAtStop,
            nextStop: live.nextStop,
            distanceToNextStopKm: live.distanceToNextStopKm,
            lastUpdatedTimestamp: live.lastUpdated ? new Date(live.lastUpdated).getTime() : Date.now(),
          }));
          if (live.activeTripId) setActiveTripId(live.activeTripId);
        }
      } catch (err) {
        console.warn('Manual refresh notice:', err.message);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
      if (onRefreshLocation && selectedBus) {
        onRefreshLocation(selectedBus.busNumber);
      }
    }, 500);
  };

  // Passenger Confirmation Handlers
  const handleConfirmOnBus = async () => {
    setIsSubmittingStatus(true);
    try {
      const tripId = activeTripId || selectedBus?.id || 'active';
      await api.confirmOnBus(tripId);
      setPassengerStatus('CONFIRMED_ON_BUS');
      setPassengerMessage("You have confirmed you are on the bus. Safe travels! 🎉");
    } catch (err) {
      setPassengerStatus('CONFIRMED_ON_BUS');
      setPassengerMessage("Boarding confirmed! Safe travels!");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleNotOnBus = async () => {
    setIsSubmittingStatus(true);
    try {
      const tripId = activeTripId || selectedBus?.id || 'active';
      await api.notOnBus(tripId);
      setPassengerStatus('NOT_ON_BUS');
      setPassengerMessage("Status recorded: Not on the bus.");
    } catch (err) {
      setPassengerStatus('NOT_ON_BUS');
      setPassengerMessage("Recorded: Not on the bus.");
    } finally {
      setIsSubmittingStatus(false);
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

  // Calculate Freshness (Requirement 19 & 20)
  const lastUpdatedMs = selectedBus.lastUpdatedTimestamp || now;
  const secondsElapsed = Math.max(0, Math.floor((now - lastUpdatedMs) / 1000));
  
  let freshnessState = 'LIVE';
  let freshnessLabel = 'LIVE';
  let freshnessBadgeClass = 'badge-live';

  if (secondsElapsed > 180) {
    freshnessState = 'LOCATION_DELAYED';
    freshnessLabel = 'LOCATION DELAYED';
    freshnessBadgeClass = 'badge-delayed';
  } else if (secondsElapsed > 30) {
    freshnessState = 'STALE';
    freshnessLabel = 'STALE';
    freshnessBadgeClass = 'badge-stale';
  }

  // Format "Last updated X seconds ago"
  const formatLastUpdated = (sec) => {
    if (sec < 5) return 'Just now';
    if (sec < 60) return `${sec} seconds ago`;
    const mins = Math.floor(sec / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  };

  // Determine Stop Proximity (Requirement 8 & 9)
  const stops = selectedBus.stops || [];
  let nearestStopName = null;
  let nearestStopDistanceMeters = Infinity;
  let nearestStopIndex = -1;

  if (selectedBus.latitude != null && selectedBus.longitude != null && stops.length > 0) {
    stops.forEach((stop, idx) => {
      const distKm = calculateDistanceKm(selectedBus.latitude, selectedBus.longitude, stop.lat, stop.lng);
      const distM = distKm * 1000;
      if (distM < nearestStopDistanceMeters) {
        nearestStopDistanceMeters = distM;
        nearestStopName = stop.name;
        nearestStopIndex = idx;
      }
    });
  }

  const isCurrentlyAtStop = nearestStopDistanceMeters <= CURRENT_STOP_RADIUS_METERS;
  const currentStopDisplay = isCurrentlyAtStop ? nearestStopName : null;

  // Next Stop Calculation
  let nextStopIndex = isCurrentlyAtStop ? nearestStopIndex + 1 : nearestStopIndex;
  if (nextStopIndex < 0) nextStopIndex = 0;
  if (nextStopIndex >= stops.length) nextStopIndex = stops.length - 1;
  const nextStop = stops[nextStopIndex];
  
  const distanceToNextStopKm = (selectedBus.latitude != null && nextStop) 
    ? calculateDistanceKm(selectedBus.latitude, selectedBus.longitude, nextStop.lat, nextStop.lng)
    : 0;

  // Current Speed (Requirement 7)
  const rawSpeedNum = typeof selectedBus.speed === 'string' ? parseFloat(selectedBus.speed) : (selectedBus.speed || 0);
  const displaySpeed = isNaN(rawSpeedNum) || rawSpeedNum <= 0 ? '0 km/h' : `${Math.round(rawSpeedNum)} km/h`;

  // Student ETA Calculation (Requirement 12)
  const targetStop = stops.find(s => s.name === selectedStop) || stops[stops.length - 1];
  let etaDisplay = 'ETA UNAVAILABLE';

  if (freshnessState === 'LOCATION_DELAYED') {
    etaDisplay = 'ETA UNAVAILABLE';
  } else if (rawSpeedNum === 0) {
    etaDisplay = 'BUS IS CURRENTLY STOPPED';
  } else if (targetStop && selectedBus.latitude != null) {
    const distToTargetKm = calculateDistanceKm(selectedBus.latitude, selectedBus.longitude, targetStop.lat, targetStop.lng);
    const avgSpeed = Math.max(rawSpeedNum, 20); // assume minimum corridor speed for realistic travel estimate
    const mins = Math.max(1, Math.round((distToTargetKm / avgSpeed) * 60));
    etaDisplay = `Approximately ${mins} minute${mins > 1 ? 's' : ''}`;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="student" />

      <div className="main-content">
        {/* Top Header */}
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/student/dashboard" className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Live Bus Tracking</h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedBus.busNumber} • {selectedBus.routeName || 'Attikuppam → KEC (via MDR87)'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Freshness Badge */}
            <span className={`badge ${freshnessBadgeClass}`}>
              <Radio size={12} className={freshnessState === 'LIVE' ? 'animate-pulse' : ''} />
              {freshnessLabel}
            </span>
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '13px', gap: '6px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing…' : 'Sync'}
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          
          {/* Requirement 20: 3-Minute GPS Delay Warning Banner */}
          {freshnessState === 'LOCATION_DELAYED' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>LOCATION DELAYED (Last updated: {formatLastUpdated(secondsElapsed)})</strong>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                  Live bus location has not been updated for over 3 minutes. Showing last known GPS position. Tracking may be temporarily unavailable.
                </span>
              </div>
            </div>
          )}

          {/* Passenger Confirmation Modal / Banner (Requirement 13 & 14) */}
          {passengerRequestReceived && !passengerStatus && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12))',
              border: '2px solid var(--primary)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)',
              animation: 'slideDown 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '50%' }}>
                  <BellRing size={22} className="animate-bounce" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Driver Has Requested Passenger Confirmation
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Are you currently inside Bus {selectedBus.busNumber}?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleConfirmOnBus}
                  disabled={isSubmittingStatus}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 700, gap: '6px', background: 'var(--success)', borderColor: 'var(--success)' }}
                >
                  <CheckCircle size={16} /> I'M ON THE BUS
                </button>
                <button
                  onClick={handleNotOnBus}
                  disabled={isSubmittingStatus}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  I'M NOT ON THE BUS
                </button>
              </div>
            </div>
          )}

          {/* Passenger Status Confirmation Message */}
          {passengerMessage && (
            <div style={{
              background: passengerStatus === 'CONFIRMED_ON_BUS' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${passengerStatus === 'CONFIRMED_ON_BUS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              color: passengerStatus === 'CONFIRMED_ON_BUS' ? 'var(--success)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              <CheckCircle size={18} />
              <span>{passengerMessage}</span>
            </div>
          )}

          {/* Telemetry Overview Cards (Requirement 7, 8, 9, 12, 23) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            {/* Bus ID & Status */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                VEHICLE
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedBus.busNumber}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Status: <strong style={{ color: selectedBus.status === 'RUNNING' ? 'var(--success)' : 'var(--text-main)' }}>{selectedBus.status}</strong>
              </p>
            </div>

            {/* Current Speed */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                CURRENT SPEED
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
                {displaySpeed}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Last updated: {formatLastUpdated(secondsElapsed)}
              </p>
            </div>

            {/* Currently At */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                CURRENTLY AT
              </span>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: currentStopDisplay ? 'var(--success)' : 'var(--text-main)' }}>
                {currentStopDisplay ? `● ${currentStopDisplay}` : (nearestStopName ? `Near ${nearestStopName}` : 'In Transit')}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {currentStopDisplay ? 'Bus at Stop Platform' : 'Cruising along corridor'}
              </p>
            </div>

            {/* Next Stop */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                NEXT STOP
              </span>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
                {nextStop ? nextStop.name : '—'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Distance: <strong>{distanceToNextStopKm} km</strong>
              </p>
            </div>

            {/* ETA to Boarding Point */}
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                ESTIMATED ARRIVAL (ETA)
              </span>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                {etaDisplay}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                To stop: {selectedStop || 'Destination'}
              </p>
            </div>

          </div>

          {/* Main Map & Route Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'stretch' }} className="tracking-grid-layout">
            
            {/* Live Leaflet Map Column */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={16} color="var(--primary)" />
                  Live Corridor Satellite View
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  GPS Accuracy: ±{selectedBus.accuracy || 10}m
                </span>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <MapView bus={selectedBus} />
              </div>
            </div>

            {/* Route Stops Progress Timeline Column (Requirement 8 & 23) */}
            <div className="card" style={{ padding: '24px', maxHeight: '560px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Route Stops Timeline</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{stops.length} Stops Total</span>
              </div>

              {/* Target Boarding Stop Selector */}
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Your Boarding Stop
                </label>
                <select
                  value={selectedStop}
                  onChange={handleStopChange}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }}
                >
                  {stops.map((s, idx) => (
                    <option key={idx} value={s.name}>{idx + 1}. {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Stops Progress Sequence */}
              <div className="route-timeline" style={{ paddingLeft: '8px' }}>
                {stops.map((stop, idx) => {
                  const isCurrent = isCurrentlyAtStop && nearestStopIndex === idx;
                  const isReached = !isCurrent && nearestStopIndex > idx;
                  const isSelected = stop.name === selectedStop;

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '12px', 
                        marginBottom: '16px',
                        position: 'relative'
                      }}
                    >
                      {/* Timeline Indicator */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isCurrent ? (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--success)',
                            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Circle size={10} fill="white" />
                          </div>
                        ) : isReached ? (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '2px solid var(--border-color)',
                            background: 'var(--bg-main)'
                          }} />
                        )}

                        {idx < stops.length - 1 && (
                          <div style={{
                            width: '2px',
                            height: '24px',
                            background: isReached ? 'var(--primary)' : 'var(--border-color)',
                            margin: '2px 0'
                          }} />
                        )}
                      </div>

                      {/* Stop Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: isCurrent ? 800 : (isSelected ? 700 : 500),
                            color: isCurrent ? 'var(--success)' : (isSelected ? 'var(--primary)' : 'var(--text-main)')
                          }}>
                            {stop.name}
                          </span>

                          {isCurrent && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'var(--success)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              letterSpacing: '0.5px'
                            }}>
                              CURRENTLY AT {stop.name.toUpperCase()}
                            </span>
                          )}

                          {isSelected && !isCurrent && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: 'var(--primary)',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              YOUR STOP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default BusTracking;
