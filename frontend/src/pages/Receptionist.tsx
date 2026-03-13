import React from 'react';
import Sidebar from '../components/Sidebar';
import OpdPage from './receptionist/OpdPage';
import '../styles/mmh.css';

interface ReceptionistProps {
  onLogout?: () => void;
}

const Receptionist: React.FC<ReceptionistProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; }
    catch { return {}; }
  })();

  const dateStr = new Date().toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="mmh-app">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <main className="mmh-main">
        {/* Topbar */}
        <header className="mmh-topbar">
          <div className="mmh-topbar-left">
            <button 
              className="mmh-sidebar-toggle" 
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="mmh-topbar-title">Patient Registration &amp; Queue Management</div>
            <div className="mmh-topbar-subtitle">Front Desk — OPD, Admissions, Lab, Payments</div>
          </div>
          <div className="mmh-topbar-right">
            <div className="mmh-topbar-info">
              <div style={{ color: 'white', fontWeight: 600 }}>{dateStr}</div>
              <div>Server: <span style={{ color: 'var(--mmh-green)' }}>Online ✓</span></div>
            </div>
          </div>
        </header>
        {/* OPD Module (includes its own tabs + page) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <OpdPage />
        </div>
      </main>
    </div>
  );
};

export default Receptionist;
