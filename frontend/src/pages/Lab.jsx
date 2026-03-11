import { useState, useEffect } from 'react';
import api from '../services/api';
import { printLabResult, today } from '../utils/helpers';

function Lab() {
  const [labRequests, setLabRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchLabs(); }, []);

  const fetchLabs = async () => {
    try {
        const res = await api.get('/labs');
        setLabRequests(res.data);
    } catch(err) { console.error(err); }
  };

  const startProcessing = async (req) => {
    const updated = { ...req, status:"Processing" };
    try {
        const res = await api.put(`/labs/${req._id}`, updated);
        setLabRequests(labRequests.map(r => r._id === res.data._id ? res.data : r));
        
        const initResults = req.tests.map(t=>({ test:t, value:"", normal:"", flag:"Normal" }));
        setSelected({ ...res.data, results:initResults });
    } catch(err) { alert('Update failed'); }
  };

  const updateResult = (idx, field, val) => {
    setSelected(prev => {
      const r = [...prev.results];
      r[idx] = { ...r[idx], [field]:val };
      return { ...prev, results:r };
    });
  };

  const submitResults = async () => {
    if(!selected) return;
    const updated = { status:"Done", results:selected.results };
    try {
        const res = await api.put(`/labs/${selected._id}`, updated);
        setLabRequests(labRequests.map(r => r._id === res.data._id ? res.data : r));
        printLabResult(res.data);
        setSelected(null);
    } catch(err) { alert('Submit failed'); }
  };

  const pending = labRequests.filter(r=>r.status!=="Done");
  const done    = labRequests.filter(r=>r.status==="Done");

  return (
    <div className="fade-up">
      {selected && (
        <div className="modal-overlay">
          <div className="modal" style={{width:720}}>
            <div className="modal-hd">
              <span className="modal-title">🔬 Enter Results — {selected.labId}</span>
              <button className="close-x" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div style={{background:"var(--bg3)",borderRadius:10,padding:14,marginBottom:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:13}}>
              {[["Patient",selected.patientName],["MR #",selected.mr],["Lab ID",selected.labId],["Date",selected.date]].map(([l,v])=>(
                <div key={l}><span style={{color:"var(--muted2)"}}>{l}: </span><strong style={{color:"#fff"}}>{v}</strong></div>
              ))}
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Test Name</th><th>Result Value</th><th>Normal Range</th><th>Flag</th></tr></thead>
                <tbody>
                  {selected.results.map((r,i)=>(
                    <tr key={i}>
                      <td style={{fontWeight:600,color:"#fff"}}>{r.test}</td>
                      <td><input className="inp" style={{margin:0,padding:"6px 10px"}} value={r.value} onChange={e=>updateResult(i,"value",e.target.value)} placeholder="e.g. 12.5 g/dL"/></td>
                      <td><input className="inp" style={{margin:0,padding:"6px 10px"}} value={r.normal} onChange={e=>updateResult(i,"normal",e.target.value)} placeholder="e.g. 11-16 g/dL"/></td>
                      <td>
                        <select className="inp" style={{margin:0,padding:"6px 10px"}} value={r.flag} onChange={e=>updateResult(i,"flag",e.target.value)}>
                          <option>Normal</option><option>High</option><option>Low</option><option>Critical</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="action-row">
              <button className="btn btn-sm btn-ghost" onClick={()=>setSelected(null)}>Cancel</button>
              <button className="btn btn-sm btn-green" onClick={submitResults}>✅ Save & Print Report</button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-row col3">
        {[{ic:"⏳",val:pending.length,label:"Pending",cl:"linear-gradient(90deg,#f59e0b,#d97706)"},{ic:"⚙️",val:labRequests.filter(r=>r.status==="Processing").length,label:"Processing",cl:"linear-gradient(90deg,#0ea5e9,#0284c7)"},{ic:"✅",val:done.length,label:"Completed",cl:"linear-gradient(90deg,#10b981,#059669)"}].map((s,i)=>(
          <div className="stat-card" key={i} style={{"--accent-line":s.cl}}>
            <div className="sc-icon">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="ct-ic">⏳</span>Pending Lab Requests</div></div>
        {pending.length===0 ? <div className="empty-state">No pending requests 🎉</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Lab ID</th><th>Patient</th><th>MR #</th><th>Tests</th><th>Urgent</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map(r=>(
                  <tr key={r._id}>
                    <td className="td-mono" style={{color:"var(--violet)"}}>{r.labId}</td>
                    <td className="td-bold">{r.patientName}</td>
                    <td className="td-mono">{r.mr}</td>
                    <td style={{fontSize:11,color:"var(--muted2)"}}>{r.tests.length} test{r.tests.length>1?"s":""}</td>
                    <td>{r.urgent?<span className="badge b-rose">🚨</span>:<span className="badge b-gray">—</span>}</td>
                    <td><span className={`badge ${r.status==="Processing"?"b-amber":"b-gray"}`}>{r.status}</span></td>
                    <td>
                      {r.status==="Pending" && <button className="btn btn-sm btn-amber" onClick={()=>startProcessing(r)}>Process</button>}
                      {r.status==="Processing" && <button className="btn btn-sm btn-green" onClick={()=>{ setSelected(r); }}>Enter Results</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="ct-ic">✅</span>Completed Reports</div></div>
        {done.length===0 ? <div className="empty-state">No completed reports yet</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Lab ID</th><th>Patient</th><th>Tests</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {done.map(r=>(
                  <tr key={r._id}>
                    <td className="td-mono" style={{color:"var(--emerald)"}}>{r.labId}</td>
                    <td className="td-bold">{r.patientName}</td>
                    <td style={{fontSize:11,color:"var(--muted2)"}}>{r.tests.length} tests</td>
                    <td style={{color:"var(--muted)"}}>{r.date}</td>
                    <td><button className="btn btn-sm btn-teal" onClick={()=>printLabResult(r)}>🖨️ Print</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lab;
