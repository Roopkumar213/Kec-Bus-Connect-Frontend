import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const getColorStyles = (colorName) => {
    switch (colorName) {
      case 'green':
        return {
          bg: 'var(--success-light)',
          text: 'var(--success)',
        };
      case 'red':
        return {
          bg: 'var(--danger-light)',
          text: 'var(--danger)',
        };
      case 'orange':
      case 'yellow':
        return {
          bg: 'var(--warning-light)',
          text: 'var(--warning)',
        };
      case 'blue':
      default:
        return {
          bg: 'var(--primary-light)',
          text: 'var(--primary)',
        };
    }
  };

  const styles = getColorStyles(color);

  return (
    <div className="metric-card animate-fade-in">
      <div 
        className="metric-icon" 
        style={{ backgroundColor: styles.bg, color: styles.text }}
      >
        <Icon size={24} />
      </div>
      <div className="metric-details">
        <p>{title}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;
