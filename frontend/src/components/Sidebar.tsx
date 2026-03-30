import React from 'react';
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/mmh.css';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

type NavItem = {
  label: string;
  icon: string;
  path?: string;
  tab?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen: mobileOpen, onToggle: onMobileToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    const saved = localStorage.getItem('mmh-sidebar');
    return saved !== 'collapsed';
  });

  React.useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen(prev => {
        const newState = !prev;
        localStorage.setItem('mmh-sidebar', newState ? 'open' : 'collapsed');
        return newState;
      });
    };
    window.addEventListener('toggle-desktop-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-desktop-sidebar', handleToggle);
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new Event('toggle-desktop-sidebar'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getNavConfig = () => {
    const common: NavItem[] = [
      { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    const config: Record<string, { basePath?: string; items: NavItem[] }> = {
      admin: {
        items: [
          { path: '/dashboard',   label: 'Dashboard', icon: '🛡️' },
          { path: '/patients',    label: 'Patients',  icon: '👥' },
          { path: '/pharmacy',    label: 'Pharmacy',  icon: '💊' },
          { path: '/wards',       label: 'Wards',     icon: '🏥' },
          { path: '/payments',    label: 'Payments',  icon: '💰' },
          { path: '/admin/users', label: 'Users',     icon: '👤' },
          { path: '/hr',          label: 'HR Management', icon: '📋' },
          { path: '/admin/managers', label: 'Managers', icon: '📊' },
        ]
      },
      doctor: {
        basePath: '/doctor',
        items: [
          { tab: 'assigned', label: 'My Patients', icon: '👨‍⚕️' },
          { tab: 'records',  label: 'Patient Records', icon: '📜' },
          { tab: 'history',  label: 'Clinical History',icon: '🔬' },
          { tab: 'my-leave', label: 'My Leave',        icon: '🏖️' },
        ]
      },
      receptionist: {
        basePath: '/opd',
        items: [
          { tab: 'registration', label: 'OPD Queue',    icon: '🚶' },
          { tab: 'admission',    label: 'Admission',    icon: '🏥' },
          { tab: 'lab-request',  label: 'Lab Request',  icon: '🧪' },
          { tab: 'payment',      label: 'Payment',      icon: '💰' },
          { tab: 'today-list',   label: 'Today\'s List', icon: '📋' },
          { tab: 'my-leave',     label: 'My Leave',     icon: '🏖️' },
        ]
      },
      lab: {
        basePath: '/lab',
        items: [
          { tab: 'pending',  label: 'Pending Orders', icon: '🧪' },
          { tab: 'results',  label: 'Enter Results', icon: '🔬' },
          { tab: 'my-leave', label: 'My Leave',      icon: '🏖️' },
        ]
      },
      pharmacist: {
        basePath: '/dispense',
        items: [
          { tab: 'dispense',  label: 'Dispense',  icon: '💊' },
          { tab: 'inventory', label: 'Inventory', icon: '📦' },
          { tab: 'my-leave',  label: 'My Leave',  icon: '🏖️' },
        ]
      },
      manager: {
        basePath: '/analytics',
        items: [
          { tab: 'dashboard',   label: 'Analytics', icon: '📈' },
          { tab: 'records',     label: 'Records',   icon: '📜' },
          { tab: 'my-leave',    label: 'My Leave',  icon: '🏖️' },
        ]
      },
      patient: {
        basePath: '/patient',
        items: [
          { tab: 'records',  label: 'My Records', icon: '📜' },
        ]
      },
    };

    const role = user?.role || 'admin';
    const roleConfig = config[role] || { items: [] };
    
    return {
      basePath: roleConfig.basePath,
      items: [...roleConfig.items, ...common]
    };
  };

  const name = user?.name || 'User';
  const role = user?.role || 'admin';
  const navConfig = getNavConfig();

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`mmh-sidebar-overlay ${mobileOpen ? 'open' : ''}`} 
        onClick={onMobileToggle}
      />

      <div className={`mmh-sidebar ${mobileOpen ? 'open' : ''} ${!sidebarOpen ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="mmh-sidebar-logo">
          <div className="mmh-sidebar-icon">🏥</div>
          <div className="mmh-sidebar-name-wrap">
            <div className="mmh-sidebar-name">{sidebarOpen ? 'MMH' : 'M'}</div>
            <div className="mmh-sidebar-subtitle">Majida Memorial Hospital</div>
          </div>
        </div>

        {/* User info */}
        <div className="mmh-sidebar-user">
          <div
            className="mmh-sidebar-avatar"
            style={{ background: 'var(--mmh-accent)' }}
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
          {navConfig.items.map(item => {
            if (item.path) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `mmh-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => mobileOpen && onMobileToggle?.()}
                  title={!sidebarOpen ? item.label : ''}
                  end={
                    item.path === '/admin'       ||
                    item.path === '/doctor'      ||
                    item.path === '/receptionist'||
                    item.path === '/patient'
                  }
                >
                  <span className="mmh-nav-icon">{item.icon}</span>
                  <span className="mmh-nav-label">{item.label}</span>
                </NavLink>
              );
            } else if (item.tab && navConfig.basePath) {
              const defaultTab = navConfig.items[0].tab;
              const currentTab = searchParams.get('tab') || defaultTab;
              const isActive = currentTab === item.tab;
              
              return (
                <Link
                  key={item.tab}
                  to={`${navConfig.basePath}?tab=${item.tab}`}
                  className={`mmh-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => mobileOpen && onMobileToggle?.()}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="mmh-nav-icon">{item.icon}</span>
                  <span className="mmh-nav-label">{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </nav>

        {/* Logout */}
        <div className="mmh-sidebar-bottom">
          <button className="mmh-logout-btn" onClick={handleLogout} title={!sidebarOpen ? 'Logout' : ''}>
            <span className="mmh-nav-icon">🚪</span> 
            <span className="mmh-nav-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
