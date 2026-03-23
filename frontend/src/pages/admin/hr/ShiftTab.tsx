import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../../api';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SHIFT_TYPES = ['Morning','Evening','Night','Off'];
const SHIFT_HOURS: Record<string,number> = { Morning:6, Evening:6, Night:12, Off:0 };
const SHIFT_TIMES: Record<string,{s:string,e:string}> = { Morning:{s:'08:00',e:'14:00'}, Evening:{s:'14:00',e:'20:00'}, Night:{s:'20:00',e:'08:00'}, Off:{s:'',e:''} };

const getMonday = (d: Date) => { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); };
const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const fmtWeekLabel = (d: Date) => { const end = new Date(d); end.setDate(end.getDate()+6); return `${d.toLocaleDateString('en-PK',{day:'2-digit',month:'short'})} — ${end.toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}`; };

interface Props { employees: any[] }

const ShiftTab: React.FC<Props> = ({ employees }) => {
  const [weekStart, setWeekStart] = useState(() => { const d=new Date(); return getMonday(d); });
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCell, setEditCell] = useState<{shiftIdx:number,dayIdx:number}|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalEmp, setModalEmp] = useState('');
  const [modalSchedule, setModalSchedule] = useState(DAYS.map(d=>({day:d,shiftType:'Off'})));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{type:string,msg:string}|null>(null);

  const loadShifts = async () => {
    setLoading(true);
    try { const r = await hrAPI.getShifts(fmtDate(weekStart)); setShifts(r.data); }
    catch { setBanner({type:'error',msg:'Failed to load shifts'}); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadShifts(); }, [weekStart]);
  useEffect(() => { if(banner) { const t=setTimeout(()=>setBanner(null),3000); return ()=>clearTimeout(t); } }, [banner]);

  const navigateWeek = (dir: number) => { const d=new Date(weekStart); d.setDate(d.getDate()+dir*7); setWeekStart(d); };

  const countByShift = (type: string) => shifts.reduce((c,s) => c + (s.schedule||[]).filter((d:any)=>d.shiftType===type).length, 0);

  const quickEdit = async (shiftData: any, dayIdx: number, newType: string) => {
    setEditCell(null);
    const newSchedule = [...(shiftData.schedule||[])];
    newSchedule[dayIdx] = { ...newSchedule[dayIdx], shiftType: newType, startTime: SHIFT_TIMES[newType]?.s||'', endTime: SHIFT_TIMES[newType]?.e||'' };
    try {
      await hrAPI.saveShift({ employee: shiftData.employee?._id || shiftData.employee, weekStart: fmtDate(weekStart), schedule: newSchedule });
      setBanner({type:'success',msg:'Shift updated'});
      loadShifts();
    } catch { setBanner({type:'error',msg:'Failed to update shift'}); }
  };

  const saveNewShift = async () => {
    if(!modalEmp) return;
    setSaving(true);
    try {
      await hrAPI.saveShift({ employee: modalEmp, weekStart: fmtDate(weekStart), schedule: modalSchedule.map(s=>({...s, startTime: SHIFT_TIMES[s.shiftType]?.s||'', endTime: SHIFT_TIMES[s.shiftType]?.e||''})) });
      setBanner({type:'success',msg:'Shift assigned successfully'});
      setShowModal(false);
      loadShifts();
    } catch { setBanner({type:'error',msg:'Failed to save shift'}); }
    finally { setSaving(false); }
  };

  const shiftBadge = (type: string) => { const m: Record<string,string> = {Morning:'M',Evening:'E',Night:'N',Off:'—'}; const c: Record<string,string> = {Morning:'mmh-shift-M',Evening:'mmh-shift-E',Night:'mmh-shift-N',Off:'mmh-shift-off'}; return <span className={c[type]||'mmh-shift-off'}>{m[type]||'—'}</span>; };

  const stats = [
    { icon:'👥', label:'Total Staff', value: employees.length, color:'#0ea5e9' },
    { icon:'☀️', label:'Morning Shifts', value: countByShift('Morning'), color:'#38bdf8' },
    { icon:'🌤', label:'Evening Shifts', value: countByShift('Evening'), color:'#f59e0b' },
    { icon:'🌙', label:'Night Shifts', value: countByShift('Night'), color:'#8b5cf6' },
  ];

  return (
    <div>
      {banner && <div className={`mmh-banner mmh-banner-${banner.type}`} style={{marginBottom:16}}>{banner.type==='success'?'✅':'❌'} {banner.msg}</div>}
      <div className="mmh-stats-grid">{stats.map((s,i) => (<div className="mmh-stat-card" key={i}><div className="mmh-stat-accent" style={{background:s.color}}/><div className="mmh-stat-icon">{s.icon}</div><div className="mmh-stat-value">{s.value}</div><div className="mmh-stat-label">{s.label}</div></div>))}</div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:12}}>
        <div className="mmh-week-nav">
          <button className="mmh-week-btn" onClick={()=>navigateWeek(-1)}>←</button>
          <div className="mmh-week-label">{fmtWeekLabel(new Date(weekStart))}</div>
          <button className="mmh-week-btn" onClick={()=>navigateWeek(1)}>→</button>
        </div>
        <button className="mmh-btn mmh-btn-primary" onClick={()=>{setShowModal(true);setModalEmp('');setModalSchedule(DAYS.map(d=>({day:d,shiftType:'Off'})));}}>+ Assign Shift</button>
      </div>

      <div className="mmh-table-card">
        <div className="mmh-table-card-top"/>
        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead><tr><th>Staff</th><th>Role</th>{DAYS.map(d=><th key={d}>{d}</th>)}<th>Hrs</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={10} style={{textAlign:'center',padding:40}}>Loading...</td></tr> :
               shifts.length===0 ? <tr><td colSpan={10} style={{textAlign:'center',padding:40,color:'#475569'}}>No shifts assigned for this week</td></tr> :
               shifts.map((s,si) => (
                <tr key={si}>
                  <td><div className="mmh-td-name">{s.employee?.name||'—'}</div><div className="mmh-td-sub">{s.employee?.employeeId||''}</div></td>
                  <td><span className="mmh-badge mmh-badge-sky">{s.employee?.role||'—'}</span></td>
                  {DAYS.map((d,di) => {
                    const dayData = (s.schedule||[]).find((x:any)=>x.day===d);
                    const type = dayData?.shiftType || 'Off';
                    return (
                      <td key={d} style={{position:'relative'}}>
                        <div onClick={()=>setEditCell(editCell?.shiftIdx===si&&editCell?.dayIdx===di?null:{shiftIdx:si,dayIdx:di})}>{shiftBadge(type)}</div>
                        {editCell?.shiftIdx===si && editCell?.dayIdx===di && (
                          <div className="mmh-shift-dropdown">
                            {SHIFT_TYPES.map(st=>(
                              <button key={st} className="mmh-shift-dropdown-item" onClick={()=>quickEdit(s,di,st)}>
                                {st==='Morning'?'☀️ ':st==='Evening'?'🌤 ':st==='Night'?'🌙 ':'— '}{st}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{s.totalHours||0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="mmh-overlay" onClick={()=>setShowModal(false)}>
          <div className="mmh-modal" onClick={e=>e.stopPropagation()}>
            <div className="mmh-modal-header"><div><div className="mmh-modal-title">Assign Shift</div><div className="mmh-modal-subtitle">Week of {fmtWeekLabel(new Date(weekStart))}</div></div><button className="mmh-modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="mmh-modal-body">
              <div className="mmh-field" style={{marginBottom:18}}>
                <label className="mmh-label">Employee<span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={modalEmp} onChange={e=>setModalEmp(e.target.value)}>
                  <option value="">Select Employee</option>
                  {employees.map((e:any)=><option key={e._id} value={e._id}>{e.name} — {e.role}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
                {modalSchedule.map((s,i)=>(
                  <div key={s.day} style={{textAlign:'center'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6}}>{s.day}</div>
                    <select className="mmh-input-select" style={{height:38,fontSize:12,padding:'0 8px'}} value={s.shiftType} onChange={e=>{const ns=[...modalSchedule];ns[i]={...ns[i],shiftType:e.target.value};setModalSchedule(ns);}}>
                      {SHIFT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,padding:12,background:'#111d35',borderRadius:10,display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'#64748b'}}>Total Hours</span>
                <span style={{fontWeight:800,color:'white',fontFamily:'JetBrains Mono,monospace'}}>{modalSchedule.reduce((s,d)=>s+(SHIFT_HOURS[d.shiftType]||0),0)}h</span>
              </div>
            </div>
            <div className="mmh-modal-footer"><button className="mmh-btn mmh-btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button><button className="mmh-btn mmh-btn-primary" disabled={!modalEmp||saving} onClick={saveNewShift}>{saving?'Saving...':'Save Shift'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftTab;
