import React from 'react';
import OpdPage from './receptionist/OpdPage';
import '../styles/mmh.css';

interface ReceptionistProps {
  onLogout?: () => void;
}

const Receptionist: React.FC<ReceptionistProps> = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OpdPage />
    </div>
  );
};

export default Receptionist;
