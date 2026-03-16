import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Patient {
  _id: string;
  mrNumber: string;
  name: string;
  age: number;
  gender: string;
  cnic: string;
  phone: string;
  status: 'OPD' | 'Admitted' | 'Discharged';
  createdAt: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error("Fetch Patients Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.mrNumber.toLowerCase().includes(search.toLowerCase()) || 
                            p.cnic.includes(search);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesDate = !dateFilter || p.createdAt.startsWith(dateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [patients, search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: patients.length,
      opdToday: patients.filter(p => p.status === 'OPD' && p.createdAt.startsWith(today)).length,
      admitted: patients.filter(p => p.status === 'Admitted').length,
      discharged: patients.filter(p => p.status === 'Discharged').length
    };
  }, [patients]);

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPatient) return;
    setLoading(true);
    try {
      await api.put(`/patients/${editPatient._id}`, editPatient);
      alert("Patient updated successfully!");
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      alert("Failed to update patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.4s ease' }}>
      {/* Header */}
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">👥 Patients</h1>
          <p className="mmh-page-subtitle">All registered patients database</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="mmh-card" style={{ marginBottom: '24px' }}>
        <div className="mmh-card-body">
          <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 200px 200px', gap: '16px', alignItems: 'end' }}>
            <div className="mmh-field">
              <label className="mmh-label">Search (Name / MR# / CNIC)</label>
              <input 
                type="text" 
                className="mmh-input" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Status Filter</label>
              <select className="mmh-input-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="OPD">OPD</option>
                <option value="Admitted">Admitted</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Registration Date</label>
              <input 
                type="date" 
                className="mmh-input" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mmh-stats-grid">
        <div className="mmh-stat-card">
          <div className="mmh-stat-accent" style={{ background: 'var(--mmh-sky-gradient)' }} />
          <span className="mmh-stat-icon">📊</span>
          <span className="mmh-stat-value">{stats.total}</span>
          <span className="mmh-stat-label">Total Patients</span>
        </div>
        <div className="mmh-stat-card">
          <div className="mmh-stat-accent" style={{ background: 'var(--mmh-violet-gradient)' }} />
          <span className="mmh-stat-icon">🚶</span>
          <span className="mmh-stat-value">{stats.opdToday}</span>
          <span className="mmh-stat-label">OPD Today</span>
        </div>
        <div className="mmh-stat-card">
          <div className="mmh-stat-accent" style={{ background: 'var(--mmh-amber-gradient)' }} />
          <span className="mmh-stat-icon">🏥</span>
          <span className="mmh-stat-value">{stats.admitted}</span>
          <span className="mmh-stat-label">Currently Admitted</span>
        </div>
        <div className="mmh-stat-card">
          <div className="mmh-stat-accent" style={{ background: 'var(--mmh-green-gradient)' }} />
          <span className="mmh-stat-icon">✅</span>
          <span className="mmh-stat-value">{stats.discharged}</span>
          <span className="mmh-stat-label">Discharged</span>
        </div>
      </div>

      {/* Table */}
      <div className="mmh-card">
        <div className="mmh-card-body">
          <div className="mmh-table-scroll">
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MR#</th>
                  <th>Name</th>
                  <th>Age/Gender</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="mmh-empty">Loading patients...</td></tr>
                ) : filteredPatients.length === 0 ? (
                  <tr><td colSpan={9} className="mmh-empty">No patients found</td></tr>
                ) : (
                  filteredPatients.map((p, idx) => (
                    <tr key={p._id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--mmh-sky)', fontWeight: 700 }}>{p.mrNumber}</td>
                      <td className="mmh-td-name" style={{ color: 'white' }}>{p.name}</td>
                      <td>{p.age} / {p.gender}</td>
                      <td style={{ fontSize: '12px' }}>{p.cnic}</td>
                      <td>{p.phone}</td>
                      <td>
                        <span className={`mmh-badge ${
                          p.status === 'OPD' ? 'mmh-badge-sky' : 
                          p.status === 'Admitted' ? 'mmh-badge-amber' : 
                          'mmh-badge-green'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => setViewPatient(p)}>👁️ View</button>
                          <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => setEditPatient(p)}>✏️ Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewPatient && (
        <div className="mmh-overlay" onClick={() => setViewPatient(null)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">Patient Profile: {viewPatient.name}</h2>
              <button className="mmh-modal-close" onClick={() => setViewPatient(null)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div className="mmh-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="mmh-field">
                  <label className="mmh-label">MR Number</label>
                  <div className="mmh-view-val">{viewPatient.mrNumber}</div>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Age / Gender</label>
                  <div className="mmh-view-val">{viewPatient.age} / {viewPatient.gender}</div>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Contact</label>
                  <div className="mmh-view-val">{viewPatient.phone}</div>
                </div>
              </div>
              
              <div className="mmh-divider" style={{ margin: '24px 0' }} />
              
              <h3 style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px' }}>Visits & History</h3>
              <div className="mmh-empty" style={{ padding: '20px', background: 'var(--mmh-bg3)' }}>
                <div style={{ fontSize: '13px', color: 'var(--mmh-muted)' }}>Historical records display is under maintenance (Coming soon)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPatient && (
        <div className="mmh-overlay" onClick={() => setEditPatient(null)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">Edit Patient Info</h2>
              <button className="mmh-modal-close" onClick={() => setEditPatient(null)}>×</button>
            </div>
            <form onSubmit={handleUpdatePatient}>
              <div className="mmh-modal-body">
                <div className="mmh-field">
                  <label className="mmh-label">Patient Name</label>
                  <input 
                    type="text" 
                    className="mmh-input" 
                    value={editPatient.name}
                    onChange={e => setEditPatient({...editPatient, name: e.target.value})}
                  />
                </div>
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Age</label>
                    <input 
                      type="number" 
                      className="mmh-input" 
                      value={editPatient.age}
                      onChange={e => setEditPatient({...editPatient, age: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Phone</label>
                    <input 
                      type="text" 
                      className="mmh-input" 
                      value={editPatient.phone}
                      onChange={e => setEditPatient({...editPatient, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="mmh-modal-footer">
                <button type="button" className="mmh-btn mmh-btn-ghost" onClick={() => setEditPatient(null)}>Cancel</button>
                <button type="submit" className="mmh-btn mmh-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientsPage;
