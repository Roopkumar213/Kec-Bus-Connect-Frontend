import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Radio, 
  User, 
  LogOut, 
  PlusCircle, 
  Menu, 
  X,
  Bus,
  LayoutDashboard
} from 'lucide-react';

const Sidebar = ({ role = 'student', onLogout }) => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const handleLogoutClick = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('kec_current_user');
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  const studentMenu = [
    { label: 'Track Bus', path: '/student/dashboard', icon: MapPin },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const driverMenu = [
    { label: 'GPS Broadcaster', path: '/driver/dashboard', icon: Radio },
    { label: 'View Fleet', path: '/student/dashboard', icon: MapPin },
  ];

  const adminMenu = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Add Bus', path: '/admin/add-bus', icon: PlusCircle },
    { label: 'GPS Broadcaster', path: '/driver/dashboard', icon: Radio },
  ];

  const menuItems = role === 'admin' ? adminMenu : (role === 'driver' || role === 'tracker') ? driverMenu : studentMenu;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/" className="logo" style={{ fontSize: '18px' }}>
          <Bus size={22} style={{ color: 'var(--primary)' }} />
          KEC <span>Connect</span>
        </Link>
        <button 
          className="mobile-nav-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle navigation menu"
        >
          {collapsed ? <Menu size={22} /> : <X size={22} />}
        </button>
      </div>

      <ul className={`sidebar-menu ${collapsed ? 'collapsed' : ''}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Determine active status: active if path matches or if it's the dashboard / sub-path of tracking
          const isActive = currentPath === item.path || 
            (item.label === 'Track Bus' && currentPath.startsWith('/student/track/'));
          
          return (
            <li key={item.label} className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path} onClick={() => setCollapsed(true)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        
        <li className="sidebar-item" style={{ marginTop: 'auto' }}>
          <a href="#" onClick={handleLogoutClick}>
            <LogOut size={18} />
            <span>Logout</span>
          </a>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
export { Sidebar };
