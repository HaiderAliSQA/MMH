import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../../api';
import TypeSearch from '../../../components/TypeSearch';

const LEAVE_BADGE: Record<string,string> = { Pending:'mmh-badge-amber', Approved:'mmh-badge-green', Rejected:'mmh-badge-rose', Cancelled:'mmh-badge-gray' };
const LHC_CLASS: Record<string,string> = { Pending:'mmh-lhc-pending', Approved:'mmh-lhc-approved', Rejected:'mmh-lhc-rejected', Cancelled:'mmh-lhc-cancelled' };
const STATUS_OPTS = [
  { value:'', label:'All Statuses', icon:'📋' }, { value:'Pending', label:'Pending', icon:'⏳' },
  { value:'Approved', label:'Approved', icon:'✅' }, { value:'Rejected', label:'Rejected', icon:'❌' },
];
const LEAVE_TYPE_OPTS = [
  { value:'', label:'All Types', icon:'📃' }, { value:'Annual Leave', label:'Annual Leave', icon:'📅' },
  { value:'Sick Leave', label:'Sick Leave', icon:'🤒' }, { value:'Emergency Leave', label:'Emergency Leave', icon:'🚨' },
  { value:'Maternity Leave', label:'Maternity Leave', icon:'👶' }, { value:'Unpaid Leave', label:'Unpaid Leave', icon:'📝' },
];

