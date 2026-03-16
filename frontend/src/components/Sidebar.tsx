import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/mmh.css';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getNavItems = () => {
    const common = [
      { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    const roleSpecific: Record<string, { path: string; label: string; icon: string }[]> = {
      admin: [
        { path: '/dashboard',   label: 'Dashboard', icon: '🛡️' },
        { path: '/patients',    label: 'Patients',  icon: '👥' },
        { path: '/pharmacy',    label: 'Pharmacy',  icon: '💊' },
        { path: '/wards',       label: 'Wards',     icon: '🏥' },
        { path: '/payments',    label: 'Payments',  icon: '💰' },
        { path: '/admin/users', label: 'Users',     icon: '👤' },
        { path: '/admin/managers', label: 'Managers', icon: '📊' },
      ],
      doctor: [
        { path: '/my-patients', label: 'My Patients', icon: '👨‍⚕️' },
        { path: '/lab-orders',  label: 'Lab Orders',  icon: '🔬' },
      ],
      receptionist: [
        { path: '/opd',         label: 'OPD Queue',    icon: '🚶' },
        { path: '/admission',   label: 'Admission',    icon: '🏥' },
        { path: '/lab-req',     label: 'Lab Request',  icon: '🧪' },
        { path: '/payment',     label: 'Payment',      icon: '💰' },
      ],
      lab: [
        { path: '/lab-pending', label: 'Pending', icon: '🧪' },
        { path: '/lab-results', label: 'Results', icon: '🔬' },
      ],
      pharmacist: [
        { path: '/dispense',    label: 'Dispense',  icon: '💊' },
        { path: '/inventory',   label: 'Inventory', icon: '📦' },
      ],
      manager: [
        { path: '/analytics',   label: 'Analytics', icon: '📈' },
      ],
      patient: [
        { path: '/my-records',  label: 'My Records', icon: '📜' },
      ],
    };

    const role = user?.role || 'admin';
    return [...(roleSpecific[role] || []), ...common];
  };

  const name = user?.name || 'User';
  const role = user?.role || 'admin';

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`mmh-sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onToggle}
      />

      <div className={`mmh-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="mmh-sidebar-logo">
          <div className="mmh-sidebar-icon">🏥</div>
          <div>
            <div className="mmh-sidebar-name">MMH</div>
            <div className="mmh-sidebar-subtitle">Majida Memorial Hospital</div>
          </div>
        </div>

        {/* User info */}
        <div className="mmh-sidebar-user">
          <div
            className="mmh-sidebar-avatar"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mmh-sidebar-user-name">{name}</div>
            <div className="mmh-sidebar-user-role">{role}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mmh-nav">
          <div className="mmh-nav-section">Main Menu</div>
          {getNavItems().map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mmh-nav-item${isActive ? ' active' : ''}`}
              onClick={() => isOpen && onToggle?.()}
              end={
                item.path === '/admin'       ||
                item.path === '/doctor'      ||
                item.path === '/receptionist'||
                item.path === '/patient'
              }
            >
              <span className="mmh-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="mmh-sidebar-bottom">
          <button className="mmh-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
