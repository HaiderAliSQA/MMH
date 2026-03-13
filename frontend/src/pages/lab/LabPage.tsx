import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

// ─── Types ──────────────────────────────────────────────────────────
interface LabReq {
  _id: string;
  patientName: string;
  patientId: string;
  tests: string[];
  status: 'Pending' | 'Processing' | 'Done';
  urgent: boolean;
  createdAt: string;
  doctorName?: string;
  results?: Record<string, { value: string; range: string; unit: string; flag: string }>;
}

type Flag = 'Normal' | 'High' | 'Low' | 'Critical';

const flagClass: Record<Flag, string> = {
  Normal:   'mmh-flag-normal',
  High:     'mmh-flag-high',
  Low:      'mmh-flag-low',
  Critical: 'mmh-flag-critical',
};

const LabPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <div className="mmh-app" style={{ flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div className="mmh-page-tabs">
        <button className={`mmh-page-tab${tab === 0 ? ' active' : ''}`} onClick={() => setTab(0)}>
          <span>🔬</span> Pending Tests
        </button>
        <button className={`mmh-page-tab${tab === 1 ? ' active' : ''}`} onClick={() => setTab(1)}>
          <span>📝</span> Enter Results
        </button>
      </div>
      <div className="mmh-page" style={{ flex:1, overflowY:'auto' }}>
        {tab === 0 && <PendingTab />}
        {tab === 1 && <ResultsTab />}
      </div>
    </div>
  );
};

