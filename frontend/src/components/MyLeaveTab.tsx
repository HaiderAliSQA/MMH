import React, { useState, useEffect } from 'react';
import api, { hrAPI } from '../api';
import TypeSearch from './TypeSearch';
import LeaveFileUpload from './LeaveFileUpload';

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
  document?: {
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { value: 'Annual Leave',    label: 'Annual Leave',    icon: '📅' },
  { value: 'Sick Leave',      label: 'Sick Leave',      icon: '🤒' },
  { value: 'Emergency Leave', label: 'Emergency Leave', icon: '🚨' },
  { value: 'Maternity Leave', label: 'Maternity Leave', icon: '👶' },
  { value: 'Unpaid Leave',    label: 'Unpaid Leave',    icon: '📝' },
];

const STATUS_OPTS = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcWorkingDays = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const a = new Date(from);
  const b = new Date(to);
  if (a > b) return 0;
  let days = 0;
  const cur = new Date(a);
  while (cur <= b) {
    days++;
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

const getFileIconByName = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png'].includes(ext || '')) return '🖼️';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  return '📎';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const MyLeaveTab: React.FC<{ userRole?: string }> = ({ userRole }) => {
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get my leave balance
      const balanceRes = await hrAPI.getMyBalance();
      setEmployee(balanceRes.data.data || balanceRes.data);

      // 2. Get my leaves
      const leavesRes = await hrAPI.getMyLeaves();
      setLeaves(leavesRes.data.data || leavesRes.data || []);

      // 3. Get all employees (only needed if doctor/substitute is needed)
      // Since we don't know the role reliably upfront, just get doctors if they might need it,
      // or just load all employees.
      const empRes = await hrAPI.getEmployees();
      setAllEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
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

    const annual = employee?.annualLeaveBalance ?? 24;
    const sick = employee?.sickLeaveBalance ?? 10;
    const emergency = employee?.emergencyLeaveBalance ?? 3;

    if (leaveType === 'Annual Leave' && days > annual) {
      setBanner({ type: 'error', msg: `Not enough Annual Leave balance. Remaining: ${annual}` });
      return;
    }
    if (leaveType === 'Sick Leave' && days > sick) {
      setBanner({ type: 'error', msg: `Not enough Sick Leave balance. Remaining: ${sick}` });
      return;
    }
    if (leaveType === 'Emergency Leave' && days > emergency) {
      setBanner({ type: 'error', msg: `Not enough Emergency Leave balance. Remaining: ${emergency}` });
      return;
    }
    setSubmitLoading(true);
    setBanner(null);
    try {
      const formData = new FormData();
      formData.append('leaveType', leaveType);
      formData.append('fromDate', fromDate);
      formData.append('toDate', toDate);
      formData.append('reason', reason);
      formData.append('totalDays', String(days));
      formData.append('needsSubstitute', String(needsSubstitute));
      if (needsSubstitute && substituteId) {
        formData.append('substituteEmployee', substituteId);
      }
      if (selectedFile) {
        formData.append('document', selectedFile);
      }

      await api.post('/hr/leaves', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBanner({ type: 'success', msg: `✅ Leave request submitted${selectedFile ? ' with document' : ''}! (${days} working day${days !== 1 ? 's' : ''})` });
      setLeaveType('');
      setFromDate('');
      setToDate('');
      setReason('');
      setNeedsSubstitute(false);
      setSubstituteId('');
      setSelectedFile(null);
      await loadData();
    } catch (err: any) {
      setBanner({ type: 'error', msg: err.response?.data?.message || 'Failed to submit leave request' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await hrAPI.cancelLeave(id);
      await loadData();
      setBanner({ type: 'success', msg: 'Leave request cancelled successfully' });
    } catch (err: any) {
      setBanner({ type: 'error', msg: err.response?.data?.message || 'Failed to cancel leave request' });
    }
  };

  const viewDocument = (leaveId: string) => {
    const token = localStorage.getItem('mmh_token');
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const url = `${apiUrl}/api/hr/leaves/${leaveId}/document?token=${token}`;
    window.open(url, '_blank');
  };

  const workingDays = Math.max(0, calcWorkingDays(fromDate, toDate));

  // Leave balance data
  const annual    = employee?.annualLeaveBalance ?? 24;
  const sick      = employee?.sickLeaveBalance ?? 10;
  const emergency = employee?.emergencyLeaveBalance ?? 3;

  const activeRole = userRole || employee?.role;
  // Substitute options (doctors only, exclude self)
  const substituteOpts = allEmployees
    .filter((e) => e._id !== employee?._id && e.role === 'doctor')
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

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      {/* Header */}
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">🏖️ My Leave</h1>
          <p className="mmh-page-subtitle">Track your leave balances and request time off.</p>
        </div>
      </div>

      {banner && (
        <div className={`mmh-banner-${banner.type}`} style={{ marginBottom: 16 }}>
          {banner.msg}
        </div>
      )}

      {/* ── Leave Balance Row ── */}
      <div className="mmh-leave-bal-row">
        <div className="mmh-leave-bal-card">
          <div className="mmh-lbc-number">{annual}</div>
          <div className="mmh-lbc-label">Annual Leave</div>
          <div className="mmh-lbc-bar-track">
            <div className={`mmh-lbc-bar-fill ${barColor(annual, 24)}`} style={{ width: `${Math.min(100, (annual / 24) * 100)}%` }} />
          </div>
          <div className="mmh-lbc-remaining">{annual} out of 24 remaining</div>
        </div>

        <div className="mmh-leave-bal-card">
          <div className="mmh-lbc-number">{sick}</div>
          <div className="mmh-lbc-label">Sick Leave</div>
          <div className="mmh-lbc-bar-track">
            <div className={`mmh-lbc-bar-fill ${barColor(sick, 10)}`} style={{ width: `${Math.min(100, (sick / 10) * 100)}%` }} />
          </div>
          <div className="mmh-lbc-remaining">{sick} out of 10 remaining</div>
        </div>

        <div className="mmh-leave-bal-card">
          <div className="mmh-lbc-number">{emergency}</div>
          <div className="mmh-lbc-label">Emergency Leave</div>
          <div className="mmh-lbc-bar-track">
            <div className={`mmh-lbc-bar-fill ${barColor(emergency, 3)}`} style={{ width: `${Math.min(100, (emergency / 3) * 100)}%` }} />
          </div>
          <div className="mmh-lbc-remaining">{emergency} out of 3 remaining</div>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="mmh-leave-2col">
        {/* LEFT — Apply Leave Form */}
        <div className="mmh-leave-form-card">
          <div className="mmh-leave-card-title">📝 Apply for Leave</div>
          
          <form onSubmit={handleSubmit}>
            <TypeSearch
              options={LEAVE_TYPES}
              value={leaveType}
              onChange={(v) => setLeaveType(v)}
              placeholder="Type to search leave type..."
              label="Leave Type"
              required
            />

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

            {fromDate && toDate && workingDays > 0 && (
              <div className="mmh-duration-box" style={{ marginTop: '16px' }}>
                📅 Duration: {workingDays} day{workingDays !== 1 ? 's' : ''} (includes Sundays)
              </div>
            )}

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

            <div className="mmh-field" style={{ marginTop: 16 }}>
              <label className="mmh-label">
                Supporting Document
                <span style={{
                  fontSize: '9px',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  marginLeft: '6px',
                  fontWeight: '500',
                  textTransform: 'none',
                  letterSpacing: '0',
                }}>
                  Optional
                </span>
              </label>
              <LeaveFileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>

            {/* Sub logic only for doctors */}
            {activeRole === 'doctor' && (
              <>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10 }}>
                  <input
                    id="needsSub"
                    type="checkbox"
                    checked={needsSubstitute}
                    onChange={(e) => { setNeedsSubstitute(e.target.checked); if (!e.target.checked) setSubstituteId(''); }}
                    style={{ width: 16, height: 16, accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <label htmlFor="needsSub" style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                    🔄 I need a substitute doctor
                  </label>
                </div>

                {needsSubstitute && (
                  <div style={{ marginTop: 12, overflow: 'visible' }}>
                    <TypeSearch
                      options={substituteOpts}
                      value={substituteId}
                      onChange={(v) => setSubstituteId(v)}
                      placeholder="Search substitute doctor..."
                      label="Substitute Doctor"
                      required={needsSubstitute}
                    />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, paddingLeft: 2 }}>
                      ℹ️ Admin will notify the substitute and confirm acceptance.
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="mmh-btn mmh-btn-primary mmh-btn-full"
              style={{ marginTop: 20 }}
              disabled={submitLoading}
            >
              {submitLoading ? '⏳ Submitting...' : '📤 Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* RIGHT — Leave History */}
        <div className="mmh-leave-hist-card">
          <div className="mmh-leave-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📋 Leave History</span>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{leaves.length} requests</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', overflow: 'visible' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <input
                className="mmh-input"
                placeholder="🔍 Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div style={{ width: 140, overflow: 'visible' }}>
              <TypeSearch
                options={STATUS_OPTS}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="Filter status..."
              />
            </div>
          </div>

          <div>
            {filteredLeaves.length === 0 ? (
              <div className="mmh-empty" style={{ padding: '30px 0' }}>
                <div className="mmh-empty-icon">📃</div>
                <div className="mmh-empty-text">No leave requests found</div>
              </div>
            ) : (
              filteredLeaves.map((l) => (
                <div key={l._id} className={`mmh-lhc mmh-lhc-${l.status?.toLowerCase() || 'pending'}`}>
                  <div className="mmh-lhc-top">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="mmh-badge mmh-badge-sky">{l.leaveType}</span>
                      <span className={`mmh-badge ${STATUS_BADGE[l.status] || 'mmh-badge-gray'}`}>{l.status}</span>
                    </div>
                  </div>
                  
                  <div className="mmh-lhc-dates">
                    {fmtDate(l.fromDate)} → {fmtDate(l.toDate)} 
                    <strong style={{ marginLeft: 6 }}>({l.totalDays || calcWorkingDays(l.fromDate, l.toDate)}d)</strong>
                  </div>
                  
                  {l.reason && <div className="mmh-lhc-reason">{l.reason}</div>}

                  {l.needsSubstitute && l.substituteEmployee && (
                    <div className="mmh-lhc-substitute">
                      🔄 Sub: {l.substituteEmployee.name}
                      {l.substituteStatus && (
                        <span style={{ color: l.substituteStatus === 'Accepted' ? '#34d399' : l.substituteStatus === 'Declined' ? '#fb7185' : '#fbbf24' }}>
                          ({l.substituteStatus})
                        </span>
                      )}
                    </div>
                  )}

                  {l.status === 'Rejected' && l.rejectedReason && (
                    <div className="mmh-lhc-reject-reason">
                      ❌ {l.rejectedReason}
                    </div>
                  )}

                  {l.document && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Supporting Document</div>
                      <div className="mmh-attachment-card" onClick={() => viewDocument(l._id)}>
                        <div className="mmh-attachment-icon">{getFileIconByName(l.document.originalName)}</div>
                        <div className="mmh-attachment-info">
                          <div className="mmh-attachment-name">{l.document.originalName}</div>
                          <div className="mmh-attachment-meta">{formatFileSize(l.document.fileSize)}</div>
                        </div>
                        <div className="mmh-attachment-actions">
                          <span style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 800 }}>VIEW ↗</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {l.status === 'Pending' && (
                    <button 
                      className="mmh-lhc-cancel-btn"
                      onClick={() => handleCancel(l._id)}
                    >
                      Cancel Leave
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLeaveTab;