const fmtDate = (d:string) => d ? new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const LeaveTab: React.FC<{ employees: any[] }> = ({ employees }) => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [banner, setBanner] = useState<{type:string;msg:string}|null>(null);

  useEffect(() => {
    loadLeaves();
    const interval = setInterval(loadLeaves, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try { const r = await hrAPI.getLeaves(); setLeaves(r.data || []); }
    catch {} finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    setBanner(null);
    try { await hrAPI.approveLeave(id); setBanner({type:'success',msg:'Leave approved!'}); loadLeaves(); }
    catch (e:any) { setBanner({type:'error',msg:e.response?.data?.message||'Failed'}); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setBanner(null);
    try { await hrAPI.rejectLeave(rejectModal._id, rejectReason); setBanner({type:'success',msg:'Leave rejected'}); setRejectModal(null); setRejectReason(''); loadLeaves(); }
    catch (e:any) { setBanner({type:'error',msg:e.response?.data?.message||'Failed'}); }
  };

  const stats = {
    pending: leaves.filter(l=>l.status==='Pending').length,
    approvedMonth: leaves.filter(l=>l.status==='Approved').length,
    rejected: leaves.filter(l=>l.status==='Rejected').length,
    onLeaveToday: 0,
  };

  const filtered = leaves.filter(l => {
    const matchStatus = !statusFilter || l.status===statusFilter;
    const matchType = !typeFilter || l.leaveType===typeFilter;
    const matchEmp = !empSearch || l.employee?.name?.toLowerCase().includes(empSearch.toLowerCase());
    return matchStatus && matchType && matchEmp;
  });

  return (
    <div>
      {banner && <div className={`mmh-banner-${banner.type}`} style={{marginBottom:16}}>{banner.type==='success'?'✅':'⚠️'} {banner.msg}</div>}

      <div className="mmh-stats-grid" style={{marginBottom:24}}>
        {[
          { label:'Pending', value:stats.pending, icon:'⏳', accent:'linear-gradient(90deg,#f59e0b,#fbbf24)' },
          { label:'Approved This Month', value:stats.approvedMonth, icon:'✅', accent:'linear-gradient(90deg,#10b981,#34d399)' },
          { label:'Rejected', value:stats.rejected, icon:'❌', accent:'linear-gradient(90deg,#f43f5e,#fb7185)' },
          { label:'On Leave Today', value:stats.onLeaveToday, icon:'🏖️', accent:'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{background:c.accent}} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value">{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mmh-card" style={{marginBottom:16,overflow:'visible'}}>
        <div className="mmh-card-body" style={{padding:'12px 16px',display:'flex',gap:12,flexWrap:'wrap',overflow:'visible'}}>
          <div style={{flex:1,minWidth:180}}>
            <input className="mmh-input" placeholder="🔍 Search employee..." value={empSearch} onChange={e=>setEmpSearch(e.target.value)} />
          </div>
          <div style={{width:180}}>
            <TypeSearch options={LEAVE_TYPE_OPTS} value={typeFilter} onChange={v=>setTypeFilter(v)} placeholder="Leave type..." />
          </div>
          <div style={{width:180}}>
            <TypeSearch options={STATUS_OPTS} value={statusFilter} onChange={v=>setStatusFilter(v)} placeholder="Status..." />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="mmh-loader" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mmh-empty" style={{ padding: '60px 20px', background: 'rgba(30,41,59,0.2)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.05)' }}>
          <div className="mmh-empty-icon" style={{ fontSize: 48, marginBottom: 16 }}>📃</div>
          <div className="mmh-empty-text" style={{ fontSize: 16, color: '#94a3b8' }}>No leave requests found matching criteria</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filtered.map(l => (
            <div key={l._id} className={`mmh-leave-card ${LHC_CLASS[l.status] || ''}`} style={{
              background: 'rgba(30,41,59,0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="mmh-card-status-line" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 4,
                height: '100%',
                background: l.status === 'Pending' ? '#f59e0b' : l.status === 'Approved' ? '#10b981' : l.status === 'Rejected' ? '#f43f5e' : '#64748b'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 18, 
                    fontWeight: 900, 
                    color: 'white', 
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                  }}>
                    {(l.employee?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: 15 }}>{l.employee?.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{l.employee?.department} · {l.employee?.employeeId}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="mmh-badge mmh-badge-sky" style={{ fontSize: 10, padding: '2px 8px' }}>{l.leaveType}</span>
                  <span className={`mmh-badge ${LEAVE_BADGE[l.status] || 'mmh-badge-gray'}`} style={{ fontSize: 10, padding: '2px 8px' }}>{l.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
                  <span style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>📅 {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Days</span>
                  <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 800 }}>{l.totalDays || 0} Day{(l.totalDays || 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {l.reason && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Reason</span>
                  <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic' }}>"{l.reason}"</div>
                </div>
              )}

              {l.substituteEmployee && (
                <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.1)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>🔄 Substitute Requirement</span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: l.substituteStatus === 'Accepted' ? '#10b981' : l.substituteStatus === 'Declined' ? '#f43f5e' : '#f59e0b' 
                    }}>
                      {l.substituteStatus || 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'white', marginTop: 4, fontWeight: 500 }}>{l.substituteEmployee?.name}</div>
                </div>
              )}

              {l.status === 'Rejected' && l.rejectedReason && (
                <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.08)', borderRadius: 12, border: '1px solid rgba(244,63,94,0.15)', marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: '#fb7185', fontWeight: 700, display: 'block', marginBottom: 2 }}>❌ Rejection Reason</span>
                  <div style={{ fontSize: 12, color: '#fda4af' }}>{l.rejectedReason}</div>
                </div>
              )}

              {l.status === 'Pending' && (
                <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10 }}>
                  <button 
                    className="mmh-btn mmh-btn-green mmh-btn-sm" 
                    style={{ flex: 1, height: 38, fontWeight: 700 }}
                    onClick={() => handleApprove(l._id)}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="mmh-btn mmh-btn-rose mmh-btn-sm" 
                    style={{ flex: 1, height: 38, fontWeight: 700 }}
                    onClick={() => { setRejectModal(l); setRejectReason(''); }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="mmh-overlay" onClick={e=>{if(e.target===e.currentTarget)setRejectModal(null)}}>
          <div className="mmh-modal mmh-modal-sm">
            <div className="mmh-modal-header">
              <div className="mmh-modal-title">Reject Leave — {rejectModal.employee?.name}</div>
              <button className="mmh-modal-close" onClick={()=>setRejectModal(null)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div className="mmh-field">
                <label className="mmh-label">Rejection Reason <span className="mmh-required">*</span></label>
                <textarea className="mmh-textarea" placeholder="Provide reason..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="mmh-modal-footer">
              <button className="mmh-btn mmh-btn-ghost" onClick={()=>setRejectModal(null)}>Cancel</button>
              <button className="mmh-btn mmh-btn-rose" onClick={handleReject} disabled={!rejectReason.trim()}>Reject Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTab;
