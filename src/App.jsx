import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import initialBuses from './data/mockBuses';
import { api } from './services/api';
import { wsService } from './services/websocketService';

import ErrorBoundary from './components/ErrorBoundary';

// Import Pages
import Landing from './pages/Landing';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import BusTracking from './pages/BusTracking';
import LocationSharing from './pages/LocationSharing';
import AdminDashboard from './pages/AdminDashboard';
import AddBus from './pages/AddBus';
import BusDetails from './pages/BusDetails';
import StudentProfile from './pages/StudentProfile';
import StudentSignup from './pages/StudentSignup';

// ── Route guards ──
const RequireStudentAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token && !localStorage.getItem('kec_current_user')) {
    return <Navigate to="/student-login" replace />;
  }
  return children;
};

const RequireAdminAuth = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

const RequireDriverAuth = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'driver' && role !== 'tracker' && role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

function App() {
  const [buses, setBuses] = useState(initialBuses);

  // Fetch real buses and routes from Spring Boot backend with robust fallback
  const fetchBusesData = async () => {
    try {
      const activeBuses = await api.getActiveBuses();
      const activeRoutes = await api.getActiveRoutes();

      if (!activeBuses || activeBuses.length === 0) {
        return initialBuses;
      }

      const defaultRoute = (activeRoutes && activeRoutes.length > 0) ? activeRoutes[0] : null;

      const mergedBuses = await Promise.all(activeBuses.map(async (bus) => {
        const route = (activeRoutes || []).find(r => r.id === bus.routeId || r.name === bus.routeName) || defaultRoute;
        
        let location = null;
        try {
          location = await api.getBusLocation(bus.id);
        } catch (e) {
          // ignore if no location record yet
        }

        // Helper to extract lat / lng from GeoPoint or plain object
        const extractCoords = (loc, defaultLat = 12.884713, defaultLng = 78.479812) => {
          if (!loc) return { lat: defaultLat, lng: defaultLng };
          if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
            return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
          }
          if (loc.latitude !== undefined && loc.longitude !== undefined) {
            return { lat: Number(loc.latitude), lng: Number(loc.longitude) };
          }
          if (loc.lat !== undefined && loc.lng !== undefined) {
            return { lat: Number(loc.lat), lng: Number(loc.lng) };
          }
          return { lat: defaultLat, lng: defaultLng };
        };

        // Extract stops
        let stops = [];
        if (route && route.stops && route.stops.length > 0) {
          stops = route.stops.map((stop) => {
            const c = extractCoords(stop.location || stop);
            return {
              name: stop.name,
              reached: false,
              current: false,
              lat: c.lat,
              lng: c.lng,
              latitude: c.lat,
              longitude: c.lng,
              landmark: stop.landmark || stop.name
            };
          });
        } else if (initialBuses[0] && initialBuses[0].stops) {
          stops = initialBuses[0].stops;
        }

        // Extract path
        let path = [];
        if (stops.length > 0) {
          path = stops.map(s => [s.lat, s.lng]);
        }

        // Bus live coordinates
        const busCoords = extractCoords(
          location?.location || location, 
          stops.length > 0 ? stops[0].lat : 12.884713, 
          stops.length > 0 ? stops[0].lng : 78.479812
        );

        return {
          id: bus.id,
          busNumber: bus.busNumber || 'KEC-07',
          registrationNumber: bus.registrationNumber || 'AP-39-TJ-2026',
          route: route ? route.name : 'Attikuppam → KEC (via MDR87)',
          routeName: route ? route.name : 'Attikuppam → KEC (via MDR87)',
          routeFullName: 'Attikuppam → KEC (via MDR87)',
          totalDistance: '39.8 km',
          status: bus.status || 'RUNNING',
          driverName: 'Driver Name',
          driverPhone: 'XXXXXXXXXXXXXX',
          latitude: busCoords.lat,
          longitude: busCoords.lng,
          lastUpdated: location ? 'Just now' : 'Standby',
          speed: location && location.speed ? `${location.speed} km/h` : '0 km/h',
          passengers: 28,
          stops,
          path,
          lastUpdatedTimestamp: location?.updatedAt ? new Date(location.updatedAt).getTime() : Date.now()
        };
      }));

      return mergedBuses;
    } catch (e) {
      console.warn("Using baseline fleet configuration:", e.message);
      return initialBuses;
    }
  };

  useEffect(() => {
    // Initial fetch from Spring Boot
    const init = async () => {
      const data = await fetchBusesData();
      if (data && data.length > 0) {
        setBuses(data);
      }
    };
    init();

    // Connect to STOMP WebSocket for real-time driver GPS broadcasts
    wsService.connect();
    const unsub = wsService.subscribeToAllBuses((payload) => {
      if (payload && payload.busNumber) {
        setBuses(prevBuses =>
          prevBuses.map(bus => {
            if (bus.busNumber === payload.busNumber) {
              const lat = payload.location?.latitude ?? payload.location?.coordinates?.[1] ?? payload.latitude;
              const lng = payload.location?.longitude ?? payload.location?.coordinates?.[0] ?? payload.longitude;
              return {
                ...bus,
                latitude: lat != null ? lat : bus.latitude,
                longitude: lng != null ? lng : bus.longitude,
                status: payload.status || bus.status,
                speed: payload.speed != null ? `${payload.speed} km/h` : bus.speed,
                lastUpdated: 'Just now',
                lastUpdatedTimestamp: Date.now()
              };
            }
            return bus;
          })
        );
      }
    });

    // Heartbeat sync every 15 seconds to ensure consistency with backend
    const interval = setInterval(async () => {
      const fresh = await fetchBusesData();
      if (fresh && fresh.length > 0) {
        setBuses(fresh);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (unsub && typeof unsub.unsubscribe === 'function') unsub.unsubscribe();
    };
  }, []);

  const handleUpdateBusLocation = async (busNumber, updateData) => {
    const bus = buses.find(b => b.busNumber === busNumber);
    if (bus && bus.id) {
      try {
        if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
          const speedVal = parseFloat(updateData.speed) || 0.0;
          await api.updateBusLocation(bus.id, {
            latitude: updateData.latitude,
            longitude: updateData.longitude,
            speed: speedVal,
            accuracy: updateData.accuracy || 10.0,
            heading: updateData.heading || 0.0
          });
        }
      } catch (e) {
        console.warn("Backend update notice:", e.message);
      }
    }

    setBuses(prevBuses =>
      prevBuses.map(b =>
        b.busNumber === busNumber ? { ...b, ...updateData } : b
      )
    );
  };

  const handleRefreshLocation = async (busNumber) => {
    const fresh = await fetchBusesData();
    if (fresh && fresh.length > 0) {
      setBuses(fresh);
    }
  };

  const handleAddBus = async (newBus) => {
    try {
      const activeRoutes = await api.getActiveRoutes();
      const defaultRouteId = activeRoutes.length > 0 ? activeRoutes[0].id : null;

      await api.adminCreateBus({
        busNumber: newBus.busNumber,
        registrationNumber: newBus.registrationNumber,
        routeId: defaultRouteId,
        isActive: true
      });

      const data = await fetchBusesData();
      setBuses(data);
    } catch (e) {
      console.warn("Add bus notice:", e.message);
    }
  };

  const handleDeleteBus = async (busNumber) => {
    const bus = buses.find(b => b.busNumber === busNumber);
    if (bus && bus.id) {
      try {
        await api.adminDeleteBus(bus.id);
        const data = await fetchBusesData();
        setBuses(data);
      } catch (e) {
        console.warn("Delete bus notice:", e.message);
      }
    }
  };

  const handleEditBus = async (updatedBus) => {
    const bus = buses.find(b => b.busNumber === updatedBus.busNumber);
    if (bus && bus.id) {
      try {
        await api.adminUpdateBus(bus.id, {
          busNumber: updatedBus.busNumber,
          registrationNumber: updatedBus.registrationNumber,
          routeId: bus.routeId,
          isActive: true
        });
        const data = await fetchBusesData();
        setBuses(data);
      } catch (e) {
        console.warn("Edit bus notice:", e.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('kec_current_user');
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Authentication Pages */}
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-signup" element={<StudentSignup />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/driver-login" element={<AdminLogin />} />

          {/* Student Area */}
          <Route
            path="/student/dashboard"
            element={
              <RequireStudentAuth>
                <StudentDashboard buses={buses} onLogout={handleLogout} />
              </RequireStudentAuth>
            }
          />
          <Route
            path="/student/track/:busNumber"
            element={
              <RequireStudentAuth>
                <BusTracking buses={buses} onRefreshLocation={handleRefreshLocation} />
              </RequireStudentAuth>
            }
          />
          <Route
            path="/student/profile"
            element={
              <RequireStudentAuth>
                <StudentProfile buses={buses} />
              </RequireStudentAuth>
            }
          />

          {/* Driver / Staff Area */}
          <Route
            path="/driver/dashboard"
            element={
              <RequireDriverAuth>
                <LocationSharing buses={buses} onUpdateBusLocation={handleUpdateBusLocation} />
              </RequireDriverAuth>
            }
          />
          <Route
            path="/student/share"
            element={
              <LocationSharing buses={buses} onUpdateBusLocation={handleUpdateBusLocation} />
            }
          />

          {/* Admin Area */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdminAuth>
                <AdminDashboard
                  buses={buses}
                  onDeleteBus={handleDeleteBus}
                  onEditBus={handleEditBus}
                />
              </RequireAdminAuth>
            }
          />
          <Route
            path="/admin/add-bus"
            element={
              <RequireAdminAuth>
                <AddBus onAddBus={handleAddBus} />
              </RequireAdminAuth>
            }
          />
          <Route
            path="/admin/bus/:busNumber"
            element={
              <RequireAdminAuth>
                <BusDetails buses={buses} onRefreshLocation={handleRefreshLocation} />
              </RequireAdminAuth>
            }
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
