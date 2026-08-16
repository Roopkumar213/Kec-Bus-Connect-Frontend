import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User, Phone, Mail, Award, BookOpen, MapPin, Hash, ShieldCheck, Compass, Landmark } from 'lucide-react';
import { api } from '../services/api';

const StudentProfile = ({ buses = [] }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [boardingAddress, setBoardingAddress] = useState('');
  const navigate = useNavigate();

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
              setBoardingAddress('Singasamudram / MDR87 Corridor');
            }
          } catch (err) {
            setBoardingAddress('Singasamudram (Near Sri Anjaneya Swamy Temple)');
          }
        }
      }
    };
    loadProfile();
  }, [navigate]);

  if (!studentInfo) return null;

  // Find routing allocation details
  const primaryBus = buses.find(b => b.id === studentInfo.assignedBus || b.busNumber === studentInfo.busNumber) || buses[0] || {};

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
          <div className="profile-card animate-fade-in">
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

                {studentInfo.collegeType === 'Degree' && (
                  <div className="profile-row">
                    <span className="profile-label">
                      <Award size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                      Degree Specialization
                    </span>
                    <span className="profile-value">{studentInfo.program}</span>
                  </div>
                )}

                <div className="profile-row">
                  <span className="profile-label">
                    <BookOpen size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Academic Year
                  </span>
                  <span className="profile-value">{studentInfo.academicYear ? `${studentInfo.academicYear} Year` : '3rd Year'}</span>
                </div>

                {studentInfo.collegeType !== 'MBA' && (
                  <>
                    <div className="profile-row">
                      <span className="profile-label">
                        <BookOpen size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                        Class Section
                      </span>
                      <span className="profile-value">Section {studentInfo.section || 'A'}</span>
                    </div>

                    <div className="profile-row">
                      <span className="profile-label">
                        <ShieldCheck size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                        Admission Batch
                      </span>
                      <span className="profile-value">{studentInfo.batch || '2023 - 2027'}</span>
                    </div>
                  </>
                )}

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Transit Route Assignment
                </h3>

                <div className="profile-row">
                  <span className="profile-label">
                    <MapPin size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Assigned Boarding Point
                  </span>
                  <span className="profile-value" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                    {boardingAddress || studentInfo.boardingPoint || 'Singasamudram (Near Sri Anjaneya Swamy Temple)'}
                  </span>
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
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
