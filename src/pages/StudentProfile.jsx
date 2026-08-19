import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
  User, 
  Phone, 
  Mail, 
  Award, 
  BookOpen, 
  MapPin, 
  Hash, 
  ShieldCheck, 
  Compass, 
  Landmark, 
  Navigation, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';

const boardingPinIcon = new L.DivIcon({
  className: 'custom-boarding-pin',
  html: `
    <div style="
      background-color: var(--primary);
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const StudentProfile = ({ buses = [] }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [boardingAddress, setBoardingAddress] = useState('');
  const navigate = useNavigate();

  // Change Boarding Location Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState(null);
  const [detectedAccuracy, setDetectedAccuracy] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Load student profile from Spring Boot / localStorage session
  useEffect(() => {
    const loadProfile = async () => {
      let currentStudent = null;
      try {
        const me = await api.getMe();
        if (me && me.student) {
          currentStudent = me.student;
          setStudentInfo(me.student);
          localStorage.setItem('kec_current_user', JSON.stringify(me.student));
        }
      } catch (e) {
        // fallback
      }

      if (!currentStudent) {
        const savedUser = localStorage.getItem('kec_current_user');
        if (savedUser) {
          try {
            currentStudent = JSON.parse(savedUser);
            setStudentInfo(currentStudent);
          } catch {
            navigate('/student-login', { replace: true });
            return;
          }
        } else {
          navigate('/student-login', { replace: true });
          return;
        }
      }

      // Reverse geocode boarding location to display human-readable place name
      if (currentStudent && currentStudent.boardingLocation) {
        const loc = currentStudent.boardingLocation;
        const lat = loc.coordinates ? loc.coordinates[1] : loc.latitude;
        const lng = loc.coordinates ? loc.coordinates[0] : loc.longitude;
        if (lat != null && lng != null) {
          try {
            const geo = await api.reverseGeocode(lat, lng);
            if (geo && (geo.formattedShort || geo.displayName)) {
              setBoardingAddress(geo.formattedShort || geo.displayName);
            } else {
              setBoardingAddress('Attikuppam / Singasamudram Corridor');
            }
          } catch (err) {
            setBoardingAddress('Attikuppam (Origin) / MDR87 Corridor');
          }
        }
      }
    };
    loadProfile();
  }, [navigate]);

  // Handle GPS detection for boarding location
  const handleDetectGPS = () => {
    setLocationError('');
    setIsLocating(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 15;

        setDetectedCoords({ lat, lng });
        setDetectedAccuracy(acc);

        try {
          const geo = await api.reverseGeocode(lat, lng);
          if (geo && (geo.formattedShort || geo.displayName)) {
            setDetectedAddress(geo.formattedShort || geo.displayName);
          } else {
            setDetectedAddress(`Custom Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          }
        } catch {
          setDetectedAddress(`GPS Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('GPS permission was denied. Please allow location access in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location position unavailable. Please ensure your device GPS is enabled.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('GPS detection timed out. Please retry.');
        } else {
          setLocationError(err.message || 'Error detecting GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Confirm and save new boarding location to backend
  const handleSaveBoardingLocation = async () => {
    if (!detectedCoords) return;
    setIsSaving(true);
    setLocationError('');
    try {
      await api.updateBoardingLocation({
        latitude: detectedCoords.lat,
        longitude: detectedCoords.lng,
        accuracy: detectedAccuracy,
        addressName: detectedAddress
      });

      setBoardingAddress(detectedAddress);
      setSaveSuccessMsg('Boarding location successfully updated!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setIsModalOpen(false);
        setDetectedCoords(null);
      }, 1200);
    } catch (err) {
      setLocationError(err.message || 'Failed to update boarding location.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!studentInfo) return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Loading profile…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="student" />

      <div className="main-content">
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Student Profile</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>View your academic transit details</p>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-body">
          <div className="profile-card animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '40px 32px' }}>
              <div className="profile-avatar">
                {studentInfo.fullName ? studentInfo.fullName.split(' ').map(n => n[0]).join('') : 'ST'}
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
                {studentInfo.fullName}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>
                {studentInfo.collegeType} {studentInfo.program && studentInfo.program !== 'Diploma' && studentInfo.program !== 'MBA' && `• ${studentInfo.program}`}
              </p>

              <div className="profile-details" style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Academic & Contact Records
                </h3>

                <div className="profile-row">
                  <span className="profile-label">
                    <Hash size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Student Roll Number
                  </span>
                  <span className="profile-value">{studentInfo.studentId || '22KEC401'}</span>
                </div>

                <div className="profile-row">
                  <span className="profile-label">
                    <Mail size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    College Email ID
                  </span>
                  <span className="profile-value">{studentInfo.email}</span>
                </div>

                <div className="profile-row">
                  <span className="profile-label">
                    <Phone size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Contact Number
                  </span>
                  <span className="profile-value">{studentInfo.mobile || '+91 98888 77777'}</span>
                </div>

                <div className="profile-row">
                  <span className="profile-label">
                    <Landmark size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    College / Program
                  </span>
                  <span className="profile-value">{studentInfo.collegeType} ({studentInfo.program})</span>
                </div>

                {studentInfo.collegeType !== 'MBA' && studentInfo.collegeType !== 'Degree' && (
                  <div className="profile-row">
                    <span className="profile-label">
                      <Award size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                      Department
                    </span>
                    <span className="profile-value">{studentInfo.department || 'CSE'}</span>
                  </div>
                )}

                <div className="profile-row">
                  <span className="profile-label">
                    <BookOpen size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Academic Year
                  </span>
                  <span className="profile-value">{studentInfo.academicYear ? `${studentInfo.academicYear} Year` : '3rd Year'}</span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Transit Route & Boarding Point
                </h3>

                <div className="profile-row" style={{ alignItems: 'flex-start' }}>
                  <span className="profile-label">
                    <MapPin size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Assigned Boarding Point
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="profile-value" style={{ fontWeight: 700, color: 'var(--primary)', display: 'block' }}>
                      {boardingAddress || 'Attikuppam (Origin)'}
                    </span>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn btn-secondary"
                      style={{ marginTop: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, gap: '6px' }}
                    >
                      <Navigation size={12} /> CHANGE BOARDING LOCATION
                    </button>
                  </div>
                </div>

                <div className="profile-row">
                  <span className="profile-label">
                    <Compass size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Assigned Bus & Route
                  </span>
                  <span className="profile-value">
                    KEC-07 (Attikuppam → KEC via MDR87)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Boarding Location Modal (Requirement 11) */}
          {isModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                  onClick={() => { setIsModalOpen(false); setDetectedCoords(null); }}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ padding: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Change Boarding Location</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Capture your personal boarding pickup coordinates</p>
                  </div>
                </div>

                {/* GPS Capture Button */}
                <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <button
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, gap: '8px', width: '100%' }}
                  >
                    <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
                    {isLocating ? 'Detecting Satellite GPS…' : 'USE MY CURRENT LOCATION'}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Requires device GPS permission. Your location is only read upon confirmation.
                  </p>
                </div>

                {/* Error Banner */}
                {locationError && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <AlertTriangle size={16} />
                    <span>{locationError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {saveSuccessMsg && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <CheckCircle size={16} />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Interactive Map Preview with Marker & Accuracy Circle */}
                {detectedCoords && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Detected Pickup Place</span>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary)', marginTop: '2px' }}>{detectedAddress}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GPS Accuracy: ±{detectedAccuracy} meters</span>
                    </div>

                    {detectedAccuracy > 50 && (
                      <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: 'var(--warning)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={14} />
                        <span>Accuracy is ±{detectedAccuracy}m. You can retry for a tighter GPS fix.</span>
                      </div>
                    )}

                    <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                      <MapContainer
                        key={`profile-map-${detectedCoords.lat}-${detectedCoords.lng}`}
                        center={[Number(detectedCoords.lat), Number(detectedCoords.lng)]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[Number(detectedCoords.lat), Number(detectedCoords.lng)]} icon={boardingPinIcon}>
                          <Popup>Your Selected Boarding Point</Popup>
                        </Marker>
                        <Circle
                          center={[Number(detectedCoords.lat), Number(detectedCoords.lng)]}
                          radius={detectedAccuracy || 20}
                          pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.15 }}
                        />
                      </MapContainer>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleSaveBoardingLocation}
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700 }}
                      >
                        {isSaving ? 'Saving…' : 'Confirm & Save Location'}
                      </button>
                      <button
                        onClick={() => setDetectedCoords(null)}
                        className="btn btn-secondary"
                        style={{ padding: '12px 18px', fontSize: '13px' }}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
