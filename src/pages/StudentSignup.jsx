import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, User, Phone, Award, BookOpen, MapPin, ArrowLeft, Shield, Landmark } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { 
  COLLEGE_EMAIL_DOMAIN, 
  PROGRAMS_CONFIG,
  BOARDING_POINTS, 
  BUS_ROUTES, 
  BUS_NUMBERS 
} from '../data/mockSignupData';

// Custom boarding point marker icon
const boardingIcon = new L.DivIcon({
  className: 'custom-stop-div-icon',
  html: `<div class="custom-stop-div-icon-inner current" style="
    width: 16px; 
    height: 16px; 
    border-radius: 50%; 
    background-color: var(--primary); 
    border: 3px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const StudentSignup = () => {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Academic program states
  const [collegeProgram, setCollegeProgram] = useState('Engineering (B.Tech)');
  const [department, setDepartment] = useState(PROGRAMS_CONFIG['Engineering (B.Tech)'].departments[0]);
  const [academicYear, setAcademicYear] = useState(PROGRAMS_CONFIG['Engineering (B.Tech)'].academicYears[0]);
  const [section, setSection] = useState('A');
  const [batch, setBatch] = useState('2023 - 2027');

  // Bus route selection
  const [busRoute, setBusRoute] = useState(BUS_ROUTES[0]);
  const [busNumber, setBusNumber] = useState(BUS_NUMBERS[0]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);

  // Geolocation States
  const [locationState, setLocationState] = useState('idle'); // idle, detecting, detected, error
  const [coords, setCoords] = useState({ latitude: null, longitude: null, accuracy: null });
  const [reverseAddress, setReverseAddress] = useState('');
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [accuracyWarning, setAccuracyWarning] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const b = await api.getActiveBuses();
        const r = await api.getActiveRoutes();
        if (b && b.length > 0) {
          setBuses(b);
          setBusNumber(b[0].busNumber);
        }
        if (r && r.length > 0) {
          setRoutes(r);
          setBusRoute(r[0].name);
        }
      } catch (e) {
        // fallback to defaults
      }
    };
    fetchMeta();
  }, []);


  // Password hide/show states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [emailWarning, setEmailWarning] = useState('');

  // Read config based on active program selection
  const activeConfig = PROGRAMS_CONFIG[collegeProgram];
  const departmentsList = activeConfig.departments;
  const academicYearsList = activeConfig.academicYears;

  // Handle program type switch with active reset triggers
  const handleProgramChange = (e) => {
    const newProgram = e.target.value;
    setCollegeProgram(newProgram);

    // Dynamic reset to avoid incompatible values in form state
    const newConfig = PROGRAMS_CONFIG[newProgram];
    setDepartment(newConfig.departments[0]);
    setAcademicYear(newConfig.academicYears[0]);
    
    // Set default sections/batches
    if (newProgram === 'MBA') {
      setSection('');
      setBatch('');
    } else {
      setSection('A');
      setBatch(newProgram === 'Engineering (B.Tech)' ? '2023 - 2027' : '2024 - 2027');
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (val && !val.toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN)) {
      setEmailWarning(`Recommendation: Use your college email domain (${COLLEGE_EMAIL_DOMAIN})`);
    } else {
      setEmailWarning('');
    }
  };

  // Browser Geolocation request call with Real Reverse Geocoding
  const handleGetLocation = () => {
    setLocationError('');
    setAccuracyWarning(false);
    setIsLocationConfirmed(false);
    setReverseAddress('');
    
    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationState('detecting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        setCoords({ latitude: lat, longitude: lng, accuracy: acc });
        setLocationState('detected');
        
        // Flag warning if accuracy is low (greater than 100 meters)
        if (acc > 100) {
          setAccuracyWarning(true);
        }

        // Call backend reverse geocoding service
        try {
          const geo = await api.reverseGeocode(lat, lng);
          if (geo && (geo.formattedShort || geo.displayName)) {
            setReverseAddress(geo.formattedShort || geo.displayName);
          }
        } catch (e) {
          setReverseAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      (error) => {
        setLocationState('error');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Please enable location access in your browser and try again.');
        } else {
          setLocationError('Unable to detect your location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Field validations
    if (!fullName.trim()) return setErrorMsg('Please enter your full name.');
    if (!studentId.trim()) return setErrorMsg('Please enter your student ID.');
    if (!email.trim()) return setErrorMsg('Please enter a valid email address.');
    if (!mobile.trim() || mobile.length < 10) return setErrorMsg('Please enter a valid mobile number.');
    
    // Check required fields for non-MBA programs
    if (collegeProgram !== 'MBA') {
      if (!section) return setErrorMsg('Please select your section.');
      if (!batch.trim()) return setErrorMsg('Please enter your batch year.');
    }

    // Geolocation confirmation validation check
    if (!isLocationConfirmed || !coords.latitude || !coords.longitude) {
      return setErrorMsg('Please allow location access and confirm your boarding location.');
    }

    if (password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match.');
    }

    // Structure student details following backend entity rules
    let collegeType = '';
    let program = '';
    let deptName = null;

    if (collegeProgram === 'Engineering (B.Tech)') {
      collegeType = 'ENGINEERING';
      program = 'BTECH';
      const d = department.toUpperCase();
      if (d.includes('AI') && d.includes('ML')) {
        deptName = 'CSE_AI_ML';
      } else if (d.includes('DATA SCIENCE')) {
        deptName = 'CSE_DS';
      } else if (d.includes('COMPUTER SCIENCE') || d.includes('CSE')) {
        deptName = 'CSE';
      } else if (d.includes('ELECTRONICS') || d.includes('ECE')) {
        deptName = 'ECE';
      } else if (d.includes('ELECTRICAL') || d.includes('EEE')) {
        deptName = 'EEE';
      } else if (d.includes('MECHANICAL')) {
        deptName = 'MECHANICAL';
      } else if (d.includes('CIVIL')) {
        deptName = 'CIVIL';
      }
    } else if (collegeProgram === 'Degree') {
      collegeType = 'DEGREE';
      if (department.includes('BCA')) {
        program = 'BCA';
      } else if (department.includes('BBA')) {
        program = 'BBA';
      } else {
        program = 'BCOM';
      }
      deptName = null;
    } else if (collegeProgram === 'Diploma') {
      collegeType = 'DIPLOMA';
      program = 'DIPLOMA';
      const d = department.toUpperCase();
      if (d.includes('COMPUTER') || d.includes('CSE')) {
        deptName = 'CSE';
      } else if (d.includes('ELECTRONICS') || d.includes('ECE')) {
        deptName = 'ECE';
      } else if (d.includes('ELECTRICAL') || d.includes('EEE')) {
        deptName = 'EEE';
      } else if (d.includes('MECHANICAL')) {
        deptName = 'MECHANICAL';
      }
    } else if (collegeProgram === 'MBA') {
      collegeType = 'MBA';
      program = 'MBA';
      deptName = null;
    }

    let yearNum = 1;
    if (academicYear.includes('1')) yearNum = 1;
    else if (academicYear.includes('2')) yearNum = 2;
    else if (academicYear.includes('3')) yearNum = 3;
    else if (academicYear.includes('4')) yearNum = 4;

    const selectedBusObj = buses.find(b => b.busNumber === busNumber);
    const selectedRouteObj = routes.find(r => r.name === busRoute);

    // Build backend API payload (enum values for Spring Boot)
    const backendPayload = {
      fullName: fullName.trim(),
      studentId: studentId.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      password: password,
      collegeType: collegeType,       // e.g. "ENGINEERING"
      program: program,               // e.g. "BTECH"
      department: deptName,           // e.g. "CSE" or null
      academicYear: yearNum,          // Integer: 1-4
      section: section || null,
      batch: batch.trim() || null,
      boardingLocation: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: parseFloat(coords.accuracy) || 0.0
      },
      assignedBus: selectedBusObj ? selectedBusObj.id : null,
      assignedRoute: selectedRouteObj ? selectedRouteObj.id : null,
    };

    setIsSubmitting(true);
    try {
      await api.signup(backendPayload);
      localStorage.setItem('signup_success_msg', `Account created! Welcome, ${fullName.split(' ')[0]}. Please sign in.`);
      navigate('/student-login');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '60px 24px' }}>
      <Link to="/student-login" style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        <ArrowLeft size={16} />
        Back to Login
      </Link>

      <div className="auth-card animate-fade-in" style={{ maxWidth: '800px', width: '100%', padding: '40px' }}>
        <div className="auth-header" style={{ marginBottom: '32px' }}>
          <div className="profile-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', margin: '0 auto' }}>
            <Bus size={32} />
          </div>
          <h2 style={{ fontSize: '28px', marginTop: '12px' }}>Create Student Account</h2>
          <p>Register to track your college bus and route</p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            border: '1px solid hsl(350, 80%, 90%)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup}>
          
          {/* 1. PERSONAL INFORMATION SECTION */}
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            Personal Information
          </h3>
          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="fullName"
                  type="text" 
                  className="form-control" 
                  placeholder="Enter your full name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentId">Student ID / Roll Number</label>
              <div style={{ position: 'relative' }}>
                <Award size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="studentId"
                  type="text" 
                  className="form-control" 
                  placeholder="Enter your student ID" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="email"
                  type="email" 
                  className="form-control" 
                  placeholder="student@kec.ac.in" 
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
              {emailWarning && (
                <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                  {emailWarning}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="mobile"
                  type="tel" 
                  className="form-control" 
                  placeholder="Enter your mobile number" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. COLLEGE / PROGRAM & ACADEMIC INFO SECTION */}
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            Academic Information
          </h3>
          
          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group form-grid-full">
              <label htmlFor="collegeProgram" style={{ fontWeight: 700 }}>College / Program</label>
              <div style={{ position: 'relative' }}>
                <Landmark size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--primary)' }} />
                <select 
                  id="collegeProgram"
                  className="form-control" 
                  value={collegeProgram}
                  onChange={handleProgramChange}
                  style={{ paddingLeft: '44px', border: '1px solid var(--primary)', fontWeight: 700 }}
                >
                  {Object.keys(PROGRAMS_CONFIG).map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="department">
                {collegeProgram === 'MBA' || collegeProgram === 'Degree' ? 'Program / Specialization' : 'Department'}
              </label>
              <select 
                id="department"
                className="form-control" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="year">Academic Year</label>
              <select 
                id="year"
                className="form-control" 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                {academicYearsList.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {collegeProgram !== 'MBA' ? (
              <>
                <div className="form-group">
                  <label htmlFor="section">Section</label>
                  <select 
                    id="section"
                    className="form-control" 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="batch">Batch (Years)</label>
                  <input 
                    id="batch"
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 2023 - 2027" 
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="form-grid-full" style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px 0' }}>
                * Section and Batch registration are not required for postgraduate MBA programs.
              </div>
            )}
          </div>

          {/* 3. BUS INFORMATION SECTION */}
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            Bus Route Selection
          </h3>
          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label htmlFor="route">Select Bus Route</label>
              <select 
                id="route"
                className="form-control" 
                value={busRoute}
                onChange={(e) => setBusRoute(e.target.value)}
              >
                {routes.length > 0 ? routes.map(rt => (
                  <option key={rt.id} value={rt.name}>{rt.name}</option>
                )) : BUS_ROUTES.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="busNumber">Select Bus</label>
              <select 
                id="busNumber"
                className="form-control" 
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
              >
                {buses.length > 0 ? buses.map(no => (
                  <option key={no.id} value={no.busNumber}>{no.busNumber}</option>
                )) : BUS_NUMBERS.map(no => (
                  <option key={no} value={no}>{no}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. GPS BOARDING LOCATION SECTION */}
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            Boarding Location
          </h3>
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              <strong>Why do we need your location?</strong><br />
              Your location is used to identify your regular bus boarding point and help provide accurate bus tracking.
            </p>

            {locationState === 'idle' && (
              <div style={{ padding: '24px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: 'var(--bg-app)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500 }}>
                  Your current coordinates will be recorded as your custom boarding location.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleGetLocation} style={{ gap: '8px' }}>
                  📍 Use My Current Location
                </button>
              </div>
            )}

            {locationState === 'detecting' && (
              <div style={{ padding: '30px', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: 'var(--primary-light)' }}>
                <p style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700 }}>
                  📍 Detecting your location...
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Please wait. Requesting device GPS credentials.
                </p>
              </div>
            )}

            {(locationState === 'detected' || isLocationConfirmed) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  padding: '16px', 
                  border: isLocationConfirmed ? '1px solid var(--success)' : '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: isLocationConfirmed ? 'var(--success-light)' : 'var(--bg-app)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: isLocationConfirmed ? 'var(--success)' : 'var(--text-main)' }}>
                      {isLocationConfirmed ? '✓ Boarding location confirmed' : '✓ Location detected'}
                    </h4>
                    <span className="badge" style={{ fontSize: '11px', backgroundColor: coords.accuracy <= 50 ? 'var(--success-light)' : 'var(--warning-light)', color: coords.accuracy <= 50 ? 'var(--success)' : 'var(--warning)' }}>
                      Accuracy: ±{coords.accuracy} meters
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Latitude</span>
                      <strong style={{ fontFamily: 'monospace' }}>{coords.latitude?.toFixed(6)}</strong>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Longitude</span>
                      <strong style={{ fontFamily: 'monospace' }}>{coords.longitude?.toFixed(6)}</strong>
                    </div>
                  </div>

                  {reverseAddress && (
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {reverseAddress}
                      </div>
                    </div>
                  )}

                  {accuracyWarning && (
                    <div style={{ padding: '10px 12px', backgroundColor: 'hsl(40, 95%, 98%)', border: '1px solid var(--warning)', borderRadius: '4px', fontSize: '12px', color: 'hsl(40, 95%, 25%)', fontWeight: 500 }}>
                      ⚠️ Location accuracy is low. Please move to an open area or try detecting your location again.
                    </div>
                  )}

                  {!isLocationConfirmed ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button type="button" className="btn btn-success btn-sm" onClick={() => setIsLocationConfirmed(true)} style={{ flex: 1 }}>
                        Confirm Location
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleGetLocation}>
                        Detect Again
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsLocationConfirmed(false)}>
                        Change Location
                      </button>
                    </div>
                  )}
                </div>

                {/* Leaflet map preview */}
                <div style={{ height: '220px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <MapContainer 
                    key={`${coords.latitude}-${coords.longitude}`}
                    center={[coords.latitude, coords.longitude]} 
                    zoom={16} 
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[coords.latitude, coords.longitude]} icon={boardingIcon}>
                      <Popup>Your Boarding Location</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {locationState === 'error' && (
              <div style={{ padding: '20px', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600, marginBottom: '12px' }}>
                  ⚠️ {locationError || 'Unable to detect your location. Please try again.'}
                </p>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleGetLocation}>
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* 5. ACCOUNT SECURITY SECTION */}
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            Account Security
          </h3>
          <div className="form-grid" style={{ marginBottom: '32px' }}>
            <div className="form-group">
              <label htmlFor="password">Create Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control" 
                  placeholder="Min 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '16px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="form-control" 
                  placeholder="Re-enter password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '16px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '24px' }}>
            <Shield size={16} />
            Create Student Account
          </button>
        </form>

        <div className="auth-switch">
          <span>Already have an account? </span>
          <Link to="/student-login" style={{ fontWeight: 600 }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentSignup;
export { StudentSignup };
