import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminDashboard from './AdminDashboard';
import ManageUsers from './ManageUsers';
import ManageMedicines from './ManageMedicines';
import ManageWards from './ManageWards';
import PatientRecords from '../../components/PatientRecords';
import '../../styles/mmh.css';

interface AdminLayoutProps {
  initialTab?: string;
  onLogout?: () => void;
}

const TABS = [
  { id: 'dash',    label: 'Dashboard', icon: '📊' },
  { id: 'users',   label: 'Users',     icon: '👥' },
  { id: 'records', label: 'Patient Records', icon: '📜' },
  { id: 'meds',    label: 'Pharmacy',  icon: '💊' },
  { id: 'wards',   label: 'Wards',     icon: '🏥' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ initialTab = 'dash', onLogout }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch { return {}; }
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
            <div className="mmh-topbar-title">Hospital Administration Portal</div>
            <div className="mmh-topbar-subtitle">Management Control Center v2.5</div>
          </div>
          <div className="mmh-topbar-right">
            <div className="mmh-topbar-info">
              <div style={{ color: 'white', fontWeight: 700 }}>{dateStr}</div>
              <div>Server: <span style={{ color: 'var(--mmh-green)' }}>Online ✓</span></div>
            </div>
          </div>
        </header>

        {/* Admin Tabs */}
        <div className="mmh-admin-tabs-wrap">
          <div className="mmh-admin-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`mmh-admin-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mmh-page">
          {activeTab === 'dash'  && <AdminDashboard />}
          {activeTab === 'users' && <ManageUsers />}
          {activeTab === 'records' && <PatientRecords />}
          {activeTab === 'meds'  && <ManageMedicines />}
          {activeTab === 'wards' && <ManageWards />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
