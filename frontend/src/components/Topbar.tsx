import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api';
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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const today = () => new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  const nowTime = () => new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await notificationAPI.markRead(notif._id);
        const newNotifs = [...notifications];
        const idx = newNotifs.findIndex(n => n._id === notif._id);
        if (idx > -1) newNotifs[idx].isRead = true;
        setNotifications(newNotifs);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setShowNotif(false);

    if (user.role === 'admin') {
      navigate('/hr?tab=leaves');
    } else {
      // In a real app we might navigate to exact path, but per spec just mark as read/go to tab
      if (notif.type.includes('leave') || notif.type.includes('substitute')) {
        navigate(`/${user.role === 'doctor' ? 'my-patients' : user.role === 'manager' ? 'analytics' : user.role}?tab=my-leave`);
      }
    }
  };

  const getNotifIcon = (type: string) => {
    if (type === 'leave_request') return { icon: '📝', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    if (type === 'leave_approved') return { icon: '✅', bg: 'rgba(16,185,129,0.15)', color: '#34d399' };
    if (type === 'leave_rejected') return { icon: '❌', bg: 'rgba(244,63,94,0.15)', color: '#fb7185' };
    if (type === 'substitute_request') return { icon: '🔄', bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' };
    return { icon: '🔔', bg: 'rgba(14,165,233,0.15)', color: '#38bdf8' };
  };

  const timeAgo = (dateStr: string) => {
    const min = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="mmh-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="mmh-btn mmh-btn-ghost mmh-btn-icon mobile-only"
          onClick={toggleSidebar}
          style={{ display: 'none' }}
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
             <span style={{ color: 'var(--mmh-sky)', fontWeight: 700 }}>MMH System Core v2.5</span>
          </div>
        </div>
      </div>

      <div className="mmh-topbar-right">
        {/* Notification Bell */}
        <div className="mmh-notif-wrap">
          <button 
            className={`mmh-notif-btn ${showNotif ? 'active' : ''}`}
            onClick={() => setShowNotif(!showNotif)}
          >
            🔔
            {unreadCount > 0 && (
              <div className="mmh-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
            )}
          </button>

          {showNotif && (
            <div className="mmh-notif-dropdown" style={{ animation: 'mmh-scale-in 0.15s ease' }}>
              <div className="mmh-notif-header">
                <div className="mmh-notif-title">Notifications</div>
                {unreadCount > 0 && (
                  <button className="mmh-notif-mark-all" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div>
                {notifications.length === 0 ? (
                  <div className="mmh-notif-empty">No notifications yet 🏖️</div>
                ) : (
                  notifications.map((n) => {
                    const styling = getNotifIcon(n.type);
                    return (
                      <div 
                        key={n._id} 
                        className={`mmh-notif-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(n)}
                      >
                        <div className="mmh-notif-icon" style={{ background: styling.bg, color: styling.color }}>
                          {styling.icon}
                        </div>
                        <div className="mmh-notif-text">
                          <div className="mmh-notif-item-title">{n.title}</div>
                          <div className="mmh-notif-msg">{n.message}</div>
                          <div className="mmh-notif-time">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="mmh-notif-dot" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="desktop-only" style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>Welcome, {user.name}</div>
           <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.05em' }}>Server State: Online</div>
        </div>
        <div className="mmh-avatar-circle" style={{ 
          background: '#111d35', 
          border: '1px solid #2a4070',
          fontSize: '18px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontWeight: 800,
          color: 'white'
        }}>
           {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

