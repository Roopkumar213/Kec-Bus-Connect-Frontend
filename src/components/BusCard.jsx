import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, User, Clock, Eye } from 'lucide-react';
import BusStatus from './BusStatus';

const BusCard = ({ bus }) => {
  return (
    <div className="bus-card-comp">
      <div className="bus-card-header">
        <h3>{bus.busNumber}</h3>
        <BusStatus status={bus.status} />
      </div>

      <div className="bus-card-route">
        <span className="route-label">Route</span>
        <span className="route-value">{bus.routeName || bus.route}</span>
      </div>

      <div className="bus-card-meta">
        <div className="meta-item">
          <span className="meta-label">
            <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Driver
          </span>
          <span className="meta-value">{bus.driverName}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">
            <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Updated
          </span>
          <span className="meta-value">{bus.lastUpdated}</span>
        </div>
      </div>

      <div className="bus-card-actions">
        <Link 
          to={`/student/track/${bus.busNumber}`} 
          className={`btn ${bus.status === 'INACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
          style={{ width: '100%', gap: '8px' }}
        >
          <Eye size={16} />
          Track Bus
        </Link>
      </div>
    </div>
  );
};

export default BusCard;
