import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SessionWarning from '../components/SessionWarning';
import { useSessionGuard } from '../hooks/useSessionGuard';
import '../styles/mmh.css';

interface MainLayoutProps {
  user?: any;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Session guard: auto-logout + expiry countdown ─────────────────────────
  const { minutesLeft, showExpireWarning } = useSessionGuard();

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="mmh-app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="mmh-main">
        <header className="mmh-topbar">
          <div className="mmh-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              className="mmh-topbar-icon-btn"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(prev => !prev);
                } else {
                  window.dispatchEvent(new Event('toggle-desktop-sidebar'));
                }
              }}
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <div className="mmh-topbar-title" style={{ marginLeft: '4px' }}>{title}</div>
              {subtitle && (
                <div className="mmh-topbar-subtitle" style={{ marginLeft: '4px' }}>{subtitle}</div>
              )}
            </div>
          </div>

          <div className="mmh-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="mmh-topbar-info" style={{ marginRight: '4px' }}>
              <div style={{ color: 'white', fontWeight: 700 }}>
                {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div>Server Status: <span style={{ color: 'var(--mmh-green)' }}>Online</span></div>
            </div>

            <div className="mmh-tooltip-wrap">
              <button
                onClick={toggleFullscreen}
                className="mmh-topbar-icon-btn"
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen'}
              >
                {isFullscreen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
              <span className="mmh-tooltip">
                {isFullscreen ? 'Exit Fullscreen — press Esc' : 'Toggle Fullscreen'}
              </span>
            </div>
          </div>
        </header>

        <div className="mmh-page">
          {children}
        </div>
      </main>

      {/* ── Session expiry warning banner ── */}
      {showExpireWarning && minutesLeft !== null && (
        <SessionWarning minutesLeft={minutesLeft} />
      )}
    </div>
  );
};

export default MainLayout;
