import React, { useState, useEffect } from 'react';
import { hrAPI } from '../api';
import TypeSearch from './TypeSearch';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  _id: string;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  annualLeaveBalance: number;
  sickLeaveBalance?: number;
  emergencyLeaveBalance?: number;
  user?: { _id: string; email: string };
}

interface LeaveRecord {
  _id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectedReason?: string;
  needsSubstitute: boolean;
  substituteEmployee?: { _id: string; name: string; employeeId: string };
  substituteStatus?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAVE_TYPES: { value: string; label: string; icon: string }[] = [
  { value: 'Annual',    label: 'Annual Leave',    icon: '📅' },
  { value: 'Sick',      label: 'Sick Leave',      icon: '🤒' },
  { value: 'Emergency', label: 'Emergency Leave', icon: '🚨' },
  { value: 'Maternity', label: 'Maternity Leave', icon: '👶' },
  { value: 'Unpaid',    label: 'Unpaid Leave',    icon: '📝' },
];

const STATUS_OPTS: { value: string; label: string; icon: string }[] = [
  { value: '',          label: 'All Statuses', icon: '📋' },
  { value: 'Pending',   label: 'Pending',      icon: '⏳' },
  { value: 'Approved',  label: 'Approved',     icon: '✅' },
  { value: 'Rejected',  label: 'Rejected',     icon: '❌' },
  { value: 'Cancelled', label: 'Cancelled',    icon: '🚫' },
];

const STATUS_BADGE: Record<string, string> = {
  Pending: 'mmh-badge-amber', Approved: 'mmh-badge-green',
  Rejected: 'mmh-badge-rose', Cancelled: 'mmh-badge-gray',
};

const LHC_CLASS: Record<string, string> = {
  Pending: 'mmh-lhc-pending', Approved: 'mmh-lhc-approved',
  Rejected: 'mmh-lhc-rejected', Cancelled: 'mmh-lhc-cancelled',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcWorkingDays = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const a = new Date(from);
  const b = new Date(to);
  if (a > b) return 0;
  let days = 0;
  const cur = new Date(a);
  while (cur <= b) {
    if (cur.getDay() !== 0) days++; // exclude Sunday
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const barColor = (remaining: number, total: number): string => {
  if (total <= 0) return 'mmh-lbf-red';
  const pct = remaining / total;
  if (pct > 0.5) return 'mmh-lbf-green';
  if (pct >= 0.25) return 'mmh-lbf-amber';
  return 'mmh-lbf-red';
};

const fmtDate = (d: string): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Component ────────────────────────────────────────────────────────────────
const MyLeaveTab: React.FC = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: string; msg: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Form
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [needsSubstitute, setNeedsSubstitute] = useState(false);
  const [substituteId, setSubstituteId] = useState('');

  // Today's date string for min date
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(
        localStorage.getItem('mmh_user') || localStorage.getItem('user') || '{}'
      );
      const empRes = await hrAPI.getEmployees();
      const emps: Employee[] = empRes.data || [];
      setAllEmployees(emps);

      const myEmp = emps.find(
        (e) => e.user?._id === user._id || e.user?.email === user.email
      );
      if (myEmp) {
        setEmployee(myEmp);
        const leavesRes = await hrAPI.getLeaves();
        const allLeaves: LeaveRecord[] = leavesRes.data || [];
        const myLeaves = allLeaves.filter(
          (l: any) => l.employee?._id === myEmp._id || l.employee === myEmp._id
        );
        setLeaves(myLeaves);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !leaveType || !fromDate || !toDate || !reason.trim()) {
      setBanner({ type: 'error', msg: 'Please fill all required fields' });
      return;
    }
    if (needsSubstitute && !substituteId) {
      setBanner({ type: 'error', msg: 'Please select a substitute employee' });
      return;
    }
    const days = calcWorkingDays(fromDate, toDate);
    if (days === 0) {
      setBanner({ type: 'error', msg: 'Invalid date range — no working days selected' });
      return;
    }
    setSubmitLoading(true);
    setBanner(null);
    try {
      await hrAPI.applyLeave({
        employee: employee._id,
        leaveType,
        fromDate,
        toDate,
        reason,
        totalDays: days,
        needsSubstitute,
        substituteEmployee: needsSubstitute ? substituteId : undefined,
      });
      setBanner({ type: 'success', msg: `✅ Leave request submitted! (${days} working day${days !== 1 ? 's' : ''})` });
      setLeaveType('');
      setFromDate('');
      setToDate('');
      setReason('');
      setNeedsSubstitute(false);
      setSubstituteId('');
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', msg: err.response?.data?.message || 'Failed to submit leave request' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const workingDays = calcWorkingDays(fromDate, toDate);

  // Leave balance data
  const annual    = employee?.annualLeaveBalance ?? 0;
  const sick      = employee?.sickLeaveBalance ?? 10;
  const emergency = employee?.emergencyLeaveBalance ?? 3;
  const usedDays  = leaves
    .filter((l) => l.status === 'Approved')
    .reduce((s, l) => s + (l.totalDays || 0), 0);

  // Substitute options (exclude self)
  const substituteOpts = allEmployees
    .filter((e) => e._id !== employee?._id)
    .map((e) => ({ value: e._id, label: `${e.name} — ${e.employeeId}`, sub: e.department }));

  // Filtered history
  const filteredLeaves = leaves.filter((l) => {
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchSearch = !searchFilter ||
      l.leaveType?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <div className="mmh-loader" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="mmh-empty">
        <div className="mmh-empty-icon">🏖️</div>
        <div className="mmh-empty-text">No Employee Profile Found</div>
        <div className="mmh-empty-sub">Contact admin to set up your employee profile.</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      {/* Header */}
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">🏖️ My Leave</h1>
          <p className="mmh-page-subtitle">{employee.name} · {employee.department} · {employee.employeeId}</p>
        </div>
      </div>

      {banner && (
        <div className={`mmh-banner-${banner.type}`} style={{ marginBottom: 16 }}>
          {banner.msg}
        </div>
      )}

      {/* ── Leave Balance Stats ── */}
      <div className="mmh-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Annual Leave', remaining: annual, total: 24, icon: '📅', accent: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
          { label: 'Sick Leave',   remaining: sick,   total: 10, icon: '🤒', accent: 'linear-gradient(90deg,#10b981,#34d399)' },
          { label: 'Emergency',    remaining: emergency, total: 3, icon: '🚨', accent: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
          { label: 'Used This Year', remaining: usedDays, total: usedDays || 1, icon: '📊', accent: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', noBar: true },
        ].map((c) => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{ background: c.accent }} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value" style={{ fontSize: 18 }}>
              {c.label === 'Used This Year' ? `${c.remaining} days` : `${c.remaining}/${c.total}`}
            </span>
            <span className="mmh-stat-label">{c.label}</span>
            {!c.noBar && (
              <div className="mmh-leave-bal-track" style={{ marginTop: 8 }}>
                <div
                  className={`mmh-leave-bal-fill ${barColor(c.remaining, c.total)}`}
                  style={{ width: `${Math.min(100, (c.remaining / c.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="mmh-hr-two-col">
        {/* LEFT — Apply Leave Form */}
        <div className="mmh-card" style={{ overflow: 'visible' }}>
          <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
          <div className="mmh-card-header">
            <div className="mmh-card-title">📝 Apply for Leave</div>
          </div>
          <div className="mmh-card-body" style={{ overflow: 'visible' }}>
            <form onSubmit={handleSubmit}>

              {/* Leave Type — TypeSearch */}
              <TypeSearch
                options={LEAVE_TYPES}
                value={leaveType}
                onChange={(v) => setLeaveType(v)}
                placeholder="Type to search leave type..."
                label="Leave Type"
                required
              />

              {/* From / To dates */}
              <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="mmh-field">
                  <label className="mmh-label">From Date <span className="mmh-required">*</span></label>
                  <input
                    type="date"
                    className="mmh-input"
                    min={todayStr}
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); if (toDate && e.target.value > toDate) setToDate(''); }}
                    required
                  />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">To Date <span className="mmh-required">*</span></label>
                  <input
                    type="date"
                    className="mmh-input"
                    min={fromDate || todayStr}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Duration pill */}
              {fromDate && toDate && workingDays > 0 && (
                <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 13, color: '#34d399', fontWeight: 700 }}>
                  📅 Duration: {workingDays} working day{workingDays !== 1 ? 's' : ''}
                </div>
              )}

              {/* Reason */}
              <div className="mmh-field" style={{ marginTop: 16 }}>
                <label className="mmh-label">Reason <span className="mmh-required">*</span></label>
                <textarea
                  className="mmh-textarea"
                  placeholder="Describe reason for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              {/* Needs Substitute toggle */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10 }}>
                <input
                  id="needsSub"
                  type="checkbox"
                  checked={needsSubstitute}
                  onChange={(e) => { setNeedsSubstitute(e.target.checked); if (!e.target.checked) setSubstituteId(''); }}
                  style={{ width: 16, height: 16, accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
                <label htmlFor="needsSub" style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  🔄 I need a substitute employee during my absence
                </label>
              </div>

              {/* Substitute selection — TypeSearch */}
              {needsSubstitute && (
                <div style={{ marginTop: 12, overflow: 'visible' }}>
                  <TypeSearch
                    options={substituteOpts}
                    value={substituteId}
                    onChange={(v) => setSubstituteId(v)}
                    placeholder="Search substitute employee..."
                    label="Substitute Employee"
                    required={needsSubstitute}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, paddingLeft: 2 }}>
                    ℹ️ Admin will notify the substitute and confirm acceptance.
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="mmh-btn mmh-btn-primary"
                style={{ width: '100%', marginTop: 20 }}
                disabled={submitLoading}
              >
                {submitLoading ? '⏳ Submitting...' : '📤 Submit Leave Request'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — Leave History */}
        <div className="mmh-card">
          <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }} />
          <div className="mmh-card-header">
            <div className="mmh-card-title">📋 Leave History</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{leaves.length} request{leaves.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="mmh-card-body" style={{ overflow: 'visible' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', overflow: 'visible' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <input
                  className="mmh-input"
                  placeholder="🔍 Search by type or reason..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              <div style={{ width: 165, overflow: 'visible' }}>
                <TypeSearch
                  options={STATUS_OPTS}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                  placeholder="Filter status..."
                />
              </div>
            </div>

            {/* Leave Cards */}
            <div style={{ maxHeight: 440, overflowY: 'auto', overflowX: 'visible' }}>
              {filteredLeaves.length === 0 ? (
                <div className="mmh-empty" style={{ padding: '30px 0' }}>
                  <div className="mmh-empty-icon">📃</div>
                  <div className="mmh-empty-text">No leave requests found</div>
                </div>
              ) : (
                filteredLeaves.map((l) => (
                  <div key={l._id} className={`mmh-leave-history-card ${LHC_CLASS[l.status] || ''}`}>
                    {/* Top row — type + status + dates */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="mmh-badge mmh-badge-sky">{l.leaveType}</span>
                        <span className={`mmh-badge ${STATUS_BADGE[l.status] || 'mmh-badge-gray'}`}>{l.status}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                      </span>
                    </div>

                    {/* Duration + reason */}
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                      <strong style={{ color: '#cbd5e1' }}>
                        {l.totalDays || calcWorkingDays(l.fromDate, l.toDate)} day{(l.totalDays || 1) !== 1 ? 's' : ''}
                      </strong>
                      {l.reason && ` · ${l.reason.slice(0, 70)}${l.reason.length > 70 ? '...' : ''}`}
                    </div>

                    {/* Substitute info */}
                    {l.needsSubstitute && (
                      <div style={{ fontSize: 11, marginTop: 6, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🔄 Substitute:</span>
                        <span style={{ fontWeight: 700 }}>{l.substituteEmployee?.name || 'Requested'}</span>
                        {l.substituteStatus && (
                          <span style={{ color: l.substituteStatus === 'Accepted' ? '#34d399' : l.substituteStatus === 'Declined' ? '#fb7185' : '#fbbf24' }}>
                            — {l.substituteStatus}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {l.status === 'Rejected' && l.rejectedReason && (
                      <div style={{ fontSize: 11, color: '#fb7185', marginTop: 6, padding: '6px 10px', background: 'rgba(244,63,94,0.06)', borderRadius: 6 }}>
                        ❌ Reason: {l.rejectedReason}
                      </div>
                    )}

                    {/* Cancel — pending only */}
                    {l.status === 'Pending' && (
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <span style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
                          Awaiting admin review
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLeaveTab;
