import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../api';
import '../styles/mmh.css';

interface PatientProps {
  user?: any;
  onLogout?: () => void;
}

const Patient: React.FC<PatientProps> = ({ user: propUser, onLogout }) => {
  const user = propUser || (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [myLabs,    setMyLabs]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/patients'),
      api.get('/labs'),
    ]).then(([pr, lr]) => {
      const allPatients = pr.status === 'fulfilled' ? pr.value.data : [];
      const allLabs     = lr.status === 'fulfilled' ? lr.value.data : [];
      const mine = allPatients.filter((p: any) =>
        p.name?.toLowerCase() === user?.name?.toLowerCase()
      );
      const myLabsFiltered = allLabs.filter((l: any) =>
        mine.some((p: any) => p._id === l.patientId)
      );
      setMyRecords(mine);
      setMyLabs(myLabsFiltered);
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <MainLayout user={user} title="Patient Portal" subtitle="Your Health Records & Reports">
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Welcome, {user?.name || 'Patient'}</h1>
          <p className="mmh-page-subtitle">View your medical history and lab reports</p>
        </div>
      </div>

      {loading ? (
        <div className="mmh-empty"><div className="mmh-empty-text">Loading your records...</div></div>
      ) : myRecords.length === 0 ? (
        <div className="mmh-card">
          <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
          <div className="mmh-card-body">
            <div className="mmh-empty">
              <div className="mmh-empty-icon">🏥</div>
              <div className="mmh-empty-text">No records found</div>
              <div className="mmh-empty-sub">Your OPD visits and lab reports will appear here once registered at the front desk.</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mmh-card" style={{ marginBottom:20 }}>
            <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#0ea5e9,#38bdf8)' }} />
            <div className="mmh-card-header">
              <div className="mmh-card-title">📋 My OPD Visits</div>
              <div className="mmh-badge mmh-badge-sky">{myRecords.length} visits</div>
            </div>
            <div className="mmh-table-scroll">
              <table className="mmh-table">
                <thead>
                  <tr><th>MR #</th><th>Date</th><th>Doctor</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {myRecords.map((r: any) => (
                    <tr key={r._id}>
                      <td style={{ fontFamily:'JetBrains Mono', color:'#0ea5e9', fontWeight:700 }}>{r.mrNo || '—'}</td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                      <td>{r.doctorName || '—'}</td>
                      <td><span className="mmh-badge mmh-badge-sky">{r.status || 'OPD'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {myLabs.length > 0 && (
            <div className="mmh-card">
              <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#8b5cf6,#0ea5e9)' }} />
              <div className="mmh-card-header">
                <div className="mmh-card-title">🔬 My Lab Reports</div>
                <div className="mmh-badge mmh-badge-violet">{myLabs.length} reports</div>
              </div>
              <div className="mmh-table-scroll">
                <table className="mmh-table">
                  <thead>
                    <tr><th>Lab ID</th><th>Tests</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {myLabs.map((l: any) => (
                      <tr key={l._id}>
                        <td style={{ fontFamily:'JetBrains Mono', color:'#38bdf8', fontWeight:700 }}>
                          #{l._id.slice(-6).toUpperCase()}
                        </td>
                        <td>{(l.tests||[]).join(', ')}</td>
                        <td>
                          <span className={`mmh-badge ${l.status==='Done'?'mmh-badge-green':l.status==='Processing'?'mmh-badge-amber':'mmh-badge-gray'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ fontSize:12, color:'#64748b' }}>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Patient;
