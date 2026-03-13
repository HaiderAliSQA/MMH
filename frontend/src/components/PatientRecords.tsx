import React, { useState, useEffect } from 'react';
import api from '../api';

interface PatientRecord {
  _id: string;
  name: string;
  mrNo: string;
  age: number;
  gender: string;
  doctorName: string;
  status: string;
  createdAt: string;
}

const PatientRecords: React.FC = () => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRecords();
  }, [date]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // In a real app, we would pass the date to the API
      const res = await api.get('/patients');
      // Mock filtering for now since the backend might not support it yet
      const filtered = res.data.filter((r: any) => {
          if (!date) return true;
          return r.createdAt?.startsWith(date);
      });
      setRecords(filtered);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Historical Patient Records</h1>
          <p className="mmh-page-subtitle">View and filter historical registrations by date</p>
        </div>
      </div>
      
      {/* Date Filter Bar */}
      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-body" style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="mmh-field" style={{ minWidth: 200 }}>
              <label className="mmh-label">Filter by Date</label>
              <input 
                type="date" 
                className="mmh-input" 
                style={{ height: 38 }} 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button className="mmh-btn mmh-btn-primary" style={{ height: 38, marginTop: 18 }} onClick={fetchRecords}>
              🔍 Refresh
            </button>
            <button className="mmh-btn mmh-btn-ghost" style={{ height: 38, marginTop: 18 }} onClick={() => setDate('')}>
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mmh-table-card">
        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Date</th><th>MR #</th><th>Patient Name</th><th>Age/Gender</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                  <tr><td colSpan={5} className="mmh-empty">Fetching records...</td></tr>
              ) : records.length === 0 ? (
                  <tr><td colSpan={5} className="mmh-empty">No records found for this date.</td></tr>
              ) : records.map(rec => (
                  <tr key={rec._id}>
                      <td>{new Date(rec.createdAt || '').toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>{rec.mrNo || 'N/A'}</td>
                      <td className="mmh-td-name">{rec.name}</td>
                      <td>{rec.age} / {rec.gender}</td>
                      <td><span className={`mmh-badge mmh-badge-${rec.status === 'Admitted' ? 'rose' : 'green'}`}>{rec.status}</span></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;
