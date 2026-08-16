import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BusStatus from '../components/BusStatus';
import { MapPin, Bus, User, LogOut, ArrowRight, ShieldCheck, GraduationCap, Navigation } from 'lucide-react';
import { api } from '../services/api';

const StudentDashboard = ({ buses = [], onLogout }) => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [boardingAddress, setBoardingAddress] = useState('');

  // Load student profile from backend / localStorage
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
        // fallback to localStorage
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

      // Reverse geocode boarding point if coordinates exist
      if (currentStudent && currentStudent.boardingLocation) {
        const loc = currentStudent.boardingLocation;
        const lat = loc?.coordinates ? loc.coordinates[1] : loc?.latitude;
        const lng = loc?.coordinates ? loc.coordinates[0] : loc?.longitude;
        if (lat != null && lng != null) {
          try {
            const geo = await api.reverseGeocode(lat, lng);
            if (geo && (geo.formattedShort || geo.displayName)) {
              setBoardingAddress(geo.formattedShort || geo.displayName);
            } else {
              setBoardingAddress(currentStudent.boardingPoint || 'Attikuppam (Origin)');
            }
          } catch (e) {
            setBoardingAddress(currentStudent.boardingPoint || 'Attikuppam (Origin)');
          }
        }
      }
    };
    loadProfile();
  }, [navigate]);

  if (!studentInfo) return null;

  // Single bus in pilot is KEC-07
  const assignedBus = (buses && buses.length > 0) ? buses[0] : {
    busNumber: 'KEC-07',
    routeName: 'Attikuppam → KEC',
    routeFullName: 'Attikuppam → KEC (via MDR87)',
    status: 'RUNNING',
    totalDistance: '39.8 km'
  };

  const boardingLabel = boardingAddress || studentInfo.boardingPoint || 'Attikuppam (Origin)';

  const renderAcademicDetailsBanner = () => {
    const { collegeType, program, department, academicYear, section } = studentInfo;

    return (
      <div>
        <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 800 }}>
          Welcome, {studentInfo.fullName ? studentInfo.fullName.split(' ')[0] : 'Student'}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginTop: '6px', fontWeight: 500, lineHeight: '1.5' }}>
          <strong>{collegeType || 'Engineering'} {program && `• ${program}`}</strong><br />
          {department && `${department}`}<br />
          {academicYear || '3rd Year'} {section && section !== 'N/A' && `• Section ${section}`}
        </p>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="student" onLogout={onLogout} />

      <div className="main-content">
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>KEC BusConnect</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kuppam Engineering College</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{studentInfo.fullName || 'Student'}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{studentInfo.studentId || '22KEC401'}</span>
            </div>
            <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '16px', margin: 0 }}>
              {studentInfo.fullName ? studentInfo.fullName.split(' ').map(n => n[0]).join('') : 'ST'}
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="dashboard-body" style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          {/* 1. PERSONALIZED STUDENT BANNER */}
          <div className="card animate-fade-in" style={{ 
            marginBottom: '24px', 
            background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)', 
            color: 'white',
            border: 'none',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              {renderAcademicDetailsBanner()}
              
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(4px)', minWidth: '150px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block' }}>Boarding Location</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{boardingLabel}</span>
              </div>
            </div>
          </div>

          {/* 2. DEDICATED ASSIGNED BUS CARD (ONLY BUS KEC-07) */}
          <div className="card animate-fade-in" style={{ marginBottom: '40px', borderLeft: '5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Your Assigned Bus
                </h3>
                <h4 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  KEC-07
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  Route: Attikuppam → KEC (via MDR87) • 39.8 km
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <BusStatus status={assignedBus.status || 'RUNNING'} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Boarding: <strong>{boardingLabel}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <Link 
                to="/student/track/KEC-07"
                className="btn btn-primary"
                style={{ gap: '8px', padding: '12px 32px', fontWeight: 700, fontSize: '15px' }}
              >
                <Navigation size={18} />
                Track My Bus Live
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
export { StudentDashboard };
