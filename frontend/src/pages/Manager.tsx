import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import PatientRecords from '../components/PatientRecords';
import MyLeaveTab from '../components/MyLeaveTab';
import api from '../api';
import { useSearchParams } from 'react-router-dom';
import '../styles/mmh.css';

interface ManagerProps {
  onLogout?: () => void;
}

const Manager: React.FC<ManagerProps> = ({ onLogout }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
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
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      <div className="mmh-admin-tabs" style={{ marginBottom: '24px' }}>
        <button className={`mmh-admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'dashboard' })}>Operations Overview</button>
        <button className={`mmh-admin-tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'records' })}>Historical Records</button>
        <button className={`mmh-admin-tab ${activeTab === 'my-leave' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'my-leave' })}>🏖️ My Leave</button>
      </div>

      {activeTab === 'my-leave' && <MyLeaveTab userRole={user.role} />}

      {activeTab === 'records' && <PatientRecords />}

      {activeTab === 'dashboard' && (
        <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
          <div className="mmh-stats-grid">
            {[
              { label:'Total Patients', icon:'👥', value: stats.totalPatients, accent:'var(--mmh-accent)' },
              { label:'Active Doctors', icon:'👨‍⚕️', value: stats.totalDoctors,  accent:'var(--mmh-success)' },
              { label:'Pending Labs',  icon:'🔬', value: stats.pendingLabs,  accent:'var(--mmh-info)' },
              { label:'Total Revenue',  icon:'💰', value: `PKR ${stats.revenue.toLocaleString()}`, accent:'var(--mmh-warning)' },
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
            <div className="mmh-card-accent-top" style={{ background:'var(--mmh-accent)' }} />
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
    </div>
  );
};

export default Manager;
