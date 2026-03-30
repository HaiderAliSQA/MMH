import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import Pagination from './Pagination';

interface PatientRecord {
  _id: string;
  name?: string;
  mrNumber?: string;
  age?: number;
  gender?: string;
  doctor?: { _id: string; name: string };
  status?: string;
  createdAt?: string;
}

const PatientRecords: React.FC = () => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchRecords();
    setPage(1); // reset page on date change
  }, [startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      const res = await api.get(`/patients?${params.toString()}`);
      const data = res.data?.data ?? res.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRecords = useMemo(() => {
    return records.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [records, page, rowsPerPage]);

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
            <div className="mmh-field" style={{ minWidth: 160 }}>
              <label className="mmh-label">Start Date</label>
              <input 
                type="date" 
                className="mmh-input" 
                style={{ height: 38 }} 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="mmh-field" style={{ minWidth: 160 }}>
              <label className="mmh-label">End Date</label>
              <input 
                type="date" 
                className="mmh-input" 
                style={{ height: 38 }} 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="mmh-btn mmh-btn-primary" style={{ height: 38, marginTop: 18 }} onClick={() => fetchRecords()}>
              🔍 Search
            </button>
            <button className="mmh-btn mmh-btn-ghost" style={{ height: 38, marginTop: 18 }} onClick={() => { 
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today); 
              setEndDate(today); 
            }}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mmh-table-card">
        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Date</th><th>MR #</th><th>Patient Name</th><th>Age/Gender</th><th>Assigned Dr.</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                  <tr><td colSpan={6} className="mmh-empty">Fetching records...</td></tr>
              ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="mmh-empty">No records found.</td></tr>
              ) : paginatedRecords.map(rec => (
                  <tr key={rec._id}>
                      <td>{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--mmh-accent)', fontFamily: 'JetBrains Mono' }}>{rec.mrNumber || 'N/A'}</td>
                      <td className="mmh-td-name">{rec.name || '—'}</td>
                      <td>{rec.age ?? '—'} / {rec.gender || '—'}</td>
                      <td style={{ color: 'var(--mmh-amber)' }}>{rec.doctor?.name || '—'}</td>
                      <td><span className={`mmh-badge ${rec.status === 'OPD' ? 'mmh-badge-sky' : rec.status === 'Admitted' ? 'mmh-badge-rose' : 'mmh-badge-green'}`}>{rec.status || '—'}</span></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length > 0 && (
          <Pagination 
            totalResults={records.length}
            currentPage={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage} 
          />
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
