import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../../api';
import TypeSearch from '../../../components/TypeSearch';

const STATUSES = ['Present','Absent','Late','Half-Day','On-Leave','Holiday','Off'];
const STATUS_COLOR: Record<string,string> = { Present:'#34d399', Absent:'#fb7185', Late:'#fbbf24', 'Half-Day':'#38bdf8', 'On-Leave':'#a78bfa', Holiday:'#64748b', Off:'#475569' };
const STATUS_BADGE: Record<string,string> = { Present:'mmh-badge-green', Absent:'mmh-badge-rose', Late:'mmh-badge-amber', 'Half-Day':'mmh-badge-sky', 'On-Leave':'mmh-badge-violet', Holiday:'mmh-badge-gray', Off:'mmh-badge-gray' };
const CAL_CLASS: Record<string,string> = { Present:'mmh-att-cal-P', Absent:'mmh-att-cal-A', Late:'mmh-att-cal-L', 'Half-Day':'mmh-att-cal-H', 'On-Leave':'mmh-att-cal-L', Holiday:'mmh-att-cal-O', Off:'mmh-att-cal-O' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const AttendanceTab: React.FC<{ employees: any[] }> = ({ employees }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'daily'|'monthly'>('daily');
  const [empFilter, setEmpFilter] = useState('');
  const [markRow, setMarkRow] = useState<string|null>(null);
  const [markForm, setMarkForm] = useState({ status:'Present', checkIn:'', checkOut:'', overtimeHours:0, notes:'' });
  const [banner, setBanner] = useState<{type:string;msg:string}|null>(null);
  const [monthEmp, setMonthEmp] = useState('');
  const [monthNum, setMonthNum] = useState(new Date().getMonth()+1);
  const [yearNum, setYearNum] = useState(new Date().getFullYear());
  const [monthData, setMonthData] = useState<any[]>([]);

  useEffect(() => { if(view==='daily') loadDaily(); }, [date, view]);

  const loadDaily = async () => {
    setLoading(true);
    try {
      const r = await hrAPI.getAttendance(date);
      setRecords(r.data?.records || []);
      setSummary(r.data?.summary || []);
    } catch { } finally { setLoading(false); }
  };

  const countStatus = (s: string) => {
    const found = summary.find((x: any) => x._id === s);
    return found?.count || 0;
  };

  const filteredRecords = records.filter(r => {
    if (!empFilter) return true;
    const q = empFilter.toLowerCase();
    return r.employee?.name?.toLowerCase().includes(q) || r.employee?.employeeId?.toLowerCase().includes(q);
  });

  const handleMark = async (employeeId: string) => {
    setBanner(null);
    try {
      await hrAPI.markAttendance({ employee: employeeId, date, ...markForm });
      setBanner({ type:'success', msg:'Attendance marked!' });
      setMarkRow(null);
      loadDaily();
    } catch (err:any) { setBanner({ type:'error', msg: err.response?.data?.message || 'Failed' }); }
  };

  const handleBulkPresent = async () => {
    setBanner(null);
    try {
      const recs = employees.map(e => ({ employee: e._id, status: 'Present' }));
      await hrAPI.bulkAttendance({ date, records: recs });
      setBanner({ type:'success', msg:`Marked ${recs.length} employees present` });
      loadDaily();
    } catch (err:any) { setBanner({ type:'error', msg:'Bulk mark failed' }); }
  };

  const loadMonthly = async () => {
    if (!monthEmp) return;
    try {
      const r = await hrAPI.getAttendanceRange({ employee: monthEmp, from: `${yearNum}-${String(monthNum).padStart(2,'0')}-01`, to: `${yearNum}-${String(monthNum).padStart(2,'0')}-31` });
      setMonthData(r.data || []);
    } catch { setMonthData([]); }
  };

  useEffect(() => { if(view==='monthly' && monthEmp) loadMonthly(); }, [monthEmp, monthNum, yearNum, view]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  // Calendar grid for monthly view
  const renderCalendar = () => {
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const firstDay = new Date(yearNum, monthNum-1, 1).getDay();
    const attMap: Record<string,string> = {};
    monthData.forEach((a:any) => {
      const d = new Date(a.date).getDate();
      attMap[d] = a.status;
    });
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const st = attMap[d] || '';
      const cls = st ? CAL_CLASS[st] || '' : '';
      const isSunday = new Date(yearNum, monthNum-1, d).getDay() === 0;
      cells.push(
        <div key={d} className={`mmh-att-cal-day ${cls || (isSunday ? 'mmh-att-cal-O' : '')}`}>
          <span style={{fontSize:10,opacity:0.7}}>{d}</span>
          <span style={{fontSize:9,fontWeight:800}}>{st ? st.charAt(0) : (isSunday ? 'O' : '—')}</span>
        </div>
      );
    }
    const monthlySummary = { P:0, A:0, L:0, H:0, OT:0 };
    monthData.forEach((a:any) => {
      if(a.status==='Present') monthlySummary.P++;
      else if(a.status==='Absent') monthlySummary.A++;
      else if(a.status==='Late') monthlySummary.L++;
      else if(a.status==='Half-Day') monthlySummary.H++;
      monthlySummary.OT += a.overtimeHours || 0;
    });
    return { cells, monthlySummary };
  };

  const empOptions = employees.map(e => ({ value: e._id, label: `${e.name} — ${e.employeeId}`, sub: e.department }));

  return (
    <div>
      {banner && <div className={`mmh-banner-${banner.type}`} style={{marginBottom:16}}>{banner.type==='success'?'✅':'⚠️'} {banner.msg}</div>}

      <div className="mmh-stats-grid" style={{marginBottom:24}}>
        {[
          { label:'Present', value:countStatus('Present'), icon:'✅', accent:'linear-gradient(90deg,#10b981,#34d399)' },
          { label:'Absent', value:countStatus('Absent'), icon:'❌', accent:'linear-gradient(90deg,#f43f5e,#fb7185)' },
          { label:'Late', value:countStatus('Late'), icon:'⏰', accent:'linear-gradient(90deg,#f59e0b,#fbbf24)' },
          { label:'On Leave', value:countStatus('On-Leave'), icon:'🏖️', accent:'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{background:c.accent}} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value">{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={()=>changeDate(-1)}>← Prev</button>
        <input type="date" className="mmh-input" style={{width:180}} value={date} onChange={e=>setDate(e.target.value)} />
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={()=>changeDate(1)}>Next →</button>
        <div style={{flex:1}} />
        <div style={{display:'flex',gap:4}}>
          <button className={`mmh-btn mmh-btn-sm ${view==='daily'?'mmh-btn-primary':'mmh-btn-ghost'}`} onClick={()=>setView('daily')}>Daily View</button>
          <button className={`mmh-btn mmh-btn-sm ${view==='monthly'?'mmh-btn-primary':'mmh-btn-ghost'}`} onClick={()=>setView('monthly')}>Monthly View</button>
        </div>
        {view==='daily' && <button className="mmh-btn mmh-btn-amber mmh-btn-sm" onClick={handleBulkPresent}>✅ Mark All Present</button>}
      </div>

      {view === 'daily' ? (
        <>
          <div style={{marginBottom:16}}>
            <input className="mmh-input" placeholder="🔍 Filter by employee name or ID..." value={empFilter} onChange={e=>setEmpFilter(e.target.value)} />
          </div>
          <div className="mmh-card">
            <div className="mmh-card-body" style={{padding:0}}>
              <div className="mmh-table-scroll">
                <table className="mmh-table">
                  <thead><tr><th>Employee</th><th>Role</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>OT</th><th>Notes</th><th>Mark</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} className="mmh-empty">Loading...</td></tr> :
                    filteredRecords.length === 0 ? <tr><td colSpan={8} className="mmh-empty">No records for this date</td></tr> :
                    filteredRecords.map(r => (
                      <React.Fragment key={r._id}>
                        <tr>
                          <td><div style={{fontWeight:700,color:'white',fontSize:13}}>{r.employee?.name}</div><div style={{fontSize:11,color:'#64748b'}}>{r.employee?.employeeId}</div></td>
                          <td style={{fontSize:12}}>{r.employee?.role}</td>
                          <td style={{fontSize:12,fontFamily:'JetBrains Mono,monospace'}}>{r.checkIn||'—'}</td>
                          <td style={{fontSize:12,fontFamily:'JetBrains Mono,monospace'}}>{r.checkOut||'—'}</td>
                          <td><span className={`mmh-badge ${STATUS_BADGE[r.status]||'mmh-badge-gray'}`}>{r.status}</span></td>
                          <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{r.overtimeHours||0}h</td>
                          <td style={{fontSize:11,color:'#94a3b8',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{r.notes||'—'}</td>
                          <td><button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={()=>{ setMarkRow(markRow===r.employee?._id?null:r.employee?._id); setMarkForm({status:r.status||'Present',checkIn:r.checkIn||'',checkOut:r.checkOut||'',overtimeHours:r.overtimeHours||0,notes:r.notes||''}); }}>✏️</button></td>
                        </tr>
                        {markRow === r.employee?._id && (
                          <tr><td colSpan={8} style={{background:'#0a1628',padding:12}}>
                            <div style={{display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
                              <div className="mmh-field" style={{width:140}}>
                                <label className="mmh-label" style={{fontSize:10}}>Status</label>
                                <select className="mmh-input-select" value={markForm.status} onChange={e=>setMarkForm({...markForm,status:e.target.value})} style={{height:38,fontSize:12}}>
                                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div className="mmh-field" style={{width:110}}><label className="mmh-label" style={{fontSize:10}}>Check-in</label><input type="time" className="mmh-input" style={{height:38,fontSize:12}} value={markForm.checkIn} onChange={e=>setMarkForm({...markForm,checkIn:e.target.value})} /></div>
                              <div className="mmh-field" style={{width:110}}><label className="mmh-label" style={{fontSize:10}}>Check-out</label><input type="time" className="mmh-input" style={{height:38,fontSize:12}} value={markForm.checkOut} onChange={e=>setMarkForm({...markForm,checkOut:e.target.value})} /></div>
                              <div className="mmh-field" style={{width:80}}><label className="mmh-label" style={{fontSize:10}}>OT Hours</label><input type="number" className="mmh-input" style={{height:38,fontSize:12}} value={markForm.overtimeHours} onChange={e=>setMarkForm({...markForm,overtimeHours:+e.target.value})} /></div>
                              <div className="mmh-field" style={{flex:1,minWidth:120}}><label className="mmh-label" style={{fontSize:10}}>Notes</label><input className="mmh-input" style={{height:38,fontSize:12}} value={markForm.notes} onChange={e=>setMarkForm({...markForm,notes:e.target.value})} /></div>
                              <button className="mmh-btn mmh-btn-green mmh-btn-sm" style={{height:38}} onClick={()=>handleMark(r.employee?._id)}>Save</button>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mmh-card" style={{overflow:'visible'}}>
          <div className="mmh-card-header"><div className="mmh-card-title">📅 Monthly Attendance Calendar</div></div>
          <div className="mmh-card-body">
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',overflow:'visible'}}>
              <div style={{flex:1,minWidth:200,overflow:'visible'}}>
                <TypeSearch options={empOptions} value={monthEmp} onChange={v=>setMonthEmp(v)} placeholder="Search employee..." label="Employee" />
              </div>
              <div className="mmh-field" style={{width:120}}>
                <label className="mmh-label">Month</label>
                <select className="mmh-input-select" value={monthNum} onChange={e=>setMonthNum(+e.target.value)}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="mmh-field" style={{width:100}}>
                <label className="mmh-label">Year</label>
                <select className="mmh-input-select" value={yearNum} onChange={e=>setYearNum(+e.target.value)}>
                  {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {!monthEmp ? (
              <div className="mmh-empty"><div className="mmh-empty-text">Select an employee to view calendar</div></div>
            ) : (() => {
              const { cells, monthlySummary } = renderCalendar();
              return (
                <>
                  <div className="mmh-att-cal">
                    {DAYS.map(d=><div key={d} className="mmh-att-cal-header">{d}</div>)}
                    {cells}
                  </div>
                  <div style={{display:'flex',gap:16,marginTop:16,flexWrap:'wrap'}}>
                    {[{l:'Present',v:monthlySummary.P,c:'#34d399'},{l:'Absent',v:monthlySummary.A,c:'#fb7185'},{l:'Late',v:monthlySummary.L,c:'#fbbf24'},{l:'Half-day',v:monthlySummary.H,c:'#38bdf8'},{l:'OT',v:`${monthlySummary.OT}h`,c:'#a78bfa'}].map(s=>(
                      <div key={s.l} style={{fontSize:12}}><span style={{color:s.c,fontWeight:800,marginRight:4}}>{s.v}</span><span style={{color:'#64748b'}}>{s.l}</span></div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
