import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import PatientSearch, { PatientResult } from '../../components/PatientSearch';

// ─── Types ──────────────────────────────────────────────────────────
interface TestDetail {
  name: string;
  price: number;
}
interface LabResult {
  testName?: string;
  value?: string;
  normalRange?: string;
  unit?: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}
interface LabReq {
  _id: string;
  labId: string;
  patient?: { _id: string; name: string; mrNumber?: string; age?: number; gender?: string };
  doctor?: { name: string; department?: string };
  tests: string[];
  testDetails?: TestDetail[];
  status: 'Pending' | 'Processing' | 'Done';
  isUrgent: boolean;
  createdAt: string;
  results?: LabResult[];
}

type Flag = 'Normal' | 'High' | 'Low' | 'Critical';

const CARD_ACCENT: Record<string, string> = {
  Pending:    'linear-gradient(90deg,#f59e0b,#fbbf24)',
  Processing: 'linear-gradient(90deg,#0ea5e9,#38bdf8)',
  Done:       'linear-gradient(90deg,#10b981,#34d399)',
};

const FLAG_COLORS: Record<Flag, string> = {
  Normal:   '#34d399',
  High:     '#fbbf24',
  Low:      '#fbbf24',
  Critical: '#fb7185',
};

// --- Print Lab Report (dedicated popup window) ----------------------
const printLabReport = (lab: LabReq) => {
  const pw = window.open('', '_blank', 'width=700,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!pw) { alert('Please allow popups for printing'); return; }

  const patient = lab.patient as any;
  const doctor  = lab.doctor  as any;

  const flagBg    = (f?: string) => f === 'Critical' ? '#fee2e2' : (f === 'High' || f === 'Low') ? '#fef3c7' : '#dcfce7';
  const flagColor = (f?: string) => f === 'Critical' ? '#dc2626' : (f === 'High' || f === 'Low') ? '#d97706' : '#059669';
  const valColor  = (f?: string) => f === 'Critical' ? '#dc2626' : (f === 'High' || f === 'Low') ? '#d97706' : '#059669';

  const resultsHTML = lab.results && lab.results.length > 0
    ? lab.results.map(r =>
        '<tr style="background:' + (r.flag === 'Critical' ? '#fef2f2' : 'white') + ';border-bottom:1px solid #e2e8f0;">'
        + '<td style="padding:8px 12px;font-size:12px;font-weight:600;color:#0f172a;">' + (r.testName || '-') + '</td>'
        + '<td style="padding:8px 12px;font-size:12px;font-weight:800;text-align:center;color:' + valColor(r.flag) + ';">' + (r.value || '-') + '</td>'
        + '<td style="padding:8px 12px;font-size:11px;color:#64748b;text-align:center;">' + (r.normalRange || '-') + '</td>'
        + '<td style="padding:8px 12px;font-size:11px;color:#64748b;text-align:center;">' + (r.unit || '-') + '</td>'
        + '<td style="padding:8px 12px;text-align:center;"><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:800;background:' + flagBg(r.flag) + ';color:' + flagColor(r.flag) + ';">' + (r.flag || 'Normal') + '</span></td>'
        + '</tr>'
      ).join('')
    : '<tr><td colspan="5" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No results entered yet</td></tr>';

  const testsHTML = (lab.tests || [])
    .map(t => '<span style="display:inline-block;padding:3px 10px;margin:2px;background:#e0e7ff;color:#3730a3;border-radius:6px;font-size:11px;font-weight:700;">' + t + '</span>')
    .join('');

  const labDate    = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const labTime    = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const statusColor = lab.status === 'Done' ? '#059669' : lab.status === 'Processing' ? '#0284c7' : '#d97706';

  pw.document.write(
    '<!DOCTYPE html><html lang="en"><head>'
    + '<meta charset="UTF-8">'
    + '<title>Lab Report - ' + lab.labId + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Plus Jakarta Sans",sans-serif;background:white;color:#0f172a;padding:24px;max-width:700px;margin:0 auto;}@page{size:A4;margin:15mm}@media print{body{padding:0;max-width:none}.no-print{display:none!important}}</style>'
    + '</head><body>'
    + '<div style="background:#312e81;color:white;padding:20px 24px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:flex-start;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
    +   '<div><div style="font-size:20px;font-weight:900;font-style:italic;">Majida Memorial Hospital</div><div style="font-size:11px;opacity:.75;margin-top:3px;">Chiniot, Punjab - Laboratory Report</div></div>'
    +   '<div style="text-align:right;"><div style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:900;background:rgba(255,255,255,.15);padding:4px 12px;border-radius:6px;">' + lab.labId + '</div><div style="font-size:11px;opacity:.7;margin-top:4px;">' + labDate + ' ' + labTime + '</div></div>'
    + '</div>'
    + (lab.isUrgent ? '<div style="background:#fef2f2;border:2px solid #fca5a5;padding:8px 16px;text-align:center;font-size:12px;font-weight:800;color:#dc2626;-webkit-print-color-adjust:exact;print-color-adjust:exact;">URGENT SAMPLE - PRIORITY PROCESSING</div>' : '')
    + '<div style="border:1px solid #e2e8f0;border-top:none;padding:16px 20px;background:#f8fafc;display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    +   '<div><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">Patient Information</div><div style="font-size:15px;font-weight:800;">' + (patient?.name || '-') + '</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:#312e81;margin-top:4px;">' + (patient?.mrNumber || '-') + '</div><div style="font-size:12px;color:#64748b;margin-top:3px;">' + (patient?.age || '-') + ' yrs / ' + (patient?.gender || '-') + '</div></div>'
    +   '<div><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">Referred By</div><div style="font-size:14px;font-weight:700;">' + (doctor?.name || 'Reception') + '</div><div style="font-size:12px;color:#64748b;margin-top:3px;">' + (doctor?.department || 'General') + '</div><div style="font-size:11px;color:#94a3b8;margin-top:6px;">Status: <span style="font-weight:700;color:' + statusColor + ';">' + lab.status + '</span></div></div>'
    + '</div>'
    + '<div style="border:1px solid #e2e8f0;border-top:none;padding:14px 20px;background:white;"><div style="font-size:10px;font-weight:800;color:#312e81;text-transform:uppercase;margin-bottom:10px;">Tests Requested</div><div>' + testsHTML + '</div></div>'
    + '<div style="border:1px solid #e2e8f0;border-top:none;"><div style="padding:12px 20px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;"><div style="font-size:10px;font-weight:800;color:#312e81;text-transform:uppercase;">Test Results</div></div>'
    + '<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">'
    + '<th style="text-align:left;padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Test Name</th>'
    + '<th style="text-align:center;padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Result</th>'
    + '<th style="text-align:center;padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Normal Range</th>'
    + '<th style="text-align:center;padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Unit</th>'
    + '<th style="text-align:center;padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Flag</th>'
    + '</tr></thead><tbody>' + resultsHTML + '</tbody></table></div>'
    + '<div style="margin-top:16px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:14px 20px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">'
    +   '<div style="font-size:10px;color:#94a3b8;">Generated: ' + new Date().toLocaleString('en-PK') + '<br/>MMH Laboratory Information System</div>'
    +   '<div style="text-align:right;font-size:11px;color:#64748b;">Lab Technician Signature<br/><div style="margin-top:24px;border-top:1px solid #cbd5e1;padding-top:4px;min-width:150px;">___________________</div></div>'
    + '</div>'
    + '<div class="no-print" style="text-align:center;margin-top:20px;">'
    +   '<button onclick="window.print()" style="padding:12px 32px;background:#312e81;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Print Report</button>'
    +   '<button onclick="window.close()" style="padding:12px 24px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-left:10px;font-family:inherit;">Close</button>'
    + '</div>'
    + '</body></html>'
  );
  pw.document.close();
};

// --- Main Page -------------------------------------------------------
const LabPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
      <div className="mmh-page-tabs">
        <button className={`mmh-page-tab${tab === 0 ? ' active' : ''}`} onClick={() => setTab(0)}>
          <span>⏳</span> Pending Tests
        </button>
        <button className={`mmh-page-tab${tab === 1 ? ' active' : ''}`} onClick={() => setTab(1)}>
          <span>📝</span> Enter Results
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 28, boxSizing: 'border-box' }}>
        {tab === 0 && <PendingTab />}
        {tab === 1 && <ResultsTab />}
      </div>
    </div>
  );
};

