import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  AlertCircle,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { api } from '../services/api';
import { wsService } from '../services/websocketService';
import { notificationService } from '../services/notificationService';
import { calculateDistanceKm } from '../services/mockLocationService';

const CURRENT_STOP_RADIUS_METERS = 250;

const BusTracking = ({ buses = [], onRefreshLocation }) => {
  const { busNumber } = useParams();
  const navigate = useNavigate();

  const [selectedBus, setSelectedBus] = useState(() => {
    const list = (buses && buses.length > 0) ? buses : initialBuses;
    return list.find(b => b.busNumber === busNumber) || list.find(b => b.busNumber === 'KEC-07') || list[0] || null;
  });
  const [selectedStop, setSelectedStop] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);

  // Arrival Alert State
  const [arrivalAlert, setArrivalAlert] = useState(null);
  const reminderTriggeredRef = useRef(false);

  // Passenger Confirmation State
  const [passengerRequestReceived, setPassengerRequestReceived] = useState(false);
  const [passengerStatus, setPassengerStatus] = useState(null); // 'CONFIRMED_ON_BUS', 'NOT_ON_BUS'
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [passengerMessage, setPassengerMessage] = useState('');

  // ─── Student Location Sharing State ─────────────────────────────────────────
  const userRole = localStorage.getItem('role') || '';
  const isStudent = userRole === 'student';
  const [locationShareStatus, setLocationShareStatus] = useState(null); // { canStudentShare, isCurrentSource, currentSource }
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSpeed, setShareSpeed] = useState(null);
  const [shareLastSent, setShareLastSent] = useState(null);
  const [shareInterrupted, setShareInterrupted] = useState(false);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(null);
  const shareIntervalRef = useRef(null);
  const interruptionTimerRef = useRef(null);
  // ────────────────────────────────────────────────────────────────────────────

  // Clock ticker for real-time second updates
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request browser Notification permissions if supported
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  // Sync active bus from route params or fallback to KEC-07
  useEffect(() => {
    const list = (buses && buses.length > 0) ? buses : initialBuses;
    const bus = list.find(b => b.busNumber === busNumber) || list.find(b => b.busNumber === 'KEC-07') || list[0];
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
          setSelectedBus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              latitude: live.latitude,
              longitude: live.longitude,
              speed: live.speed != null ? `${live.speed} km/h` : prev.speed,
              status: live.status || prev.status,
              accuracy: live.accuracy,
              heading: live.heading,
              direction: live.direction || prev.direction || 'MORNING',
              startingPoint: live.startingPoint,
              destination: live.destination,
              currentlyAtStop: live.currentlyAtStop,
              nextStop: live.nextStop,
              distanceToNextStopKm: live.distanceToNextStopKm,
              lastUpdatedTimestamp: live.lastUpdated ? new Date(live.lastUpdated).getTime() : Date.now(),
            };
          });
          if (live.activeTripId) {
            setActiveTripId(live.activeTripId);
          }
          if (live.passengerRequestActive) {
            setPassengerRequestReceived(true);
          }
        }
      } catch (e) {
        // fallback
      }
    };
    fetchLiveDetails();
  }, [selectedBus?.id, selectedBus?.busNumber]);

  // Subscribe to real-time STOMP WebSocket for this bus, passenger requests, and arrival reminders
  useEffect(() => {
    if (!selectedBus?.busNumber) return;

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
            direction: payload.direction || prev.direction || 'MORNING',
            startingPoint: payload.startingPoint,
            destination: payload.destination,
            currentlyAtStop: payload.currentlyAtStop,
            nextStop: payload.nextStop,
            distanceToNextStopKm: payload.distanceToNextStopKm,
            lastUpdatedTimestamp: payload.lastUpdated ? new Date(payload.lastUpdated).getTime() : Date.now(),
            sourceType: payload.sourceType || prev.sourceType,
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
        notificationService.showArrivalAlert(
          'KEC BusConnect Confirmation',
          'Driver has requested passenger boarding confirmation for Bus ' + selectedBus.busNumber,
          window.location.pathname
        );
      }
    });

    // 3. Arrival reminders stream
    const unsubReminders = wsService.subscribeToReminders(selectedBus.busNumber, (payload) => {
      if (payload && payload.etaMinutes !== undefined) {
        setArrivalAlert(payload);
        notificationService.showArrivalAlert(
          '🔔 Bus Arriving Soon',
          payload.message || `Bus ${selectedBus.busNumber} is approximately ${payload.etaMinutes} minutes away!`,
          window.location.pathname
        );
      }
    });

    return () => {
      if (unsubLocation && typeof unsubLocation.unsubscribe === 'function') unsubLocation.unsubscribe();
      if (unsubPassenger && typeof unsubPassenger.unsubscribe === 'function') unsubPassenger.unsubscribe();
      if (unsubReminders && typeof unsubReminders.unsubscribe === 'function') unsubReminders.unsubscribe();
    };
  }, [selectedBus?.busNumber]);

  const handleStopChange = (e) => {
    const stopName = e.target.value;
    setSelectedStop(stopName);
    if (selectedBus) {
      localStorage.setItem(`kec_stop_${selectedBus.busNumber}`, stopName);
    }
  };

  // ─── Student Location Sharing Handlers ──────────────────────────────────────

  // Fetch location share status for this bus (student only)
  useEffect(() => {
    if (!isStudent || !selectedBus?.busNumber) return;
    const busId = selectedBus.id || selectedBus.busNumber;
    api.getLocationShareStatus(busId)
      .then(s => setLocationShareStatus(s))
      .catch(() => {});
  }, [isStudent, selectedBus?.busNumber, selectedBus?.id]);

  // Stop sharing: clear watchPosition, notify backend
  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (shareIntervalRef.current) {
      clearTimeout(shareIntervalRef.current);
      shareIntervalRef.current = null;
    }
    if (interruptionTimerRef.current) {
      clearTimeout(interruptionTimerRef.current);
      interruptionTimerRef.current = null;
    }
    setIsSharing(false);
    setShareInterrupted(false);
    const busId = selectedBus?.id || selectedBus?.busNumber;
    if (busId) {
      try { await api.stopStudentLocationSharing(busId); } catch (_) {}
    }
    // Refresh source status
    if (busId) {
      try {
        const s = await api.getLocationShareStatus(busId);
        setLocationShareStatus(s);
      } catch (_) {}
    }
  }, [selectedBus?.id, selectedBus?.busNumber]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (shareIntervalRef.current) clearTimeout(shareIntervalRef.current);
      if (interruptionTimerRef.current) clearTimeout(interruptionTimerRef.current);
    };
  }, []);

  // Stop sharing when trip ends (activeTripId becomes null)
  useEffect(() => {
    if (isSharing && !activeTripId) {
      stopSharing();
    }
  }, [activeTripId, isSharing, stopSharing]);

  const startSharing = async () => {
    setShareError('');
    setShareInterrupted(false);

    if (!navigator.geolocation) {
      setShareError('Geolocation is not supported by your browser.');
      return;
    }

    const busId = selectedBus?.id || selectedBus?.busNumber;
    if (!busId) { setShareError('Bus ID not available.'); return; }

    // Verify eligibility one more time
    try {
      const status = await api.getLocationShareStatus(busId);
      setLocationShareStatus(status);
      if (!status.canStudentShare && !status.isCurrentSource) {
        if (status.currentSource === 'DRIVER') {
          setShareError('Driver is actively sharing location. You cannot override the driver.');
        } else if (status.currentSource === 'STUDENT') {
          setShareError('Another passenger is already sharing location for this bus.');
        } else if (!status.activeTripExists) {
          setShareError('No active trip for this bus. Sharing is only available during an active trip.');
        } else {
          setShareError('You are not authorized to share location for this bus.');
        }
        return;
      }
    } catch (e) {
      setShareError('Could not verify sharing eligibility. Please try again.');
      return;
    }

    // Start GPS watch
    setIsSharing(true);
    lastSentRef.current = Date.now();

    const sendPosition = async (pos) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      setShareSpeed(speed != null ? Math.round(speed * 3.6) : null); // m/s → km/h
      setShareLastSent(Date.now());
      lastSentRef.current = Date.now();
      setShareInterrupted(false);

      // Reset interruption timer: if no update in 40s → interrupted
      if (interruptionTimerRef.current) clearTimeout(interruptionTimerRef.current);
      interruptionTimerRef.current = setTimeout(() => setShareInterrupted(true), 40000);

      try {
        await api.updateStudentBusLocation(busId, { latitude, longitude, accuracy, speed: speed != null ? speed * 3.6 : null, heading });
      } catch (err) {
        if (err.message && (err.message.includes('Driver') || err.message.includes('passenger') || err.message.includes('override'))) {
          setShareError(err.message);
          stopSharing();
        }
        // Other transient errors: keep trying
      }
    };

    const handleError = (err) => {
      console.warn('GPS error during student sharing:', err.message);
      setShareInterrupted(true);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendPosition,
      handleError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    // Set initial interruption timer
    interruptionTimerRef.current = setTimeout(() => setShareInterrupted(true), 40000);

    // Refresh source status after starting
    setTimeout(async () => {
      try {
        const s = await api.getLocationShareStatus(busId);
        setLocationShareStatus(s);
      } catch (_) {}
    }, 2000);
  };

  // ────────────────────────────────────────────────────────────────────────────

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

  // Calculate Freshness (Requirement 19 & 20)
  const lastUpdatedMs = selectedBus?.lastUpdatedTimestamp || now;
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

  // Trip Direction
  const tripDirection = selectedBus?.direction || (activeTripId?.includes('EVENING') ? 'EVENING' : 'MORNING');

  // Ordered stops based on trip direction (Requirement 3: Reverse for Evening)
  const rawStops = selectedBus?.stops || [];
  const stops = useMemo(() => {
    if (tripDirection === 'EVENING') {
      return [...rawStops].reverse();
    }
    return rawStops;
  }, [rawStops, tripDirection]);

  // Determine Stop Proximity (Requirement 8 & 9)
  let nearestStopName = null;
  let nearestStopDistanceMeters = Infinity;
  let nearestStopIndex = -1;

  const validBusLat = Number(selectedBus?.latitude);
  const validBusLng = Number(selectedBus?.longitude);
  const hasValidBusCoords = !isNaN(validBusLat) && !isNaN(validBusLng) && isFinite(validBusLat) && isFinite(validBusLng);

  if (hasValidBusCoords && stops.length > 0) {
    stops.forEach((stop, idx) => {
      const stopLat = Number(stop.lat ?? stop.latitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[1] : 0));
      const stopLng = Number(stop.lng ?? stop.longitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[0] : 0));
      const distKm = calculateDistanceKm(validBusLat, validBusLng, stopLat, stopLng);
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
  
  const nextStopLat = Number(nextStop?.lat ?? nextStop?.latitude ?? (Array.isArray(nextStop?.location?.coordinates) ? nextStop.location.coordinates[1] : 0));
  const nextStopLng = Number(nextStop?.lng ?? nextStop?.longitude ?? (Array.isArray(nextStop?.location?.coordinates) ? nextStop.location.coordinates[0] : 0));

  const distanceToNextStopKm = (hasValidBusCoords && nextStop) 
    ? Math.round(calculateDistanceKm(validBusLat, validBusLng, nextStopLat, nextStopLng) * 10) / 10
    : 0;

  // Current Speed (Requirement 7)
  const rawSpeedNum = typeof selectedBus?.speed === 'string' ? parseFloat(selectedBus.speed) : (selectedBus?.speed || 0);
  const displaySpeed = isNaN(rawSpeedNum) || rawSpeedNum <= 0 ? '0 km/h' : `${Math.round(rawSpeedNum)} km/h`;

  // Pre-calculate stop-by-stop ETAs unconditionally at top level
  const stopEstimates = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    
    // Use actual bus velocity or standard rural transit speed (28 km/h)
    const effectiveSpeedKmh = (rawSpeedNum > 5) ? rawSpeedNum : 28;
    const targetNext = isCurrentlyAtStop ? nearestStopIndex + 1 : nearestStopIndex;

    return stops.map((stop, idx) => {
      const sLat = Number(stop.lat ?? stop.latitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[1] : 0));
      const sLng = Number(stop.lng ?? stop.longitude ?? (Array.isArray(stop.location?.coordinates) ? stop.location.coordinates[0] : 0));

      // 1. Reached / Passed stops
      if (idx < nearestStopIndex && !isCurrentlyAtStop) {
        return {
          ...stop,
          lat: sLat,
          lng: sLng,
          status: 'PASSED',
          distanceKm: 0,
          etaMinutes: 0,
          etaText: 'Reached',
          clockTime: ''
        };
      }

      // 2. Currently At stop
      if (isCurrentlyAtStop && idx === nearestStopIndex) {
        return {
          ...stop,
          lat: sLat,
          lng: sLng,
          status: 'CURRENT',
          distanceKm: 0,
          etaMinutes: 0,
          etaText: 'At Stop Now',
          clockTime: 'Now'
        };
      }

      // 3. Upcoming stops: calculate cumulative distance along corridor
      let distFromBusKm = 0;
      if (targetNext < stops.length && stops[targetNext]) {
        const tnLat = Number(stops[targetNext].lat ?? stops[targetNext].latitude ?? (Array.isArray(stops[targetNext].location?.coordinates) ? stops[targetNext].location.coordinates[1] : 0));
        const tnLng = Number(stops[targetNext].lng ?? stops[targetNext].longitude ?? (Array.isArray(stops[targetNext].location?.coordinates) ? stops[targetNext].location.coordinates[0] : 0));
        distFromBusKm = calculateDistanceKm(validBusLat, validBusLng, tnLat, tnLng);
        for (let i = targetNext; i < idx; i++) {
          if (stops[i] && stops[i + 1]) {
            const iLat = Number(stops[i].lat ?? stops[i].latitude ?? (Array.isArray(stops[i].location?.coordinates) ? stops[i].location.coordinates[1] : 0));
            const iLng = Number(stops[i].lng ?? stops[i].longitude ?? (Array.isArray(stops[i].location?.coordinates) ? stops[i].location.coordinates[0] : 0));
            const nextLat = Number(stops[i + 1].lat ?? stops[i + 1].latitude ?? (Array.isArray(stops[i + 1].location?.coordinates) ? stops[i + 1].location.coordinates[1] : 0));
            const nextLng = Number(stops[i + 1].lng ?? stops[i + 1].longitude ?? (Array.isArray(stops[i + 1].location?.coordinates) ? stops[i + 1].location.coordinates[0] : 0));
            distFromBusKm += calculateDistanceKm(iLat, iLng, nextLat, nextLng);
          }
        }
      } else {
        distFromBusKm = calculateDistanceKm(validBusLat, validBusLng, sLat, sLng);
      }

      const roundedDist = Math.max(0.1, Math.round(distFromBusKm * 10) / 10);
      const minutes = Math.max(1, Math.round((roundedDist / effectiveSpeedKmh) * 60));
      
      let clockTime = '';
      if (!isNaN(minutes) && isFinite(minutes) && minutes > 0) {
        try {
          clockTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          clockTime = '';
        }
      }

      let etaText = `in ~${minutes} min${minutes > 1 ? 's' : ''}`;
      if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60);
        const remMins = minutes % 60;
        etaText = `in ~${hrs}h ${remMins}m`;
      }

      return {
        ...stop,
        lat: sLat,
        lng: sLng,
        status: 'UPCOMING',
        distanceKm: roundedDist,
        etaMinutes: minutes,
        etaText,
        clockTime
      };
    });
  }, [validBusLat, validBusLng, stops, nearestStopIndex, isCurrentlyAtStop, rawSpeedNum]);

  // Local ETA-based arrival reminder trigger fallback
  const targetStopEstimate = stopEstimates.find(s => s.name === selectedStop) || stopEstimates[stopEstimates.length - 1];

  useEffect(() => {
    if (targetStopEstimate && targetStopEstimate.status === 'UPCOMING' && targetStopEstimate.etaMinutes <= 10 && !reminderTriggeredRef.current && freshnessState === 'LIVE') {
      reminderTriggeredRef.current = true;
      const alertMsg = `${selectedBus?.busNumber || 'Bus'} is approximately ${targetStopEstimate.etaMinutes} minutes away from ${selectedStop || 'your stop'}. Prepare to board.`;
      setArrivalAlert({
        message: alertMsg,
        etaMinutes: targetStopEstimate.etaMinutes,
        stopName: selectedStop
      });
      notificationService.showArrivalAlert('🔔 Bus Arriving Soon!', alertMsg, window.location.pathname);
    }
  }, [targetStopEstimate, freshnessState, selectedBus?.busNumber, selectedStop]);

  // Fallback view if no bus found after all hooks execute
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

  // Specific selected stop ETA
  let etaDisplay = 'ETA UNAVAILABLE';

  if (freshnessState === 'LOCATION_DELAYED') {
    etaDisplay = 'ETA UNAVAILABLE';
  } else if (rawSpeedNum === 0 && selectedBus?.status === 'NOT_STARTED') {
    etaDisplay = targetStopEstimate ? `${targetStopEstimate.etaText} (Trip Scheduled)` : 'TRIP NOT STARTED';
  } else if (targetStopEstimate) {
    if (targetStopEstimate.status === 'CURRENT') {
      etaDisplay = 'BUS IS AT YOUR STOP NOW';
    } else if (targetStopEstimate.status === 'PASSED') {
      etaDisplay = 'BUS HAS ALREADY PASSED';
    } else {
      etaDisplay = `${targetStopEstimate.etaText} • ${targetStopEstimate.clockTime} (${targetStopEstimate.distanceKm} km)`;
    }
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Live Bus Tracking</h1>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: tripDirection === 'EVENING' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                  color: tripDirection === 'EVENING' ? '#a855f7' : 'var(--primary)',
                  border: `1px solid ${tripDirection === 'EVENING' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
                }}>
                  {tripDirection === 'EVENING' ? '🌆 EVENING TRIP: RETURNING HOME' : '🌅 MORNING TRIP: TO COLLEGE'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedBus.busNumber} • {tripDirection === 'EVENING' ? 'KEC (Terminus) → Attikuppam' : (selectedBus.routeName || 'Attikuppam → KEC (via MDR87)')}
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
          
          {/* ─── Student Location Source & Sharing Panel ─────────────────────── */}
          {isStudent && (
            <div className="card animate-fade-in" style={{
              marginBottom: '20px',
              borderLeft: isSharing ? '4px solid var(--success)' : '4px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* Left: Source info + sharing status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Radio size={14} style={{ color: isSharing ? 'var(--success)' : 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Location Source</span>
                    {/* Source type badge */}
                    {(() => {
                      const src = isSharing ? 'STUDENT' : (locationShareStatus?.currentSource || selectedBus?.sourceType);
                      if (!src) return null;
                      const colors = {
                        DRIVER: { bg: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary)' },
                        ADMIN: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' },
                        STUDENT: { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' },
                      };
                      const c = colors[src] || { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' };
                      const labels = { DRIVER: '🚌 Driver', ADMIN: '⚙️ Admin', STUDENT: '👤 Passenger' };
                      return (
                        <span style={{
                          padding: '2px 8px', borderRadius: '8px', fontSize: '10px',
                          fontWeight: 800, background: c.bg, color: c.color,
                          border: `1px solid ${c.color}33`
                        }}>
                          {labels[src] || src}
                        </span>
                      );
                    })()}
                  </div>

                  {isSharing && !shareInterrupted && (
                    <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                      ● SHARING ACTIVE &nbsp;•&nbsp;
                      Speed: {shareSpeed != null ? `${shareSpeed} km/h` : '—'} &nbsp;•&nbsp;
                      Last sent: {shareLastSent ? `${Math.max(0, Math.floor((Date.now() - shareLastSent) / 1000))}s ago` : '—'}
                    </div>
                  )}
                  {isSharing && shareInterrupted && (
                    <div style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: 600 }}>
                      ⚠ LOCATION SHARING INTERRUPTED — Reopen the app to resume GPS.
                    </div>
                  )}
                  {!isSharing && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {locationShareStatus?.currentSource === 'DRIVER' ? 'Driver is sharing live GPS.' :
                       locationShareStatus?.currentSource === 'ADMIN' ? 'Admin is managing bus location.' :
                       locationShareStatus?.currentSource === 'STUDENT' && !locationShareStatus?.isCurrentSource ? 'Another passenger is sharing location.' :
                       'You can help share the bus location if you are on board.'}
                    </div>
                  )}
                  {shareError && (
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>
                      ⚠ {shareError}
                    </div>
                  )}
                </div>

                {/* Right: Share / Stop button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  {!isSharing ? (
                    <button
                      id="student-share-location-btn"
                      onClick={startSharing}
                      disabled={locationShareStatus?.currentSource === 'DRIVER' || locationShareStatus?.currentSource === 'ADMIN' || (locationShareStatus?.currentSource === 'STUDENT' && !locationShareStatus?.isCurrentSource)}
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, gap: '8px', opacity:
                        (locationShareStatus?.currentSource === 'DRIVER' || locationShareStatus?.currentSource === 'ADMIN' ||
                        (locationShareStatus?.currentSource === 'STUDENT' && !locationShareStatus?.isCurrentSource)) ? 0.45 : 1 }}
                    >
                      <Navigation size={14} />
                      SHARE BUS LOCATION
                    </button>
                  ) : (
                    <button
                      id="student-stop-sharing-btn"
                      onClick={stopSharing}
                      className="btn btn-secondary"
                      style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, gap: '8px',
                        borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      <Circle size={14} style={{ fill: 'var(--danger)' }} />
                      STOP SHARING
                    </button>
                  )}
                  {isSharing && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '200px' }}>
                      Your location is being used to track {selectedBus.busNumber}.<br/>
                      Keep location services enabled while sharing.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────────────── */}

          {/* Automated 10-Minute Arrival Reminder Modal / Card */}
          {arrivalAlert && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))',
              border: '2px solid var(--warning)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
              animation: 'bounceIn 0.4s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'var(--warning)', color: 'white', borderRadius: '50%' }}>
                  <Bell size={24} className="animate-bounce" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    🔔 Bus Arriving Soon! (~{arrivalAlert.etaMinutes} mins away)
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: '4px 0 0', fontWeight: 600 }}>
                    {arrivalAlert.message}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => notificationService.playArrivalChime()}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '13px', gap: '6px' }}
                >
                  <Volume2 size={16} /> Replay Chime
                </button>
                <button
                  type="button"
                  onClick={() => setArrivalAlert(null)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* 3-Minute GPS Delay Warning Banner */}
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

          {/* Passenger Confirmation Modal / Banner */}
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

          {/* Telemetry Overview Cards */}
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

            {/* ETA to Boarding/Drop Point */}
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {tripDirection === 'EVENING' ? 'ETA TO YOUR DROP STOP' : 'ESTIMATED ARRIVAL (ETA)'}
              </span>
              <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                {etaDisplay}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {tripDirection === 'EVENING' ? 'Drop stop: ' : 'Boarding stop: '}<strong>{selectedStop || (tripDirection === 'EVENING' ? 'Drop Location' : 'Attikuppam')}</strong>
              </p>
            </div>

          </div>

          {/* Main Map & Route Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'stretch' }} className="tracking-grid-layout">
            
            {/* Live Leaflet Map Column */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
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
                <MapView bus={selectedBus} stopEstimates={stopEstimates} />
              </div>
            </div>

            {/* Route Stops Progress Timeline with Live Per-Stop ETAs */}
            <div className="card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Live Route Stops & ETAs</h3>
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
                {stopEstimates.map((stop, idx) => {
                  const isCurrent = stop.status === 'CURRENT';
                  const isReached = stop.status === 'PASSED';
                  const isSelected = stop.name === selectedStop;

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '12px', 
                        marginBottom: '18px',
                        position: 'relative'
                      }}
                    >
                      {/* Timeline Indicator */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isCurrent ? (
                          <div style={{
                            width: '20px',
                            height: '20px',
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
                            width: '20px',
                            height: '20px',
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
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '2px solid var(--border-color)',
                            background: 'var(--bg-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)'
                          }}>
                            {idx + 1}
                          </div>
                        )}

                        {idx < stopEstimates.length - 1 && (
                          <div style={{
                            width: '2px',
                            height: '32px',
                            background: isReached ? 'var(--primary)' : 'var(--border-color)',
                            margin: '2px 0'
                          }} />
                        )}
                      </div>

                      {/* Stop Info & Estimated Arrival Times */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: isCurrent ? 800 : (isSelected ? 700 : 600),
                            color: isCurrent ? 'var(--success)' : (isSelected ? 'var(--primary)' : 'var(--text-main)')
                          }}>
                            {stop.name}
                          </span>

                          {isSelected && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'rgba(37, 99, 235, 0.12)',
                              color: 'var(--primary)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              YOUR STOP
                            </span>
                          )}
                        </div>

                        {/* Stop Status / ETA Subtitle */}
                        <div style={{ marginTop: '3px', fontSize: '12px' }}>
                          {isCurrent ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              background: 'var(--success)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              letterSpacing: '0.5px'
                            }}>
                              ● CURRENTLY AT {stop.name.toUpperCase()}
                            </span>
                          ) : isReached ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              ✓ Passed / Reached
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ 
                                color: 'var(--primary)', 
                                fontWeight: 700, 
                                background: 'rgba(37, 99, 235, 0.08)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px'
                              }}>
                                ⏱ {stop.etaText} {stop.clockTime && `(${stop.clockTime})`}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                                • {stop.distanceKm} km away
                              </span>
                            </div>
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
