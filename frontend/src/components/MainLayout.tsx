import React from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/mmh.css';

interface MainLayoutProps {
  user: any;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="mmh-app">
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <main className="mmh-main">
        <header className="mmh-topbar">
          <div className="mmh-topbar-left">
            <button 
              className="mmh-sidebar-toggle" 
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="mmh-topbar-title">{title}</div>
            {subtitle && <div className="mmh-topbar-subtitle">{subtitle}</div>}
          </div>
          <div className="mmh-topbar-right">
             <div className="mmh-topbar-info">
                <div style={{ color: 'white', fontWeight: 700 }}>{new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric'})}</div>
                <div>Server Status: <span style={{ color: 'var(--mmh-green)' }}>Online</span></div>
             </div>
          </div>
        </header>

        <div className="mmh-page">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
