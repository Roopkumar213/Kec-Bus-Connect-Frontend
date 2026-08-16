import React from 'react';

const BusStatus = ({ status }) => {
  const getStatusDetails = (statusVal) => {
    switch (statusVal?.toUpperCase()) {
      case 'RUNNING':
      case 'ON_ROUTE':
      case 'ACTIVE':
        return {
          label: 'Running',
          className: 'badge-success',
          dot: '🟢'
        };
      case 'NOT_STARTED':
      case 'INACTIVE':
        return {
          label: 'Not Started',
          className: 'badge-warning',
          dot: '🟡'
        };
      case 'STOPPED':
        return {
          label: 'Stopped',
          className: 'badge-danger',
          dot: '🔴'
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          className: 'badge-primary',
          dot: '🔵'
        };
      case 'OFFLINE':
      default:
        return {
          label: 'Offline',
          className: 'badge-secondary',
          dot: '⚫'
        };
    }
  };

  const { label, className, dot } = getStatusDetails(status);

  return (
    <span className={`badge ${className}`} style={{ gap: '4px' }}>
      <span style={{ fontSize: '10px' }}>{dot}</span>
      <span>{label}</span>
    </span>
  );
};

export default BusStatus;
export { BusStatus };
