import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, LogIn, MapPin } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="landing-navbar">
      <div className="container landing-nav-container">
        <Link to="/" className="logo">
          <Bus size={28} className="logo-icon" style={{ color: 'var(--primary)' }} />
          KEC <span>BusConnect</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/student-login" className={`nav-link ${currentPath.includes('student') ? 'active' : ''}`}>
              Student Portal
            </Link>
          </li>
          <li>
            <Link to="/driver-login" className={`nav-link ${currentPath.includes('driver') ? 'active' : ''}`}>
              Driver Portal
            </Link>
          </li>
          <li>
            <Link to="/admin-login" className={`nav-link ${currentPath.includes('admin') ? 'active' : ''}`}>
              Admin
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          <Link to="/student-login" className="btn btn-primary">
            <MapPin size={16} />
            Track Your Bus
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