// ─── TAB 1 — PENDING TESTS ─────────────────────────────────────────
const PendingTab: React.FC = () => {
  const [labs, setLabs] = useState<LabReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState<PatientResult | null>(null);
  const [resultsModal, setResultsModal] = useState<LabReq | null>(null);

  const fetchLabs = () => {
    setLoading(true);
    api.get('/labs')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setLabs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLabs(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setLabs(prev => prev.map(l => l._id === id ? { ...l, status: newStatus as LabReq['status'] } : l));
      await api.put(`/labs/${id}`, { status: newStatus });
    } catch {
      fetchLabs(); // Revert on error
    }
  };

  const filtered = labs.filter(l => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchPatient = !patientFilter || l.patient?._id === patientFilter._id;
    return matchStatus && matchPatient;
  });

  const countFor = (s: string) => s === 'all' ? labs.length : labs.filter(l => l.status === s).length;

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Lab Queue</h1>
          <p className="mmh-page-subtitle">{labs.filter(l => l.status === 'Pending').length} pending · {labs.filter(l => l.status === 'Processing').length} in progress</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchLabs}>🔄 Refresh</button>
      </div>

      {/* Status filter pills */}
      <div className="mmh-status-filters">
        {[
          { id: 'all',        label: 'All',         emoji: '📋' },
          { id: 'Pending',    label: 'Pending',      emoji: '⏳' },
          { id: 'Processing', label: 'In Progress',  emoji: '🔬' },
          { id: 'Done',       label: 'Done',         emoji: '✅' },
        ].map(s => (
          <button
            key={s.id}
            className={`mmh-status-filter-btn${statusFilter === s.id ? ` active-${s.id.toLowerCase()}` : ''}`}
            onClick={() => setStatusFilter(s.id)}
          >
            {s.emoji} {s.label}
            <span className="mmh-status-count">{countFor(s.id)}</span>
          </button>
        ))}
      </div>

      {/* Patient filter */}
      <div style={{ marginBottom: 20 }}>
        <PatientSearch
          label=""
          placeholder="Filter by patient name or MR number..."
          selectedPatient={patientFilter}
          onSelect={setPatientFilter}
          onClear={() => setPatientFilter(null)}
          required={false}
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="mmh-empty"><div className="mmh-empty-text">Loading lab requests...</div></div>
      ) : filtered.length === 0 ? (
        <div className="mmh-empty">
          <div className="mmh-empty-icon">🔬</div>
          <div className="mmh-empty-text">No lab requests found</div>
          <div className="mmh-empty-sub">Adjust filters or wait for new requests.</div>
        </div>
      ) : (
        <div className="mmh-lab-grid">
          {filtered.map(lab => {
            const td = lab.testDetails || [];
            const total = td.reduce((sum, t) => sum + t.price, 0);
            return (
              <div className="mmh-lab-card" key={lab._id}>
                <div className="mmh-lab-card-bar" style={{ background: CARD_ACCENT[lab.status] || CARD_ACCENT.Pending }} />
                <div className="mmh-lab-card-body">
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', fontWeight: 800, fontSize: 12 }}>
                      {lab.labId || `#${lab._id.slice(-6).toUpperCase()}`}
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {lab.isUrgent && <span className="mmh-badge mmh-badge-rose">🚨 URGENT</span>}
                      <span className={`mmh-badge ${
                        lab.status === 'Done' ? 'mmh-badge-green' :
                        lab.status === 'Processing' ? 'mmh-badge-sky' : 'mmh-badge-amber'
                      }`}>{lab.status}</span>
                    </div>
                  </div>

                  {/* Patient */}
                  <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: 14 }}>
                      {lab.patient?.name || 'Unknown Patient'}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#0ea5e9', marginTop: 2 }}>
                      {lab.patient?.mrNumber || '—'}
                    </div>
                    {lab.doctor && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Dr. {lab.doctor.name}
                      </div>
                    )}
                  </div>

                  {/* Tests */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {td.length > 0
                      ? td.map(t => (
                          <span key={t.name} className="mmh-test-price-tag">
                            {t.name} <span>PKR {t.price}</span>
                          </span>
                        ))
                      : lab.tests.map(t => (
                          <span key={t} className="mmh-test-tag">{t}</span>
                        ))
                    }
                  </div>

                  {/* Total */}
                  {total > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{td.length} tests · Total</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#34d399', fontSize: 13 }}>PKR {total.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Time */}
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    {lab.createdAt ? new Date(lab.createdAt).toLocaleString('en-PK') : '—'}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mmh-lab-card-footer">
                  {lab.status === 'Pending' && (
                    <button className="mmh-btn mmh-btn-amber mmh-btn-sm mmh-btn-full" onClick={() => updateStatus(lab._id, 'Processing')}>
                      ▶ Start Processing
                    </button>
                  )}
                  {lab.status === 'Processing' && (
                    <button className="mmh-btn mmh-btn-primary mmh-btn-sm mmh-btn-full" onClick={() => setResultsModal(lab)}>
                      📝 Enter Results
                    </button>
                  )}
                  {lab.status === 'Done' && (
                    <>
                      <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" style={{ flex: 1 }} onClick={() => setResultsModal(lab)}>
                        👁️ View Results
                      </button>
                      <button className="mmh-btn mmh-btn-green mmh-btn-sm" style={{ flex: 1 }} onClick={() => printLabReport(lab)}>
                        🖨️ Print
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Entry/View Modal */}
      {resultsModal && (
        <ResultsModal
          lab={resultsModal}
          onClose={() => setResultsModal(null)}
          onSaved={() => { setResultsModal(null); fetchLabs(); }}
        />
      )}
    </div>
  );
};

// ─── RESULTS ENTRY MODAL ────────────────────────────────────────────
interface ResultsModalProps {
  lab: LabReq;
  onClose: () => void;
  onSaved: () => void;
}
const ResultsModal: React.FC<ResultsModalProps> = ({ lab, onClose, onSaved }) => {
  const isDone = lab.status === 'Done';
  const [results, setResults] = useState<Record<string, { value: string; normalRange: string; unit: string; flag: Flag }>>(() => {
    const init: Record<string, { value: string; normalRange: string; unit: string; flag: Flag }> = {};
    // Pre-fill from existing results if any
    const existingMap: Record<string, LabResult> = {};
    (lab.results || []).forEach(r => { if (r.testName) existingMap[r.testName] = r; });
    lab.tests.forEach(t => {
      const ex = existingMap[t];
      init[t] = { value: ex?.value || '', normalRange: ex?.normalRange || '', unit: ex?.unit || '', flag: (ex?.flag as Flag) || 'Normal' };
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (test: string, field: 'value' | 'normalRange' | 'unit' | 'flag', val: string) => {
    setResults(r => ({ ...r, [test]: { ...r[test], [field]: val } }));
  };

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const resultsArr = lab.tests.map(t => ({
        testName: t,
        value: results[t]?.value || '',
        normalRange: results[t]?.normalRange || '',
        unit: results[t]?.unit || '',
        flag: results[t]?.flag || 'Normal',
      }));
      await api.put(`/labs/${lab._id}`, { results: resultsArr, status: 'Done' });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="mmh-results-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mmh-results-modal">
        {/* Header */}
        <div className="mmh-results-modal-header">
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>
              {isDone ? '👁️ View Results' : '📝 Enter Results'} — {lab.labId || lab._id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {lab.patient?.name} · {lab.patient?.mrNumber} · {lab.tests.length} tests
            </div>
          </div>
          <button className="mmh-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Patient info card */}
        <div style={{ padding: '14px 22px', background: 'rgba(14,165,233,0.04)', borderBottom: '1px solid #1e3050', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {(lab.patient?.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{lab.patient?.name || 'Unknown'}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#0ea5e9', marginTop: 2 }}>{lab.patient?.mrNumber}</div>
          </div>
          {lab.isUrgent && <span className="mmh-badge mmh-badge-rose">🚨 URGENT</span>}
          <span className={`mmh-badge ${lab.status === 'Done' ? 'mmh-badge-green' : 'mmh-badge-sky'}`}>{lab.status}</span>
        </div>

        {/* Body — results table */}
        <div className="mmh-results-modal-body">
          {error && <div className="mmh-banner-error" style={{ marginBottom: 14 }}>⚠️ {error}</div>}
          <div style={{ overflowX: 'auto' }}>
            <table className="mmh-results-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Test Name</th>
                  <th style={{ width: '20%' }}>Result Value</th>
                  <th style={{ width: '20%' }}>Normal Range</th>
                  <th style={{ width: '14%' }}>Unit</th>
                  <th style={{ width: '20%' }}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {lab.tests.map(test => {
                  const r = results[test] || { value: '', normalRange: '', unit: '', flag: 'Normal' as Flag };
                  const isCrit = r.flag === 'Critical';
                  return (
                    <tr key={test} className={isCrit ? 'mmh-row-critical' : ''} style={{ background: isCrit ? 'rgba(244,63,94,0.05)' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'white' }}>{test}</td>
                      <td>
                        <input className="mmh-result-input" placeholder="e.g. 5.2" value={r.value} disabled={isDone}
                          onChange={e => update(test, 'value', e.target.value)} />
                      </td>
                      <td>
                        <input className="mmh-result-input" placeholder="e.g. 4.5–6.0" value={r.normalRange} disabled={isDone}
                          onChange={e => update(test, 'normalRange', e.target.value)} />
                      </td>
                      <td>
                        <input className="mmh-result-input" placeholder="mg/dL" value={r.unit} disabled={isDone}
                          onChange={e => update(test, 'unit', e.target.value)} />
                      </td>
                      <td>
                        <select
                          className="mmh-flag-select"
                          value={r.flag}
                          disabled={isDone}
                          style={{ color: FLAG_COLORS[r.flag as Flag] || 'white' }}
                          onChange={e => update(test, 'flag', e.target.value)}
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
        </div>

        {/* Footer */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="mmh-btn mmh-btn-ghost" onClick={onClose}>
              {isDone ? 'Close' : 'Cancel'}
            </button>
            {isDone && (
              <button className="mmh-btn mmh-btn-green" onClick={() => printLabReport(lab)}>
                🖨️ Print Report
              </button>
            )}
            {!isDone && (
              <button className="mmh-btn mmh-btn-green" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : '📋 Save & Finalise'}
              </button>
            )}
          </div>
      </div>
    </div>
  );
};

// ─── TAB 2 — ENTER RESULTS ────────────────────────────────────────
const ResultsTab: React.FC = () => {
  const [labs, setLabs] = useState<LabReq[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [results, setResults] = useState<Record<string, { value: string; normalRange: string; unit: string; flag: Flag }>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/labs')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setLabs(data.filter((l: LabReq) => l.status !== 'Done'));
      })
      .catch(() => {});
  }, []);

  const selectedLab = labs.find(l => l._id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id); setSuccess(''); setError('');
    const lab = labs.find(l => l._id === id);
    if (!lab) return;
    const init: Record<string, { value: string; normalRange: string; unit: string; flag: Flag }> = {};
    lab.tests.forEach(t => { init[t] = { value: '', normalRange: '', unit: '', flag: 'Normal' }; });
    setResults(init);
  };

  const updateResult = (test: string, field: 'value' | 'normalRange' | 'unit' | 'flag', val: string) => {
    setResults(r => ({ ...r, [test]: { ...r[test], [field]: val } }));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const resultsArr = (selectedLab?.tests || []).map(t => ({
        testName: t,
        value: results[t]?.value || '',
        normalRange: results[t]?.normalRange || '',
        unit: results[t]?.unit || '',
        flag: results[t]?.flag || 'Normal',
      }));
      await api.put(`/labs/${selectedId}`, { results: resultsArr, status: 'Done' });
      setSuccess('Results saved and report finalised!');
      setSelectedId(''); setResults({});
      const r = await api.get('/labs');
      const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      setLabs(data.filter((l: LabReq) => l.status !== 'Done'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Enter Lab Results</h1>
          <p className="mmh-page-subtitle">Fill test values, ranges and flag abnormalities</p>
        </div>
      </div>
      {error   && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}

      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#8b5cf6,#0ea5e9)' }} />
        <div className="mmh-card-body">
          <div className="mmh-field">
            <label className="mmh-label">Select Lab Request <span className="mmh-required">*</span></label>
            <select className="mmh-input-select" value={selectedId} onChange={e => handleSelect(e.target.value)}>
              <option value="">— Select Pending/Processing Lab Request —</option>
              {labs.map(l => (
                <option key={l._id} value={l._id}>
                  {l.labId || l._id.slice(-6).toUpperCase()} — {l.patient?.name} ({(l.tests || []).join(', ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedLab && (
        <>
          <div className="mmh-patient-info-card">
            <div className="mmh-patient-info-avatar">
              {(selectedLab.patient?.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="mmh-patient-info-name">{selectedLab.patient?.name}</div>
              <div className="mmh-patient-info-meta">
                <span>Lab ID: {selectedLab.labId}</span>
                {selectedLab.isUrgent && <span style={{ color: '#fb7185', fontWeight: 700 }}>🚨 URGENT</span>}
                <span>Tests: {selectedLab.tests.length}</span>
              </div>
            </div>
          </div>

          <div className="mmh-card">
            <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
            <div className="mmh-card-header">
              <div className="mmh-card-title">📊 Test Results Entry</div>
              <div className="mmh-badge mmh-badge-amber">{selectedLab.tests.length} tests</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="mmh-results-table">
                <thead>
                  <tr>
                    <th style={{ width: '26%' }}>Test Name</th>
                    <th style={{ width: '20%' }}>Result Value</th>
                    <th style={{ width: '20%' }}>Normal Range</th>
                    <th style={{ width: '14%' }}>Unit</th>
                    <th style={{ width: '20%' }}>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLab.tests.map(test => {
                    const r = results[test] || { value: '', normalRange: '', unit: '', flag: 'Normal' as Flag };
                    const isCrit = r.flag === 'Critical';
                    return (
                      <tr key={test} className={isCrit ? 'mmh-row-critical' : ''}>
                        <td style={{ fontWeight: 600, color: 'white' }}>{test}</td>
                        <td><input className="mmh-result-input" placeholder="e.g. 5.2" value={r.value} onChange={e => updateResult(test, 'value', e.target.value)} /></td>
                        <td><input className="mmh-result-input" placeholder="e.g. 4.5–6.0" value={r.normalRange} onChange={e => updateResult(test, 'normalRange', e.target.value)} /></td>
                        <td><input className="mmh-result-input" placeholder="mg/dL" value={r.unit} onChange={e => updateResult(test, 'unit', e.target.value)} /></td>
                        <td>
                          <select
                            className={`mmh-flag-select mmh-flag-${r.flag.toLowerCase()}`}
                            value={r.flag}
                            style={{ color: FLAG_COLORS[r.flag as Flag] }}
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
            <div style={{ padding: '16px 20px', borderTop: '1px solid #1e3050', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
