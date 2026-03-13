import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import PatientRecords from '../components/PatientRecords';
import api from '../api';
import '../styles/mmh.css';

interface ManagerProps {
  onLogout?: () => void;
}

const Manager: React.FC<ManagerProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const [stats, setStats] = useState({
    totalPatients: 0, totalDoctors: 0, pendingLabs: 0, revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/patients'),
      api.get('/users'),
      api.get('/labs'),
      api.get('/payments'),
    ]).then(([pr, ur, lr, pyR]) => {
      const patients  = pr.status  === 'fulfilled' ? pr.value.data  : [];
      const users     = ur.status  === 'fulfilled' ? ur.value.data  : [];
      const labs      = lr.status  === 'fulfilled' ? lr.value.data  : [];
      const payments  = pyR.status === 'fulfilled' ? pyR.value.data : [];
      setStats({
        totalPatients: patients.length,
        totalDoctors:  users.filter((u: any) => u.role === 'doctor').length,
        pendingLabs:   labs.filter((l: any) => l.status === 'Pending').length,
        revenue:       payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0),
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout user={user} title="Hospital Manager Operations" subtitle="Operations Control & Analytics Portal">
      <div className="mmh-admin-tabs" style={{ marginBottom: '24px' }}>
        <button className={`mmh-admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Operations Overview</button>
        <button className={`mmh-admin-tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>Historical Records</button>
      </div>

      {activeTab === 'records' && <PatientRecords />}

      {activeTab === 'overview' && (
        <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
          <div className="mmh-stats-grid">
            {[
              { label:'Total Patients', icon:'👥', value: stats.totalPatients, accent:'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
              { label:'Active Doctors', icon:'👨‍⚕️', value: stats.totalDoctors,  accent:'linear-gradient(90deg,#10b981,#34d399)' },
              { label:'Pending Labs',  icon:'🔬', value: stats.pendingLabs,  accent:'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
              { label:'Total Revenue',  icon:'💰', value: `PKR ${stats.revenue.toLocaleString()}`, accent:'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            ].map(c => (
              <div className="mmh-stat-card" key={c.label}>
                <div className="mmh-stat-accent" style={{ background: c.accent }} />
                <span className="mmh-stat-icon">{c.icon}</span>
                <span className="mmh-stat-value" style={{ fontSize: typeof c.value === 'string' ? '18px' : '30px' }}>
                  {loading ? '—' : c.value}
                </span>
                <span className="mmh-stat-label">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="mmh-card" style={{ marginTop: 24 }}>
            <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
            <div className="mmh-card-header">
              <div className="mmh-card-title">📋 Department Status</div>
              <div className="mmh-badge mmh-badge-green">All Systems Operational</div>
            </div>
            <div className="mmh-card-body">
              {[
                { dept:'OPD / Registration', status:'Active', icon:'🏥' },
                { dept:'Laboratory',         status:'Active', icon:'🔬' },
                { dept:'Pharmacy',           status:'Active', icon:'💊' },
                { dept:'Ward Management',    status:'Active', icon:'🛏️' },
                { dept:'Billing & Finance',  status:'Active', icon:'💳' },
              ].map(d => (
                <div key={d.dept} className="mmh-ward-row">
                  <div className="mmh-ward-name">{d.icon} {d.dept}</div>
                  <div className="mmh-ward-bar-wrap">
                    <div className="mmh-ward-bar-fill" style={{ width:'100%' }} />
                  </div>
                  <span className="mmh-badge mmh-badge-green">{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Manager;
