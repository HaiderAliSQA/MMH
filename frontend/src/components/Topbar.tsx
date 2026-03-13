import React from 'react';
import '../styles/mmh.css';

const ROLE_ICONS: Record<string, string> = { 
  receptionist: "🏥", doctor: "👨‍⚕️", lab: "🔬", pharmacist: "💊", admin: "🛡️", manager: "📊", patient: "👤" 
};

const TOPBAR_TITLES: Record<string, string> = {
  receptionist: "OPD Registration & Admission",
  doctor:      "Doctor Dashboard",
  lab:         "Laboratory Processing",
  pharmacist:  "Pharmacy Management",
  admin:       "Hospital Administration Portal",
  manager:     "Analytics & Revenue Insights",
  patient:     "My Health Records",
};

interface TopbarProps {
  user: {
    name: string;
    role: string;
  };
  toggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, toggleSidebar }) => {
  const today = () => new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  const nowTime = () => new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="mmh-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="mmh-btn mmh-btn-ghost mmh-btn-icon mobile-only"
          onClick={toggleSidebar}
          style={{ display: 'none' }} /* Hidden by default, shown via CSS in mmh.css media queries if I add them, or inline */
        >
          ☰
        </button>
        <div>
          <div className="mmh-topbar-title">
            <span style={{ fontSize: '20px', marginRight: '10px' }}>{ROLE_ICONS[user.role] || '🏥'}</span> 
            {TOPBAR_TITLES[user.role] || 'Hospital Management'}
          </div>
          <div className="mmh-topbar-sub">
             <span>📅 {today()}</span>
             <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
             <span>🕒 {nowTime()}</span>
             <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
             <span style={{ color: 'var(--sky)', fontWeight: 700 }}>MMH System Core v2.5</span>
          </div>
        </div>
      </div>

      <div className="mmh-topbar-right">
        <div className="desktop-only" style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>Welcome, {user.name}</div>
           <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.05em' }}>Server State: Online</div>
        </div>
        <div className="mmh-avatar-circle" style={{ 
          background: 'var(--bg3)', 
          border: '1px solid var(--border2)',
          fontSize: '18px',
          width: '40px',
          height: '40px'
        }}>
           {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
