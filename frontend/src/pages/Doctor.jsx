import { useState, useEffect } from 'react';
import api from '../services/api';
import { LAB_TESTS, today, nowTime } from '../utils/helpers';

function Doctor({ user }) {
  const [patients, setPatients] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [labModal, setLabModal] = useState(null);
  const [labTests, setLabTests] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [patRes, labRes] = await Promise.all([
            api.get('/patients'),
            api.get('/labs')
        ]);
        // Filter patients mapped to this doctor
        setPatients(patRes.data.filter(p => p.doctor === user.name));
        
        // Filter lab requests related to this doctor's patients
        const docPatientsIds = patRes.data.filter(p => p.doctor === user.name).map(p => p._id);
        setLabRequests(labRes.data.filter(r => docPatientsIds.includes(r.patientId)));
    } catch(err) { console.error(err); }
  };

  const submitDocLab = async () => {
    if(!labTests.length){alert("Select at least one test");return;}
    const req = { 
      labId:`LAB-${Date.now().toString().slice(-5)}`,
      patientId:selected._id, patientName:selected.name, mr:selected.mr,
      tests:labTests, urgent:false, date:today(), time:nowTime(), status:"Pending", results:[] 
    };
    try {
        const res = await api.post('/labs', req);
        setLabRequests([res.data, ...labRequests]);
        alert(`✅ Lab request: ${req.labId}`);
        setLabModal(null); setLabTests([]);
    } catch(err) { alert('Failed to create lab request'); }
  };

  return (
    <div className="fade-up">
      {selected && !labModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-hd">
              <span className="modal-title">Patient Details — {selected.name}</span>
              <button className="close-x" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="form-grid">
              {[["MR #",selected.mr],["Token",`#${selected.token}`],["Name",selected.name],["Age/Gender",`${selected.age} / ${selected.gender}`],["CNIC",selected.cnic],["Phone",selected.phone||"—"],["Doctor",selected.doctor],["Department",selected.dept],["Status",selected.status],["Date",selected.date]].map(([l,v])=>(
                <div key={l}><label>{l}</label><div style={{color:"#fff",fontWeight:600,marginTop:4,fontSize:13,background:"var(--bg3)",padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)"}}>{v}</div></div>
              ))}
              {selected.admitted && <>
                <div><label>Ward</label><div style={{color:"#fff",fontWeight:600,marginTop:4,fontSize:13,background:"var(--bg3)",padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)"}}>{selected.ward}</div></div>
                <div><label>Bed</label><div style={{color:"#fff",fontWeight:600,marginTop:4,fontSize:13,background:"var(--bg3)",padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)"}}>{selected.bed}</div></div>
                <div className="full"><label>History & Symptoms</label><div style={{color:"var(--text)",marginTop:4,fontSize:13,background:"var(--bg3)",padding:"10px 12px",borderRadius:8,border:"1px solid var(--border)",minHeight:60}}>{selected.history||"—"}</div></div>
              </>}
            </div>
            <div className="action-row">
              <button className="btn btn-sm btn-violet" onClick={()=>{setLabModal(selected);setSelected(null);}}>🔬 Request Lab Tests</button>
              <button className="btn btn-sm btn-ghost" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {labModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-hd">
              <span className="modal-title">🔬 Lab Test Request — {labModal.name}</span>
              <button className="close-x" onClick={()=>setLabModal(null)}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {LAB_TESTS.map(t=>(
                <label key={t} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",
                  background:labTests.includes(t)?"rgba(139,92,246,.15)":"var(--bg3)",
                  border:`1.5px solid ${labTests.includes(t)?"var(--violet)":"var(--border)"}`,
                  borderRadius:8,padding:"9px 12px",transition:"all .18s",fontSize:13,
                  color:labTests.includes(t)?"#fff":"var(--muted2)"}}>
                  <input type="checkbox" checked={labTests.includes(t)} onChange={()=>setLabTests(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{accentColor:"var(--violet)"}}/>
                  {t}
                </label>
              ))}
            </div>
            <div className="action-row">
              <button className="btn btn-sm btn-ghost" onClick={()=>setLabModal(null)}>Cancel</button>
              <button className="btn btn-sm btn-violet" onClick={()=>{ setSelected(labModal); submitDocLab() }}>🔬 Submit Request</button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-row col3">
        {[{ic:"📋",val:patients.filter(p=>!p.admitted).length,label:"OPD Patients",cl:"linear-gradient(90deg,#10b981,#059669)"},{ic:"🛏️",val:patients.filter(p=>p.admitted).length,label:"Admitted",cl:"linear-gradient(90deg,#0ea5e9,#0284c7)"},{ic:"🔬",val:labRequests.filter(r=>r.status==="Pending").length,label:"Pending Labs",cl:"linear-gradient(90deg,#8b5cf6,#7c3aed)"}].map((s,i)=>(
          <div className="stat-card" key={i} style={{"--accent-line":s.cl}}>
            <div className="sc-icon">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="ct-ic">👨⚕️</span>My Patients — Today</div></div>
        {patients.length===0 ? <div className="empty-state">No patients yet</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Token</th><th>Name</th><th>Age/Sex</th><th>Department</th><th>Status</th><th>Ward/Bed</th><th>Actions</th></tr></thead>
              <tbody>
                {patients.map(p=>(
                  <tr key={p._id}>
                    <td><span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--emerald)"}}>#{p.token}</span></td>
                    <td className="td-bold">{p.name}</td>
                    <td style={{color:"var(--muted2)"}}>{p.age}y/{p.gender[0]}</td>
                    <td>{p.dept}</td>
                    <td><span className={`badge ${p.admitted?"b-teal":"b-green"}`}>{p.status}</span></td>
                    <td style={{color:"var(--muted)"}}>{p.admitted?`${p.ward} / ${p.bed}`:"—"}</td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn btn-sm btn-ghost" onClick={()=>setSelected(p)}>View</button>
                        <button className="btn btn-sm btn-violet" onClick={()=>{setLabModal(p);}}>Lab</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="ct-ic">🔬</span>Lab Requests — My Patients</div></div>
        {labRequests.length===0 ? <div className="empty-state">No lab requests</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Lab ID</th><th>Patient</th><th>Tests</th><th>Urgent</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {labRequests.map(r=>(
                  <tr key={r._id}>
                    <td className="td-mono" style={{color:"var(--violet)"}}>{r.labId}</td>
                    <td className="td-bold">{r.patientName}</td>
                    <td style={{maxWidth:200,fontSize:11,color:"var(--muted2)"}}>{r.tests.slice(0,2).join(", ")}{r.tests.length>2&&` +${r.tests.length-2} more`}</td>
                    <td>{r.urgent?<span className="badge b-rose">🚨 Urgent</span>:<span className="badge b-gray">Normal</span>}</td>
                    <td><span className={`badge ${r.status==="Done"?"b-green":r.status==="Processing"?"b-amber":"b-gray"}`}>{r.status}</span></td>
                    <td style={{color:"var(--muted)"}}>{r.date}</td>
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

export default Doctor;
