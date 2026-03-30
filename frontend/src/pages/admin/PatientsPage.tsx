import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import { formatPhone, validatePhone, formatCNIC, validateCNIC } from '../../utils/validation';
import Pagination from '../../components/Pagination';

interface Patient {
  _id: string;
  mrNumber?: string;
  name?: string;
  age?: number;
  gender?: string;
  cnic?: string;
  phone?: string;
  status?: 'OPD' | 'Admitted' | 'Discharged';
  doctor?: { _id: string; name: string };
  createdAt?: string;
}

// ─── Safe search helper ───────────────────────────────────────────────
const safeSearch = (value: string | undefined | null, term: string): boolean => {
  if (!value) return false;
  return String(value).toLowerCase().includes(term.toLowerCase());
};

// ─── Error Boundary ───────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--mmh-text)', fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: 'var(--mmh-text3)', fontSize: 13 }}>{this.state.errorMsg}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            style={{
              marginTop: 20, padding: '10px 24px',
              background: 'var(--mmh-accent)', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Doctor { _id: string; name: string; department?: string; }

// ─── Main Component ───────────────────────────────────────────────────
const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [cnicError, setCnicError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dropdown search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = React.useRef<any>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data || []);
    } catch (err) {
      console.error('Fetch Doctors Error:', err);
    }
  };

  const fetchPatients = async (overrideSearch?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
      if (currentSearch) params.append('search', currentSearch);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (doctorFilter !== 'All') params.append('doctorId', doctorFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/patients?${params.toString()}`);
      const data = res.data?.data ?? res.data ?? [];
      setPatients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Fetch Patients Error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when single-select filters change
  useEffect(() => {
    if (loading) return; // avoid race
    fetchPatients();
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [statusFilter, doctorFilter, startDate, endDate]);

  const handleDropdownSearch = (val: string) => {
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    
    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/patients/search?q=${encodeURIComponent(val)}`);
        const data = res.data?.data ?? res.data ?? [];
        setSearchResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Dropdown Search Error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectPatient = (p: Patient) => {
    setSearch(p.mrNumber || p.name || '');
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    fetchPatients(p.mrNumber || p.name);
  };

  const filteredPatients = useMemo(() => {
    // With backend filtering, we mostly just return the patients as is
    // But we keep the frontend safety just in case
    return Array.isArray(patients) ? patients : [];
  }, [patients]);

  const totalResults = filteredPatients.length;
  const paginatedPatients = useMemo(() => {
    return filteredPatients.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredPatients, currentPage, rowsPerPage]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: patients.length,
      opdToday: patients.filter(p => p.status === 'OPD' && (p.createdAt ?? '').startsWith(today)).length,
      admitted: patients.filter(p => p.status === 'Admitted').length,
      discharged: patients.filter(p => p.status === 'Discharged').length,
    };
  }, [patients]);

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPatient) return;

    const pErr = validatePhone(editPatient.phone || '');
    const cErr = validateCNIC(editPatient.cnic || '');
    if (pErr || cErr) {
      setPhoneError(pErr);
      setCnicError(cErr);
      return;
    }

    setLoading(true);
    try {
      await api.put(`/patients/${editPatient._id}`, editPatient);
      alert('Patient updated successfully!');
      setEditPatient(null);
      fetchPatients();
    } catch {
      alert('Failed to update patient');
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
      <div className="mmh-card" style={{ marginBottom: 24, zIndex: 10, position: 'relative' }}>
        <div className="mmh-card-body">
          <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 200px 180px 150px 150px auto', gap: 12, alignItems: 'end' }}>
            
            {/* Search with Dropdown */}
            <div className="mmh-field" style={{ position: 'relative' }} ref={dropdownRef}>
              <label className="mmh-label">Search (Name / MR# / CNIC)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mmh-text3)' }}>🔍</span>
                <input 
                  type="text" 
                  className="mmh-input" 
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder={search || "Search patients..."} 
                  value={searchQuery} 
                  onChange={e => handleDropdownSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                />
                {(searchQuery || search) && (
                  <button 
                    type="button"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mmh-text3)', cursor: 'pointer', fontSize: 18 }}
                    onClick={() => { setSearch(''); setSearchQuery(''); fetchPatients(''); }}
                  >
                    ×
                  </button>
                )}
              </div>

            {/* Dropdown Results */}
            {showDropdown && (searchResults.length > 0 || searching) && (
              <div className="mmh-patient-dropdown" style={{ top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 100 }}>
                  {searching ? (
                    <div className="mmh-empty" style={{ padding: 12 }}>Searching...</div>
                  ) : (
                    searchResults.map(p => (
                      <div key={p._id} className="mmh-patient-dropdown-item" onClick={() => handleSelectPatient(p)}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--mmh-sky-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white' }}>
                          {p.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="mmh-dropdown-name" style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                          <div className="mmh-dropdown-mr" style={{ fontSize: 11, opacity: 0.7 }}>{p.mrNumber}</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mmh-sky)' }}>{p.status}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mmh-field">
              <label className="mmh-label">Doctor Filter</label>
              <select className="mmh-input-select" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
                <option value="All">All Doctors</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="mmh-field">
              <label className="mmh-label">Status Filter</label>
              <select className="mmh-input-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="OPD">OPD</option>
                <option value="Admitted">Admitted</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            <div className="mmh-field">
              <label className="mmh-label">Start Date</label>
              <input type="date" className="mmh-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="mmh-field">
              <label className="mmh-label">End Date</label>
              <input type="date" className="mmh-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <button 
              type="button" 
              className="mmh-btn mmh-btn-ghost mmh-btn-sm" 
              style={{ height: 38 }}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today); setEndDate(today); setStatusFilter('All'); setDoctorFilter('All');
              }}
            >
              🔄 Refresh
            </button>
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
        <div className="mmh-card-body" style={{ padding: 0 }}>
          <div className="mmh-table-scroll">
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>#</th><th>MR#</th><th>Name</th><th>Age/Gender</th>
                  <th>CNIC</th><th>Phone</th><th>Status</th><th>Doctor</th><th>Registered</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="mmh-empty">Loading patients...</td></tr>
                ) : filteredPatients.length === 0 ? (
                  <tr><td colSpan={10} className="mmh-empty">No patients found</td></tr>
                ) : (
                  paginatedPatients.map((p, idx) => (
                    <tr key={p._id}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--mmh-accent)', fontWeight: 700 }}>{p.mrNumber || '—'}</td>
                      <td className="mmh-td-name" style={{ color: 'var(--mmh-text)' }}>{p.name || '—'}</td>
                      <td>{p.age ?? '—'} / {p.gender || '—'}</td>
                      <td style={{ fontSize: 12 }}>{p.cnic || '—'}</td>
                      <td>{p.phone || '—'}</td>
                      <td>
                        <span className={`mmh-badge ${
                          p.status === 'OPD' ? 'mmh-badge-sky' :
                          p.status === 'Admitted' ? 'mmh-badge-amber' : 'mmh-badge-green'
                        }`}>
                          {p.status || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--mmh-accent)', fontWeight: 600 }}>{p.doctor?.name || '—'}</td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
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
          <Pagination 
            totalResults={totalResults}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </div>
      </div>

      {/* View Modal */}
      {viewPatient && (
        <div className="mmh-overlay" onClick={() => setViewPatient(null)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">Patient Profile: {viewPatient.name}</h2>
              <button className="mmh-modal-close" onClick={() => setViewPatient(null)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div className="mmh-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="mmh-field">
                  <label className="mmh-label">MR Number</label>
                  <div className="mmh-view-val">{viewPatient.mrNumber || '—'}</div>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Age / Gender</label>
                  <div className="mmh-view-val">{viewPatient.age ?? '—'} / {viewPatient.gender || '—'}</div>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Contact</label>
                  <div className="mmh-view-val">{viewPatient.phone || '—'}</div>
                </div>
              </div>
              <div className="mmh-divider" style={{ margin: '24px 0' }} />
              <h3 style={{ color: 'var(--mmh-text3)', fontSize: 14, textTransform: 'uppercase', marginBottom: 16 }}>Visits & History</h3>
              <div className="mmh-empty" style={{ padding: 20, background: 'var(--mmh-bg3)' }}>
                <div style={{ fontSize: 13, color: 'var(--mmh-muted)' }}>Historical records display is under maintenance (Coming soon)</div>
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
                  <input type="text" className="mmh-input" value={editPatient.name || ''}
                    onChange={e => setEditPatient({ ...editPatient, name: e.target.value })} />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">CNIC</label>
                  <input
                    className="mmh-input"
                    style={{ borderColor: cnicError ? 'var(--mmh-danger)' : undefined }}
                    placeholder="XXXXX-XXXXXXX-X"
                    value={editPatient.cnic || ''}
                    onChange={e => {
                      const formatted = formatCNIC(e.target.value);
                      setEditPatient({ ...editPatient, cnic: formatted });
                      setCnicError(validateCNIC(formatted));
                    }}
                  />
                  {cnicError && <span className="mmh-field-error">⚠️ {cnicError}</span>}
                </div>
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Age</label>
                    <input type="number" className="mmh-input" value={editPatient.age ?? ''}
                      onChange={e => setEditPatient({ ...editPatient, age: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Phone</label>
                    <input
                      className="mmh-input"
                      style={{ borderColor: phoneError ? 'var(--mmh-danger)' : undefined }}
                      placeholder="03XX-XXXXXXX"
                      value={editPatient.phone || ''}
                      onChange={e => {
                        const formatted = formatPhone(e.target.value);
                        setEditPatient({ ...editPatient, phone: formatted });
                        setPhoneError(validatePhone(formatted));
                      }}
                    />
                    {phoneError && <span className="mmh-field-error">⚠️ {phoneError}</span>}
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

// ─── Wrapped Export with ErrorBoundary ────────────────────────────────
export default function PatientsPageWrapper() {
  return (
    <ErrorBoundary>
      <PatientsPage />
    </ErrorBoundary>
  );
}
