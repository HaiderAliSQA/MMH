import React from 'react';
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

  const handleLogout = async () => {
    await logout();  // marks session inactive in DB before clearing local state
    navigate('/login', { replace: true });
  };

  const getNavConfig = () => {
    const config: Record<string, { basePath?: string; items: NavItem[] }> = {
      admin: {
        items: [
          { label: 'Dashboard',   icon: '🛡️', path: '/admin/dashboard' },
          { label: 'Patients',    icon: '👥', path: '/admin/patients' },
          { label: 'Pharmacy',    icon: '💊', path: '/admin/pharmacy' },
          { label: 'Wards',       icon: '🏥', path: '/admin/wards' },
          { label: 'Payments',    icon: '💰', path: '/admin/payments' },
          { label: 'Users',       icon: '👤', path: '/admin/users' },
          { label: 'HR Mgmt',     icon: '📋', path: '/admin/hr' },
          { label: 'Reports',     icon: '📊', path: '/admin/reports' },
          { label: 'Dispensary',  icon: '🆓', path: '/admin/dispensary' },
          { label: 'Settings',    icon: '⚙️', path: '/admin/settings' },
        ]
      },
      doctor: {
        basePath: '/doctor/patients',
        items: [
          { label: 'My Patients',     icon: '👨‍⚕️', tab: 'assigned' },
          { label: 'Patient Records', icon: '📋', tab: 'records'  },
          { label: 'Clinical History',icon: '📜', tab: 'history'  },
          { label: 'My Leave',        icon: '🏖️', tab: 'my-leave' },
          { label: 'Settings',        icon: '⚙️', path: '/doctor/settings' },
        ]
      },
      receptionist: {
        basePath: '/receptionist/opd',
        items: [
          { label: 'OPD Registration',icon: '📋', tab: 'registration'},
          { label: 'Admission',       icon: '🛏️', tab: 'admission'   },
          { label: 'Lab Request',     icon: '🔬', tab: 'lab-request' },
          { label: 'Payment',         icon: '💳', tab: 'payment'     },
          { label: "Today's List",    icon: '📊', tab: 'today-list'  },
          { label: 'My Leave',        icon: '🏖️', tab: 'my-leave'    },
          { label: 'Settings',        icon: '⚙️', path: '/receptionist/settings' },
        ]
      },
      lab: {
        basePath: '/lab/queue',
        items: [
          { label: 'Lab Queue',   icon: '⏳', tab: 'pending'  },
          { label: 'Results',     icon: '📝', tab: 'results'  },
          { label: 'My Leave',    icon: '🏖️', tab: 'my-leave' },
          { label: 'Settings',    icon: '⚙️', path: '/lab/settings' },
        ]
      },
      pharmacist: {
        basePath: '/pharmacy/dispense',
        items: [
          { label: 'Dispense',    icon: '💊', tab: 'dispense'  },
          { label: 'Inventory',   icon: '📦', tab: 'inventory' },
          { label: 'Payments',    icon: '💳', tab: 'payments'  },
          { label: 'My Leave',    icon: '🏖️', tab: 'my-leave'  },
          { label: 'Settings',    icon: '⚙️', path: '/pharmacy/settings' },
        ]
      },
      dispensary: {
        basePath: '/dispensary/dispense',
        items: [
          { label: 'Dispense',  icon: '🎁', tab: 'dispense' },
          { label: 'Stock',     icon: '📦', tab: 'stock'    },
          { label: 'History',   icon: '📋', tab: 'history'  },
          { label: 'My Leave',  icon: '🏖️', tab: 'my-leave' },
          { label: 'Settings',  icon: '⚙️', path: '/dispensary/settings' },
        ]
      },
      manager: {
        basePath: '/manager/analytics',
        items: [
          { label: 'Analytics', icon: '📊', tab: 'dashboard' },
          { label: 'Revenue',   icon: '💰', tab: 'revenue'   },
          { label: 'My Leave',  icon: '🏖️', tab: 'my-leave'  },
          { label: 'Settings',  icon: '⚙️', path: '/manager/settings' },
        ]
      },
      patient: {
        basePath: '/patient/records',
        items: [
          { label: 'My Records', icon: '📜', tab: 'records' },
          { label: 'Settings',   icon: '⚙️', path: '/patient/settings' },
        ]
      }
    };

    const role = user?.role || 'admin';
    return config[role] || { items: [] };
  };

  const name = user?.name || 'User';
  const role = user?.role || 'admin';
  const navConfig = getNavConfig();

  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`mmh-sidebar-overlay ${mobileOpen && isMobile ? 'visible' : ''}`} 
        onClick={onMobileToggle}
      />

      <div className={`mmh-sidebar ${mobileOpen ? 'open' : ''} ${!sidebarOpen && !isMobile ? 'collapsed' : ''}`}>
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
          {navConfig.items.map((item, idx) => {
            if (item.path) {
              return (
                <NavLink
                  key={item.path + idx}
                  to={item.path}
                  className={({ isActive }) => `mmh-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => mobileOpen && onMobileToggle?.()}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="mmh-nav-icon">{item.icon}</span>
                  <span className="mmh-nav-label">{item.label}</span>
                </NavLink>
              );
            } else if (item.tab && navConfig.basePath) {
              const currentTab = searchParams.get('tab') || navConfig.items[0].tab;
              const isActive = currentTab === item.tab;
              
              return (
                <button
                  key={item.tab + idx}
                  onClick={() => {
                    navigate(`${navConfig.basePath}?tab=${item.tab}`);
                    if (mobileOpen) onMobileToggle?.();
                  }}
                  className={`mmh-nav-item ${isActive ? 'active' : ''}`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="mmh-nav-icon">{item.icon}</span>
                  <span className="mmh-nav-label">{item.label}</span>
                </button>
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
