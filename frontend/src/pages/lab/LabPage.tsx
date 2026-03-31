import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import PatientSearch, { PatientResult } from '../../components/PatientSearch';
import MyLeaveTab from '../../components/MyLeaveTab';
import { useSearchParams } from 'react-router-dom';

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
  Pending:    'var(--mmh-warning)',
  Processing: 'var(--mmh-accent)',
  Done:       'var(--mmh-success)',
};

const FLAG_COLORS: Record<Flag, string> = {
  Normal:   'var(--mmh-success)',
  High:     'var(--mmh-warning)',
  Low:      'var(--mmh-warning)',
  Critical: 'var(--mmh-danger)',
};

// --- Print Lab Report (dedicated popup window) ----------------------
const printLabReport = (lab: LabReq) => {
  const pw = window.open('', '_blank', 'width=800,height=900');
  if (!pw) { alert('Please allow popups for printing'); return; }

  const patient = lab.patient as any;
  const doctor  = lab.doctor  as any;
  const labDate = new Date(lab.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const labTime = new Date(lab.createdAt || Date.now()).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const resultsHTML = lab.results && lab.results.length > 0
    ? lab.results.map(r => `
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 10px; font-weight: 700;">${r.testName || '-'}</td>
          <td style="padding: 10px; text-align: center; font-weight: 800; font-size: 14px;">${r.value || '-'}</td>
          <td style="padding: 10px; text-align: center;">${r.normalRange || '-'}</td>
          <td style="padding: 10px; text-align: center;">${r.unit || '-'}</td>
          <td style="padding: 10px; text-align: center; font-weight: 900;">
            ${r.flag === 'Normal' ? 'Normal' : `[ ${r.flag.toUpperCase()} ]`}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="padding: 30px; text-align: center; border: 1px solid #000;">Results pending or not available.</td></tr>';

  pw.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lab Report - ${lab.labId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000; background: #fff; padding: 20px; }
        .report-box { border: 2px solid #000; padding: 0; }
        .header { border-bottom: 2px solid #000; padding: 20px; display: flex; justify-content: space-between; }
        .hospital-name { font-size: 24px; font-weight: 900; text-transform: uppercase; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000; }
        .info-cell { padding: 15px; border-right: 1px solid #000; }
        .info-cell:last-child { border-right: none; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 900; color: #333; margin-bottom: 5px; }
        .val { font-size: 15px; font-weight: 700; }
        .results-table { width: 100%; border-collapse: collapse; }
        .results-table th { background: #eee; border-bottom: 2px solid #000; padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; }
        .footer { padding: 20px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #000; }
        .urgent-banner { background: #000; color: #fff; padding: 5px; text-align: center; font-weight: 900; font-size: 14px; margin-bottom: -2px; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
          .report-box { border: 1px solid #000; }
        }
      </style>
    </head>
    <body onload="window.focus();">
      <div class="report-box">
        ${lab.isUrgent ? '<div class="urgent-banner">URGENT - PRIORITY REPORT</div>' : ''}
        
        <div class="header">
          <div>
            <div class="hospital-name">Majida Memorial Hospital</div>
            <div style="font-size: 12px; font-weight: 600;">Diagnostic & Pathology Management System</div>
            <div style="font-size: 10px; margin-top: 5px;">Chiniot, Punjab, Pakistan</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 900; border: 2px solid #000; padding: 5px 10px; display: inline-block;">${lab.labId || '-'}</div>
            <div style="font-size: 11px; margin-top: 8px; font-weight: 700;">Report Date: ${labDate}</div>
            <div style="font-size: 11px; font-weight: 700;">Report Time: ${labTime}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-cell">
            <div class="label">Patient Name</div>
            <div class="val">${patient?.name || '-'}</div>
            <div style="font-size: 12px; margin-top: 4px;">MR#: <b>${patient?.mrNumber || '-'}</b></div>
            <div style="font-size: 12px;">Age/Gender: <b>${patient?.age || '-'}Y / ${patient?.gender || '-'}</b></div>
          </div>
          <div class="info-cell">
            <div class="label">Referred By</div>
            <div class="val">Dr. ${doctor?.name || 'Reception'}</div>
            <div style="font-size: 12px; margin-top: 4px;">Department: <b>${doctor?.department || 'General'}</b></div>
            <div style="font-size: 12px;">Report Status: <b>${lab.status?.toUpperCase() || '-'}</b></div>
          </div>
        </div>

        <div>
          <table class="results-table">
            <thead>
              <tr>
                <th style="text-align: left;">Test Name</th>
                <th style="text-align: center;">Result</th>
                <th style="text-align: center;">Normal Range</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Abnormal</th>
              </tr>
            </thead>
            <tbody>
              ${resultsHTML}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div style="font-size: 10px;">
            This is a computer generated diagnostic report.<br>
            Powered by MMH Patho-Connect.
          </div>
          <div style="text-align: center; min-width: 200px; border-top: 1px solid #000; padding-top: 8px;">
            <div style="font-size: 12px; font-weight: 800;">Authorized Signatory</div>
            <div style="font-size: 10px;">Lab In-charge / Technologist</div>
          </div>
        </div>
      </div>

      <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="padding: 15px 40px; font-size: 16px; font-weight: 800; background: #000; color: #fff; border: none; cursor: pointer; border-radius: 8px;">PRINT REPORT</button>
        <button onclick="window.close()" style="margin-left: 20px; padding: 15px 30px; font-size: 16px; font-weight: 800; background: #fff; color: #000; border: 2px solid #000; cursor: pointer; border-radius: 8px;">CLOSE</button>
      </div>
    </body>
    </html>
  `);
  pw.document.close();
};

// --- Main Page -------------------------------------------------------
const LabPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
      <div className="mmh-page-tabs">
        <button className={`mmh-page-tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setSearchParams({ tab: 'pending' })}>
          <span>⏳</span> Pending Tests
        </button>
        <button className={`mmh-page-tab${tab === 'results' ? ' active' : ''}`} onClick={() => setSearchParams({ tab: 'results' })}>
          <span>📝</span> Enter Results
        </button>
        <button className={`mmh-page-tab${tab === 'my-leave' ? ' active' : ''}`} onClick={() => setSearchParams({ tab: 'my-leave' })}>
          <span>🏖️</span> My Leave
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 28, boxSizing: 'border-box' }}>
        {tab === 'pending' && <PendingTab />}
        {tab === 'results' && <ResultsTab />}
        {tab === 'my-leave' && <MyLeaveTab />}
      </div>
    </div>
  );
};

// ─── TAB 1 — PENDING TESTS ─────────────────────────────────────────
const PendingTab: React.FC = () => {
  const [labs, setLabs] = useState<LabReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
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
    // Status Filter (handle 'today' and 'all' specially if needed, but here we treat 'today' as All statuses + Date check)
    const matchStatus = (statusFilter === 'all' || statusFilter === 'today') || l.status === statusFilter;
    const matchPatientSelection = !patientFilter || l.patient?._id === patientFilter._id;

    // Search Query (Name or MR Number)
    const search = searchQuery.toLowerCase().trim();
    const matchSearch = !search ||
      (l.patient?.name || '').toLowerCase().includes(search) ||
      (l.patient?.mrNumber || '').toLowerCase().includes(search) ||
      (l.labId || '').toLowerCase().includes(search);

    // Date Filter
    let matchDate = true;
    if (fromDate || toDate) {
      const createdAt = new Date(l.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) matchDate = false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(0, 0, 0, 0);
        if (createdAt > to) matchDate = false;
      }
    }

    return matchStatus && matchPatientSelection && matchSearch && matchDate;
  });

  const isTodayValue = fromDate === new Date().toISOString().split('T')[0] && toDate === new Date().toISOString().split('T')[0];

  const countFor = (s: string) => {
    const matchingStatus = labs.filter(l => {
      if (s === 'all' || s === 'today') return true;
      return l.status === s;
    });

    return matchingStatus.filter(l => {
      const search = searchQuery.toLowerCase().trim();
      const mSearch = !search || (l.patient?.name || '').toLowerCase().includes(search) || (l.patient?.mrNumber || '').toLowerCase().includes(search) || (l.labId || '').toLowerCase().includes(search);
      let mDate = true;
      
      let fDate = fromDate;
      let tDate = toDate;
      
      // If we are counting for 'today' pill specifically, override dates for the count
      if (s === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        fDate = todayStr;
        tDate = todayStr;
      }

      if (fDate || tDate) {
        const c = new Date(l.createdAt); c.setHours(0,0,0,0);
        if (fDate) { const f = new Date(fDate); f.setHours(0,0,0,0); if (c < f) mDate = false; }
        if (tDate) { const t = new Date(tDate); t.setHours(0,0,0,0); if (c > t) mDate = false; }
      }
      return mSearch && mDate;
    }).length;
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Lab Queue</h1>
          <p className="mmh-page-subtitle">
            {labs.filter(l => l.status === 'Pending').length} pending · {labs.filter(l => l.status === 'Processing').length} in progress
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="mmh-btn mmh-btn-ghost mmh-btn-sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setFromDate(today);
              setToDate(today);
              setSearchQuery('');
              setPatientFilter(null);
              setStatusFilter('all');
              fetchLabs();
            }}
          >
            🔄 Reset & Today
          </button>
          <button className="mmh-btn mmh-btn-primary mmh-btn-sm" onClick={fetchLabs}>🔄 Sync Data</button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="mmh-status-filters">
        {[
          { id: 'today',      label: 'Today',       emoji: '📅' },
          { id: 'Processing', label: 'In Progress',  emoji: '🔬' },
          { id: 'Pending',    label: 'Pending',      emoji: '⏳' },
          { id: 'Done',       label: 'Done',         emoji: '✅' },
          { id: 'all',        label: 'All',         emoji: '📋' },
        ].map(s => (
          <button
            key={s.id}
            className={`mmh-status-filter-btn${statusFilter === s.id ? ` active-${s.id.toLowerCase()}` : ''}`}
            onClick={() => {
              setStatusFilter(s.id);
              if (s.id === 'today') {
                const today = new Date().toISOString().split('T')[0];
                setFromDate(today);
                setToDate(today);
                setSearchQuery('');
              } else if (s.id === 'all') {
                setFromDate('');
                setToDate('');
              }
            }}
          >
            {s.emoji} {s.label}
            <span className="mmh-status-count">{countFor(s.id)}</span>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="mmh-card" style={{ marginBottom: 25 }}>
        <div className="mmh-card-body" style={{ padding: '15px 20px' }}>
          <div className="mmh-filter-row" style={{ gap: 15, alignItems: 'flex-end' }}>
            <div className="mmh-field" style={{ flex: 1, marginBottom: 0, minWidth: '200px' }}>
              <label className="mmh-label">Search Patient</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                <input
                  className="mmh-input"
                  style={{ paddingLeft: 35 }}
                  placeholder="Patient Name, MR# or Lab ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mmh-field" style={{ width: 'auto', marginBottom: 0 }}>
              <label className="mmh-label">From Date</label>
              <input type="date" className="mmh-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            <div className="mmh-field" style={{ width: 'auto', marginBottom: 0 }}>
              <label className="mmh-label">To Date</label>
              <input type="date" className="mmh-input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>

            <div style={{ paddingBottom: 2 }}>
               <button
                  className="mmh-btn mmh-btn-ghost mmh-btn-sm"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFromDate(today); setToDate(today);
                  }}
                  style={{ height: '38px', whiteSpace: 'nowrap' }}
               >
                 Today
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="mmh-empty"><div className="mmh-empty-text">Loading lab requests...</div></div>
      ) : filtered.length === 0 ? (
        <div className="mmh-empty">
          <div className="mmh-empty-icon">🔬</div>
          <div className="mmh-empty-text">
            {isTodayValue ? "No lab requests received for today." : "No lab records found for the selected filters."}
          </div>
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
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--mmh-info)', fontWeight: 800, fontSize: 12 }}>
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
                    <div style={{ fontWeight: 800, color: 'var(--mmh-text)', fontSize: 14 }}>
                      {lab.patient?.name || 'Unknown Patient'}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--mmh-accent)', marginTop: 2 }}>
                      {lab.patient?.mrNumber || '—'}
                    </div>
                    {lab.doctor && (
                      <div style={{ fontSize: 11, color: 'var(--mmh-text3)', marginTop: 2 }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--mmh-success-soft)', border: '1px solid var(--mmh-success-soft)', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--mmh-text3)' }}>{td.length} tests · Total</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: 'var(--mmh-success)', fontSize: 13 }}>PKR {total.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Time */}
                  <div style={{ fontSize: 11, color: 'var(--mmh-text3)' }}>
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
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--mmh-text)' }}>
              {isDone ? '👁️ View Results' : '📝 Enter Results'} — {lab.labId || lab._id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mmh-text3)', marginTop: 4 }}>
              {lab.patient?.name} · {lab.patient?.mrNumber} · {lab.tests.length} tests
            </div>
          </div>
          <button className="mmh-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Patient info card */}
        <div style={{ padding: '14px 22px', background: 'var(--mmh-bg2)', borderBottom: '1px solid var(--mmh-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--mmh-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {(lab.patient?.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--mmh-text)' }}>{lab.patient?.name || 'Unknown'}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--mmh-accent)', marginTop: 2 }}>{lab.patient?.mrNumber}</div>
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
                    <tr key={test} className={isCrit ? 'mmh-row-critical' : ''} style={{ background: isCrit ? 'var(--mmh-danger-soft)' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'var(--mmh-text)' }}>{test}</td>
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
                          style={{ color: FLAG_COLORS[r.flag as Flag] }}
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
                        <td style={{ fontWeight: 600, color: 'var(--mmh-text)' }}>{test}</td>
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
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--mmh-border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
