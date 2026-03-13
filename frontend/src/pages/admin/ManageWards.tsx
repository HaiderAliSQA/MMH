import React from 'react';
import '../../styles/mmh.css';

const ManageWards: React.FC = () => {
  return (
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Ward Management</h1>
          <p className="mmh-page-subtitle">Configure hospital wards, wings, and bed allocations</p>
        </div>
      </div>

      <div className="mmh-empty">
        <div className="mmh-empty-icon">🏥</div>
        <div className="mmh-empty-text">Ward Configuration Module</div>
        <div className="mmh-empty-sub">This module is currently under maintenance. Please contact system admin.</div>
      </div>
    </div>
  );
};

export default ManageWards;
