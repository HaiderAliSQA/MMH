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
  { value:'', label:'All Types', icon:'📃' }, { value:'Annual', label:'Annual', icon:'📅' },
  { value:'Sick', label:'Sick', icon:'🤒' }, { value:'Emergency', label:'Emergency', icon:'🚨' },
  { value:'Maternity', label:'Maternity', icon:'👶' }, { value:'Unpaid', label:'Unpaid', icon:'📝' },
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
        <div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}><div className="mmh-loader" /></div>
      ) : filtered.length === 0 ? (
        <div className="mmh-empty"><div className="mmh-empty-icon">📃</div><div className="mmh-empty-text">No leave requests found</div></div>
      ) : (
        <div style={{display:'grid',gap:12}}>
          {filtered.map(l => (
            <div key={l._id} className={`mmh-leave-history-card ${LHC_CLASS[l.status]||''}`}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'white',flexShrink:0}}>
                    {(l.employee?.name||'?').charAt(0)}
                  </div>
                  <div>
                    <div style={{fontWeight:700,color:'white',fontSize:14}}>{l.employee?.name}</div>
                    <div style={{fontSize:12,color:'#64748b'}}>{l.employee?.department} · {l.employee?.employeeId}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span className="mmh-badge mmh-badge-sky">{l.leaveType}</span>
                  <span className={`mmh-badge ${LEAVE_BADGE[l.status]||'mmh-badge-gray'}`}>{l.status}</span>
                </div>
              </div>
              <div style={{marginTop:10,display:'flex',gap:24,fontSize:12,color:'#94a3b8',flexWrap:'wrap'}}>
                <span>📅 {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}</span>
                <span>📊 {l.totalDays || 0} day{(l.totalDays||0)!==1?'s':''}</span>
              </div>
              {l.reason && <div style={{marginTop:6,fontSize:12,color:'#cbd5e1',lineHeight:1.5}}>💬 {l.reason}</div>}
              {l.substituteEmployee && (
                <div style={{marginTop:6,fontSize:11,color:'#a78bfa'}}>🔄 Substitute: {l.substituteEmployee?.name||'—'} — {l.substituteStatus||'Pending'}</div>
              )}
              {l.status === 'Rejected' && l.rejectedReason && (
                <div style={{marginTop:6,fontSize:11,color:'#fb7185'}}>❌ Reason: {l.rejectedReason}</div>
              )}
              {l.status === 'Pending' && (
                <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button className="mmh-btn mmh-btn-green mmh-btn-sm" onClick={()=>handleApprove(l._id)}>✅ Approve</button>
                  <button className="mmh-btn mmh-btn-rose mmh-btn-sm" onClick={()=>{setRejectModal(l);setRejectReason('')}}>❌ Reject</button>
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
