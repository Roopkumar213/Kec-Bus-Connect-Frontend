import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BusStatus from '../components/BusStatus';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  Users,
  Bus as BusIcon,
  Shield,
  Radio,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Award,
  CheckCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

const AdminDashboard = ({ buses = [], onDeleteBus, onEditBus }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buses'); // 'buses', 'students', 'drivers'
  const [studentsList, setStudentsList] = useState([]);
  const [driversList, setDriversList] = useState([
    {
      id: 'drv-01',
      name: 'Driver Name',
      email: 'driver@kec.ac.in',
      phone: 'XXXXXXXXXXXXXX',
      assignedBus: 'KEC-07',
      assignedRoute: 'Attikuppam → KEC (via MDR87)',
      licenseNumber: 'AP-39-DL-XXXXXXXX',
      status: 'ACTIVE'
    }
  ]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch registered students from backend API / local storage
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const data = await api.adminGetStudents();
        if (data && data.length > 0) {
          setStudentsList(data);
          return;
        }
      } catch (e) {
        // fallback to default student list
      }

      // Default demo registered students for KEC-07 Attikuppam-MDR87 corridor
      setStudentsList([
        {
          id: 'stu-01',
          fullName: 'Rohan Sharma',
          studentId: '22KEC401',
          email: 'student@kec.ac.in',
          mobile: '9888877777',
          collegeType: 'Engineering',
          program: 'B.Tech',
          department: 'Computer Science and Engineering (CSE)',
          academicYear: '3rd Year',
          section: 'A',
          boardingPoint: 'Attikuppam (Origin)',
          busNumber: 'KEC-07'
        },
        {
          id: 'stu-02',
          fullName: 'Bhavana Reddy',
          studentId: '23KEC502',
          email: 'student.btech.aiml@kec.ac.in',
          mobile: '9765432109',
          collegeType: 'Engineering',
          program: 'B.Tech',
          department: 'CSE (AI & ML)',
          academicYear: '3rd Year',
          section: 'B',
          boardingPoint: 'Singasamudram Center',
          busNumber: 'KEC-07'
        },
        {
          id: 'stu-03',
          fullName: 'Chaitanya Prasad',
          studentId: '24KEC603',
          email: 'student.btech.ece@kec.ac.in',
          mobile: '9654321098',
          collegeType: 'Engineering',
          program: 'B.Tech',
          department: 'ECE',
          academicYear: '2nd Year',
          section: 'A',
          boardingPoint: 'Vijayapuram (Vijalapuram)',
          busNumber: 'KEC-07'
        },
        {
          id: 'stu-04',
          fullName: 'Divya Sree',
          studentId: '23DEG005',
          email: 'student.bca@kec.ac.in',
          mobile: '9543210987',
          collegeType: 'Degree',
          program: 'BCA Honours',
          department: 'Computer Applications',
          academicYear: '3rd Year',
          section: 'A',
          boardingPoint: 'Govindapalle',
          busNumber: 'KEC-07'
        },
        {
          id: 'stu-05',
          fullName: 'Eshwar Naidu',
          studentId: '24DEG012',
          email: 'student.bba@kec.ac.in',
          mobile: '9432109876',
          collegeType: 'Degree',
          program: 'BBA Honours',
          department: 'Business Administration',
          academicYear: '2nd Year',
          section: 'B',
          boardingPoint: 'Kangundhi',
          busNumber: 'KEC-07'
        }
      ]);
      setIsLoadingStudents(false);
    };

    loadStudents();
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar role="admin" />

      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Transport Administration Portal</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              KEC Fleet Management, Driver Assignment & Student Directory
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/driver/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} />
              Open GPS Broadcaster
            </Link>
          </div>
        </header>

        {/* Dashboard Navigation Tabs */}
        <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'white', display: 'flex', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('buses')}
            style={{
              padding: '16px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'buses' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'buses' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BusIcon size={16} />
            Fleet & Buses ({buses.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '16px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={16} />
            Registered Students ({studentsList.length})
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            style={{
              padding: '16px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'drivers' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'drivers' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} />
            Drivers & Staff ({driversList.length})
          </button>
        </div>

        {/* Dashboard Body */}
        <main className="dashboard-body" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 32px' }}>

          {/* TAB 1: BUSES & FLEET */}
          {activeTab === 'buses' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Active Bus Route</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Single-Route Corridor for Live Pilot Testing (39.8 km, 1 hr 18 min)</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {buses.map((bus) => (
                  <div
                    key={bus.busNumber}
                    className="card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      flexWrap: 'wrap',
                      borderLeft: '5px solid var(--primary)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{bus.busNumber}</h3>
                        <BusStatus status={bus.status} />
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {bus.registrationNumber || 'AP-39-TJ-2026'}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        {bus.routeFullName || bus.routeName || 'Attikuppam → KEC (via MDR87)'} ({bus.totalDistance || '39.8 km'})
                      </p>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Driver: <strong>Driver Name</strong></span>
                        <span>Contact: <strong>XXXXXXXXXXXXXX</strong></span>
                        <span>Stops: <strong>16 Waypoints</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Link
                        to={`/student/track/${bus.busNumber}`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        Live Map Track
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTERED STUDENTS */}
          {activeTab === 'students' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Student Transit Directory</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All registered students assigned to college buses</p>
                </div>
                <span className="badge badge-success" style={{ fontSize: '12px' }}>
                  {studentsList.length} Active Students
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {studentsList.map((stu) => (
                  <div
                    key={stu.id || stu.studentId}
                    className="card"
                    style={{
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {stu.fullName}
                        </h4>
                        <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                          {stu.studentId}
                        </span>
                        <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700 }}>
                          {stu.collegeType} • {stu.program}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                        {stu.department ? `${stu.department} • ` : ''}{stu.academicYear || '3rd Year'} {stu.section ? `• Section ${stu.section}` : ''}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {stu.email}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {stu.mobile}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                        <MapPin size={14} />
                        {stu.boardingPoint || 'Attikuppam'}
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>
                        Bus: <strong>{stu.busNumber || 'KEC-07'}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DRIVERS & STAFF */}
          {activeTab === 'drivers' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Driver & Broadcaster Roster</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Authorized vehicle drivers with GPS broadcasting access</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {driversList.map((drv) => (
                  <div
                    key={drv.id}
                    className="card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {drv.name}
                        </h3>
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          ● {drv.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                        Assigned Bus: <strong>{drv.assignedBus}</strong> • Route: <strong>{drv.assignedRoute}</strong>
                      </p>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Email: <strong>{drv.email}</strong></span>
                        <span>Contact: <strong>{drv.phone}</strong></span>
                        <span>License: <strong>{drv.licenseNumber}</strong></span>
                      </div>
                    </div>

                    <div>
                      <Link
                        to="/driver/dashboard"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Radio size={14} />
                        Launch Driver GPS
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
