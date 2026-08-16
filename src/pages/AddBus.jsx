import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { PlusCircle, ArrowLeft, Bus, Navigation, MapPin } from 'lucide-react';

const AddBus = ({ onAddBus }) => {
  const navigate = useNavigate();
  const [busNumber, setBusNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [status, setStatus] = useState('INACTIVE');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate simulated coordinates and stops based on starting point & destination
    const startLat = 13.3300 + Math.random() * 0.02;
    const startLng = 78.1000 + Math.random() * 0.02;
    const destLat = 13.3550; // KEC Campus Latitude
    const destLng = 78.1400; // KEC Campus Longitude

    const newBus = {
      id: Date.now(),
      busNumber: busNumber.toUpperCase().trim(),
      routeName: `${routeName.trim()} (${startingPoint.trim()} → ${destination.trim()})`,
      routeCode: routeName.trim(),
      status: status,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim() || '+91 99999 88888',
      latitude: startLat,
      longitude: startLng,
      lastUpdated: 'Just now',
      speed: '0 km/h',
      passengers: 0,
      stops: [
        { name: startingPoint.trim(), lat: startLat, lng: startLng, reached: false },
        { name: 'Intermediate Crossroad', lat: (startLat + destLat) / 2, lng: (startLng + destLng) / 2, reached: false },
        { name: destination.trim(), lat: destLat, lng: destLng, reached: false }
      ],
      path: [
        [startLat, startLng],
        [(startLat + destLat) / 2, (startLng + destLng) / 2],
        [destLat, destLng]
      ]
    };

    onAddBus(newBus);
    navigate('/admin/dashboard');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="admin" />

      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Add New Fleet Bus</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expand college transit operations</p>
          </div>
          <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          <div className="form-card animate-fade-in">
            <div className="card">
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={22} style={{ color: 'var(--primary)' }} />
                Fleet Vehicle Registration
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="busNumber">Bus Number / Transit ID</label>
                    <input 
                      id="busNumber"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. BUS-04"
                      value={busNumber}
                      onChange={(e) => setBusNumber(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="routeName">Route Name / Code</label>
                    <input 
                      id="routeName"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Route D"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="startingPoint">Starting Point</label>
                    <input 
                      id="startingPoint"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Kuppam Junction"
                      value={startingPoint}
                      onChange={(e) => setStartingPoint(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="destination">Destination</label>
                    <input 
                      id="destination"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. KEC Campus"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="driverName">Driver Name</label>
                    <input 
                      id="driverName"
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Anil Kumar"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="driverPhone">Driver Phone (Contact)</label>
                    <input 
                      id="driverPhone"
                      type="tel" 
                      className="form-control" 
                      placeholder="e.g. +91 99887 76655"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group form-grid-full">
                    <label htmlFor="status">Initial Status</label>
                    <select 
                      id="status"
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="ON_ROUTE">On Route (Active)</option>
                      <option value="INACTIVE">Inactive (Scheduled)</option>
                      <option value="OFFLINE">Offline (Maintenance)</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <Link to="/admin/dashboard" className="btn btn-secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Register Bus
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddBus;