// ─── TAB 1 — PENDING TESTS ──────────────────────────────────────────
const PendingTab: React.FC = () => {
  const [labs,    setLabs]    = useState<LabReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('All');
  const [urgOnly, setUrgOnly] = useState(false);

  const fetchLabs = () => {
    setLoading(true);
    api.get('/labs').then(r => setLabs(r.data)).catch(()=>{}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLabs(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/labs/${id}`, { status: newStatus });
      fetchLabs();
    } catch { /* silent */ }
  };

  const filtered = labs.filter(l => {
    const matchSearch = !search || l.patientName?.toLowerCase().includes(search.toLowerCase()) || l._id.includes(search);
    const matchStatus = status === 'All' || l.status === status;
    const matchUrgent = !urgOnly || l.urgent;
    return matchSearch && matchStatus && matchUrgent;
  });

  const cardAccent: Record<string, string> = {
    Pending:    'linear-gradient(90deg, #f59e0b, #fbbf24)',
    Processing: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    Done:       'linear-gradient(90deg, #10b981, #34d399)',
  };

  return (
    <div style={{ animation:'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Lab Queue</h1>
          <p className="mmh-page-subtitle">{labs.filter(l=>l.status==='Pending').length} tests pending</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchLabs}>🔄 Refresh</button>
      </div>

      {/* Filter row */}
      <div className="mmh-filter-row">
        <div className="mmh-search-wrap">
          <span className="mmh-search-icon">🔍</span>
          <input
            className="mmh-search-input"
            placeholder="Search patient or Lab ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="mmh-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Done">Done</option>
        </select>
        <button
          className={`mmh-btn mmh-btn-sm ${urgOnly ? 'mmh-btn-danger' : 'mmh-btn-ghost'}`}
          onClick={() => setUrgOnly(u => !u)}
        >
          🚨 {urgOnly ? 'Urgent Only' : 'All Priority'}
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="mmh-empty"><div className="mmh-empty-text">Loading lab requests...</div></div>
      ) : filtered.length === 0 ? (
        <div className="mmh-empty">
          <div className="mmh-empty-icon">🔬</div>
          <div className="mmh-empty-text">No lab requests found</div>
          <div className="mmh-empty-sub">Adjust filters or wait for new requests.</div>
        </div>
      ) : (
        <div className="mmh-opd-grid">
          {filtered.map(lab => (
            <div className="mmh-opd-card" key={lab._id}>
              <div className="mmh-opd-card-bar" style={{ background: cardAccent[lab.status] || cardAccent.Pending }} />
              <div style={{ padding:'16px' }}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontFamily:'JetBrains Mono', color:'#38bdf8', fontWeight:800, fontSize:13 }}>
                    #{lab._id.slice(-6).toUpperCase()}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    {lab.urgent && <span className="mmh-badge mmh-badge-rose">🚨 URGENT</span>}
                    <span className={`mmh-badge ${
                      lab.status === 'Done' ? 'mmh-badge-green' :
                      lab.status === 'Processing' ? 'mmh-badge-sky' :
                      'mmh-badge-amber'
                    }`}>{lab.status}</span>
                  </div>
                </div>

                {/* Patient */}
                <div style={{ fontWeight:800, color:'white', fontSize:14, marginBottom:4 }}>
                  {lab.patientName || 'Unknown Patient'}
                </div>
                {lab.doctorName && (
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>
                    Dr. {lab.doctorName}
                  </div>
                )}

                {/* Tests */}
                <div style={{ marginBottom:12 }}>
                  {(lab.tests || []).map(t => (
                    <span className="mmh-test-tag" key={t}>{t}</span>
                  ))}
                </div>

                <div className="mmh-opd-divider" />

                {/* Time */}
                <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>
                  {lab.createdAt ? new Date(lab.createdAt).toLocaleString('en-PK') : 'N/A'}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  {lab.status === 'Pending' && (
                    <button className="mmh-btn mmh-btn-amber mmh-btn-sm mmh-btn-full"
                      onClick={() => updateStatus(lab._id, 'Processing')}>
                      ▶ Start Processing
                    </button>
                  )}
                  {lab.status === 'Processing' && (
                    <button className="mmh-btn mmh-btn-primary mmh-btn-sm mmh-btn-full"
                      onClick={() => updateStatus(lab._id, 'Done')}>
                      📝 Mark Done
                    </button>
                  )}
                  {lab.status === 'Done' && (
                    <button className="mmh-btn mmh-btn-ghost mmh-btn-sm mmh-btn-full"
                      onClick={() => window.print()}>
                      🖨️ Print Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TAB 2 — ENTER RESULTS ──────────────────────────────────────────
const ResultsTab: React.FC = () => {
  const [labs,       setLabs]       = useState<LabReq[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [results,    setResults]    = useState<Record<string, { value:string; range:string; unit:string; flag:Flag }>>({});
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    api.get('/labs').then(r => {
      setLabs(r.data.filter((l: LabReq) => l.status !== 'Done'));
    }).catch(() => {});
  }, []);

  const selectedLab = labs.find(l => l._id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSuccess(''); setError('');
    const lab = labs.find(l => l._id === id);
    if (!lab) return;
    const init: Record<string, { value:string; range:string; unit:string; flag:Flag }> = {};
    (lab.tests || []).forEach(t => { init[t] = { value:'', range:'', unit:'', flag:'Normal' }; });
    setResults(init);
  };

  const updateResult = (test: string, field: 'value'|'range'|'unit'|'flag', val: string) => {
    setResults(r => ({ ...r, [test]: { ...r[test], [field]: val } }));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/labs/${selectedId}`, { results, status:'Done' });
      setSuccess('Results saved and report generated!');
      setSelectedId('');
      setResults({});
      const r = await api.get('/labs');
      setLabs(r.data.filter((l: LabReq) => l.status !== 'Done'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation:'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Enter Lab Results</h1>
          <p className="mmh-page-subtitle">Fill test values, ranges and flag abnormalities</p>
        </div>
      </div>

      {error   && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}

      {/* Select lab request */}
      <div className="mmh-card" style={{ marginBottom:20 }}>
        <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#8b5cf6,#0ea5e9)' }} />
        <div className="mmh-card-body">
          <div className="mmh-field">
            <label className="mmh-label">Select Lab Request <span className="mmh-required">*</span></label>
            <select className="mmh-input-select" value={selectedId} onChange={e => handleSelect(e.target.value)}>
              <option value="">— Select Pending/Processing Lab Request —</option>
              {labs.map(l => (
                <option key={l._id} value={l._id}>
                  #{l._id.slice(-6).toUpperCase()} — {l.patientName} ({(l.tests||[]).join(', ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patient info + results table */}
      {selectedLab && (
        <>
          {/* Patient info card */}
          <div className="mmh-patient-info-card">
            <div className="mmh-patient-info-avatar">
              {(selectedLab.patientName || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="mmh-patient-info-name">{selectedLab.patientName}</div>
              <div className="mmh-patient-info-meta">
                <span>Lab ID: #{selectedLab._id.slice(-6).toUpperCase()}</span>
                {selectedLab.urgent && <span style={{ color:'#fb7185', fontWeight:700 }}>🚨 URGENT</span>}
                <span>Tests: {(selectedLab.tests || []).length}</span>
                <span>Ordered: {selectedLab.createdAt ? new Date(selectedLab.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>

          <div className="mmh-card">
            <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
            <div className="mmh-card-header">
              <div className="mmh-card-title">📊 Test Results Entry</div>
              <div className="mmh-badge mmh-badge-amber">{(selectedLab.tests||[]).length} tests</div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="mmh-results-table">
                <thead>
                  <tr>
                    <th style={{ width:'26%' }}>Test Name</th>
                    <th style={{ width:'20%' }}>Result Value</th>
                    <th style={{ width:'20%' }}>Normal Range</th>
                    <th style={{ width:'14%' }}>Unit</th>
                    <th style={{ width:'20%' }}>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedLab.tests || []).map(test => {
                    const r = results[test] || { value:'', range:'', unit:'', flag:'Normal' as Flag };
                    const isCritical = r.flag === 'Critical';
                    return (
                      <tr key={test} className={isCritical ? 'mmh-row-critical' : ''}>
                        <td style={{ fontWeight:600, color:'white' }}>{test}</td>
                        <td>
                          <input
                            className="mmh-result-input"
                            placeholder="e.g. 5.2"
                            value={r.value}
                            onChange={e => updateResult(test, 'value', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="mmh-result-input"
                            placeholder="e.g. 4.5 – 6.0"
                            value={r.range}
                            onChange={e => updateResult(test, 'range', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="mmh-result-input"
                            placeholder="e.g. mg/dL"
                            value={r.unit}
                            onChange={e => updateResult(test, 'unit', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className={`mmh-flag-select ${flagClass[r.flag as Flag] || ''}`}
                            value={r.flag}
                            onChange={e => updateResult(test, 'flag', e.target.value)}
                          >
                            <option value="Normal">Normal</option>
                            <option value="High">High ↑</option>
                            <option value="Low">Low ↓</option>
                            <option value="Critical">Critical ‼️</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'16px 20px', borderTop:'1px solid #1e3050', display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button className="mmh-btn mmh-btn-ghost" onClick={() => { setSelectedId(''); setResults({}); }}>Cancel</button>
              <button className="mmh-btn mmh-btn-green" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : '📋 Save & Finalise Report'}
              </button>
            </div>
          </div>
        </>
      )}

      {!selectedLab && !success && (
        <div className="mmh-empty">
          <div className="mmh-empty-icon">📝</div>
          <div className="mmh-empty-text">Select a lab request to enter results</div>
          <div className="mmh-empty-sub">Choose a pending or processing lab request from the dropdown above.</div>
        </div>
      )}
    </div>
  );
};

export default LabPage;
