import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Compass, CheckCircle2, Shield, Calendar, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const createPreviewIcon = () => {
  return new L.DivIcon({
    className: 'custom-bus-div-icon',
    html: `
      <div class="custom-bus-div-icon-inner" style="
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        background-color: var(--primary); 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4); 
        border: 2px solid white;
        font-size: 16px;
      ">
        🚌
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const Landing = () => {
  const previewPosition = [12.768058, 78.432970]; // Kangundhi stop along MDR87
  const busIcon = createPreviewIcon();

  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="badge badge-success" style={{ marginBottom: '16px', textTransform: 'none', fontWeight: 600 }}>
              🚀 Live GPS Tracking Active: MDR87 Corridor (Attikuppam → KEC)
            </span>
            <h1>Never Miss Your College Bus Again.</h1>
            <p>
              Track <strong>Bus KEC-07</strong> live on MDR87 route from Attikuppam through Singasamudram and Kangundhi directly to Kuppam Engineering College (39.8 km).
            </p>
            <div className="hero-buttons">
              <Link to="/student-login" className="btn btn-primary btn-lg">
                <Navigation size={18} />
                Track Bus KEC-07
              </Link>
              <Link to="/student-login" className="btn btn-secondary btn-lg">
                Student Login
              </Link>
            </div>
          </div>

          <div className="hero-visual animate-fade-in">
            <div style={{ height: '400px', width: '100%', position: 'relative' }}>
              <MapContainer
                center={previewPosition}
                zoom={12}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={previewPosition} icon={busIcon}>
                  <Popup>KEC-07 near Kangundhi (MDR87)</Popup>
                </Marker>
              </MapContainer>

              {/* Glassmorphic Overlay Preview Card */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                zIndex: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Bus KEC-07</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Attikuppam → KEC (39.8 km)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>● LIVE GPS</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ETA: ~45 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Real-Time Transit Intelligence</h2>
            <p>Designed custom-tailored for KEC campus transport, keeping students and administrative operators connected.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <MapPin size={28} />
              </div>
              <h3>Real-Time Tracking</h3>
              <p>Know exactly where your bus is at any moment, eliminating long wait times at stops.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Compass size={28} />
              </div>
              <h3>Multiple Bus Routes</h3>
              <p>Explore and track all college routes covering Kuppam and surrounding regions.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle2 size={28} />
              </div>
              <h3>Easy to Use</h3>
              <p>A simple, intuitive interface designed for students, drivers, and administrators.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={28} />
              </div>
              <h3>Location Updates</h3>
              <p>Simulated high-frequency location updates keep bus status and coordinates precise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About / Campus Section */}
      <section className="features-section" id="about" style={{ backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '20px' }}>Campus-Wide Connectivity</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              At Kuppam Engineering College, we prioritize student safety, convenience, and efficiency. KEC BusConnect bridges the gap between campus transportation schedules and students.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Authorized travelers on each bus can turn on location sharing, which streams current transit coordinates to all student screens, keeping the schedule transparent and reliable.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ color: 'var(--primary)' }} size={20} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>3000+ Students</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ color: 'var(--primary)' }} size={20} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Daily College Trips</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Quick Travel Resource</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                <strong style={{ color: 'var(--primary)' }}>•</strong>
                <span><strong>Morning Arrival:</strong> All buses reach KEC campus by 8:45 AM.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                <strong style={{ color: 'var(--primary)' }}>•</strong>
                <span><strong>Evening Departure:</strong> All buses leave KEC campus at 4:30 PM.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                <strong style={{ color: 'var(--primary)' }}>•</strong>
                <span><strong>Tracking Authority:</strong> Only authorized students/drivers can share live coordinates.</span>
              </li>
            </ul>
            <Link to="/student-login" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container footer-container">
          <div className="footer-logo">
            KEC <span>BusConnect</span>
          </div>
          <div className="footer-info">
            <p>© 2026 Kuppam Engineering College. All rights reserved.</p>
            <p style={{ fontSize: '12px', color: 'hsl(220, 20%, 60%)', marginTop: '4px' }}>
              Designed for optimal transit operations. Kuppam, Andhra Pradesh, India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
