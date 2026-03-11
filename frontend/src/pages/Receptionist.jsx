import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { DOCTORS_LIST, WARDS_LIST, LAB_TESTS, today, nowTime } from '../utils/helpers';
import { printOPD, printAdmission } from '../utils/helpers';

// Modals
function OpdSlipModal({ patient, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">🖨️ OPD Slip — Preview & Print</span>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="slip-wrap" style={{maxWidth:380,margin:"0 auto"}}>
          <div className="slip-hdr"><h2>MMH — Majida Memorial Hospital</h2><p>OPD Registration Slip</p></div>
          <div className="slip-body">
            <div className="slip-tok"><div className="tn">{patient.token}</div><div className="tl">TOKEN NUMBER</div></div>
            {[["MR Number",patient.mr],["Patient Name",patient.name],["Age / Gender",`${patient.age} yrs / ${patient.gender}`],
              ["CNIC",patient.cnic],["Phone",patient.phone||"—"],["Doctor",patient.doctor],["Department",patient.dept],
              ["Date",patient.date],["Time",patient.time]].map(([l,v])=>(
              <div className="slip-row" key={l}><span className="sl">{l}</span><span className="sv">{v}</span></div>
            ))}
            <div className="slip-foot">Please show this slip at Doctor's counter<br/>MMH — OPD Services</div>
          </div>
        </div>
        <div className="action-row">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-sm btn-teal" onClick={()=>printOPD(patient)}>🖨️ Print Slip</button>
        </div>
      </div>
    </div>
  );
}

function AdmissionSlipModal({ patient, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{width:720}}>
        <div className="modal-hd">
          <span className="modal-title">🖨️ Admission Slip — Preview & Print</span>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div style={{background:"#fff",color:"#000",borderRadius:10,overflow:"hidden",fontFamily:"sans-serif"}}>
          <div className="adm-hdr"><h2>MMH — Majida Memorial Hospital</h2><p>PATIENT ADMISSION FORM</p></div>
          <div className="adm-body">
            {[{title:"Patient Information",fields:[["MR Number",patient.mr],["Admission Date",patient.admitDate||today()],["Full Name",patient.name],["Age/Gender",`${patient.age}/${patient.gender}`],["CNIC",patient.cnic],["Phone",patient.phone||"—"]]},
              {title:"Admission Details",fields:[["Doctor",patient.doctor],["Department",patient.dept],["Ward",patient.ward||"—"],["Bed",patient.bed||"—"]]},
            ].map((sec, i)=>(
              <div className="adm-sec" key={i}>
                <div className="adm-stitle">{sec.title}</div>
                <div className="adm-grid">
                  {sec.fields.map(([l,v])=>(<div className="adm-f" key={l}><div className="fl">{l}</div><div className="fv">{v}</div></div>))}
                </div>
              </div>
            ))}
            <div className="adm-sec"><div className="adm-stitle">History & Symptoms</div>
              <div style={{border:"1px solid #eee",borderRadius:4,padding:10,minHeight:60,fontSize:12,color:"#555"}}>{patient.history||"—"}</div>
            </div>
            <div className="adm-sec"><div className="adm-stitle">Emergency Contact (Waris)</div>
              <div className="adm-grid">
                {[["Name",patient.warisName||"—"],["Relation",patient.warisRel||"—"],["Phone",patient.warisPhone||"—"]].map(([l,v])=>(<div className="adm-f" key={l}><div className="fl">{l}</div><div className="fv">{v}</div></div>))}
              </div>
            </div>
            <div className="adm-sec"><div className="adm-stitle">Payment / Insurance</div>
              <div className="adm-grid">
                {[["Payment Type",patient.payType||"Cash"],["Policy #",patient.policyNo||"—"]].map(([l,v])=>(<div className="adm-f" key={l}><div className="fl">{l}</div><div className="fv">{v}</div></div>))}
              </div>
            </div>
          </div>
        </div>
        <div className="action-row">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-sm btn-teal" onClick={()=>printAdmission(patient)}>🖨️ Print Admission Slip</button>
        </div>
      </div>
    </div>
  );
}

function Receptionist() {
  const [patients, setPatients] = useState([]);
  const [tab, setTab] = useState("opd");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);
  const [opdForm, setOpd] = useState({ name:"",age:"",gender:"Male",cnic:"",phone:"",doctorId:"1" });
  const [admForm, setAdm] = useState({ patientId:"",wardId:"1",bed:"",history:"",warisName:"",warisRel:"",warisPhone:"",payType:"Cash",policyNo:"" });
  const [labForm, setLab] = useState({ patientId:"",tests:[],urgent:false });
  const [payForm, setPay] = useState({ patientId:"",method:"Cash",amount:"",ref:"" });
  const [opdSlip, setOpdSlip] = useState(null);
  const [admSlip, setAdmSlip] = useState(null);
  const [payDone, setPayDone] = useState(null);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
        const res = await api.get('/patients');
        setPatients(res.data);
    } catch(err) { console.error(err); }
  };

  const of = (k,v) => setOpd(p=>({...p,[k]:v}));
  const af = (k,v) => setAdm(p=>({...p,[k]:v}));
  const lf = (k,v) => setLab(p=>({...p,[k]:v}));
  const pf = (k,v) => setPay(p=>({...p,[k]:v}));

  const submitOPD = async () => {
    if(!opdForm.name||!opdForm.age||!opdForm.cnic){alert("Fill required fields (Name, Age, CNIC)");return;}
    const doc = DOCTORS_LIST.find(d=>d.id==opdForm.doctorId);
    const p = { 
        mr: `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`, 
        token: String(Math.floor(Math.random()*1000)).padStart(4,"0"), 
        name:opdForm.name, age:opdForm.age,
        gender:opdForm.gender, cnic:opdForm.cnic, phone:opdForm.phone, doctor:doc.name,
        dept:doc.dept, doctorId:String(opdForm.doctorId), date:today(), time:nowTime(),
        status:"OPD", admitted:false 
    };
    try {
        const res = await api.post('/patients', p);
        setPatients([res.data, ...patients]);
        setOpdSlip(res.data);
        setOpd({ name:"",age:"",gender:"Male",cnic:"",phone:"",doctorId:"1" });
    } catch(err) { alert('Failed to register patient'); }
  };

  const submitAdm = async () => {
    if(!admForm.patientId||!admForm.bed||!admForm.warisName){alert("Fill required fields");return;}
    const ward = WARDS_LIST.find(w=>w.id==admForm.wardId);
    const updated = {
      admitted:true, status:"Admitted", ward:ward.name, bed:admForm.bed,
      history:admForm.history, warisName:admForm.warisName, warisRel:admForm.warisRel,
      warisPhone:admForm.warisPhone, payType:admForm.payType, policyNo:admForm.policyNo, admitDate:today() 
    };
    try {
        const res = await api.put(`/patients/${admForm.patientId}`, updated);
        setPatients(patients.map(p => p._id === res.data._id ? res.data : p));
        setAdmSlip(res.data);
        setAdm({ patientId:"",wardId:"1",bed:"",history:"",warisName:"",warisRel:"",warisPhone:"",payType:"Cash",policyNo:"" });
    } catch(err) { alert('Failed to admit patient'); }
  };

  const toggleTest = t => {
    setLab(p=>({ ...p, tests: p.tests.includes(t) ? p.tests.filter(x=>x!==t) : [...p.tests,t] }));
  };

  const submitLab = async () => {
    if(!labForm.patientId||labForm.tests.length===0){alert("Select patient and at least one test");return;}
    const pat = patients.find(p=>p._id==labForm.patientId);
    const req = { 
      labId:`LAB-${Date.now().toString().slice(-5)}`,
      patientId:pat._id, patientName:pat.name, mr:pat.mr,
      tests:labForm.tests, urgent:labForm.urgent, date:today(), time:nowTime(),
      status:"Pending", results:[] 
    };
    try {
        await api.post('/labs', req);
        alert(`✅ Lab request submitted! ID: ${req.labId}`);
        setLab({ patientId:"",tests:[],urgent:false });
    } catch(err) { alert('Failed to submit lab request'); }
  };

  const submitPay = async () => {
    if(!payForm.patientId||!payForm.amount){alert("Select patient and enter amount");return;}
    const inv = `INV-${Date.now().toString().slice(-6)}`;
    const pat = patients.find(p=>p._id==payForm.patientId);
    const payment = { 
      invoiceNo:inv, patientId:pat._id,
      patientName:pat.name, method:payForm.method, amount:payForm.amount,
      ref:payForm.ref, date:today(), time:nowTime(), status:"Paid" 
    };
    try {
        const res = await api.post('/payments', payment);
        setPayDone(res.data);
        setPay({ patientId:"",method:"Cash",amount:"",ref:"" });
    } catch(err) { alert('Failed to process payment'); }
  };

  const opdPats = patients.filter(p=>!p.admitted);
  const selWard = WARDS_LIST.find(w=>w.id==admForm.wardId) || WARDS_LIST[0];

  const TABS = [
    {id:"opd",icon:"📋",label:"OPD Registration"},
    {id:"admission",icon:"🛏️",label:"Admission"},
    {id:"lab",icon:"🔬",label:"Lab Tests"},
    {id:"payment",icon:"💳",label:"Payment"},
    {id:"list",icon:"📊",label:"Today's List"},
  ];

  return (
    <div className="fade-up">
      {opdSlip && <OpdSlipModal patient={opdSlip} onClose={()=>setOpdSlip(null)}/>}
      {admSlip && <AdmissionSlipModal patient={admSlip} onClose={()=>setAdmSlip(null)}/>}
      {payDone && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:420,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>✅</div>
            <div className="modal-title" style={{justifyContent:"center",marginBottom:8}}>Payment Successful!</div>
            <div style={{color:"var(--muted2)",fontSize:13,marginBottom:18}}>
              Invoice: <strong style={{color:"var(--teal)",fontFamily:"var(--mono)"}}>{payDone.invoiceNo}</strong><br/>
              Patient: <strong>{payDone.patientName}</strong><br/>
              Amount: <strong style={{color:"var(--emerald)"}}>PKR {payDone.amount}</strong> via {payDone.method}
            </div>
            <button className="btn btn-sm btn-teal" onClick={()=>setPayDone(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="stats-row col3 fade-up">
        {[{ic:"📋",val:patients.length,label:"Total Patients Today"},{ic:"🏥",val:opdPats.length,label:"OPD Visits"},{ic:"🛏️",val:patients.filter(p=>p.admitted).length,label:"Admitted Patients"}].map((s,i)=>(
          <div className="stat-card fade-up" key={i} style={{"--accent-line":`linear-gradient(90deg,#0ea5e9,#10b981)`}}>
            <div className="sc-icon">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs no-print">
        {TABS.map(t=>(
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==="opd" && (
        <div className="card fade-up">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">📋</span>OPD Patient Registration</div></div>
          <div className="form-grid">
            <div className="form-group"><label>Patient Name *</label><input className="inp" value={opdForm.name} onChange={e=>of("name",e.target.value)} placeholder="Full name"/></div>
            <div className="form-group"><label>Age (years) *</label><input className="inp" type="number" value={opdForm.age} onChange={e=>of("age",e.target.value)} placeholder="e.g. 35"/></div>
            <div className="form-group"><label>Gender</label><select className="inp" value={opdForm.gender} onChange={e=>of("gender",e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div className="form-group"><label>CNIC *</label><input className="inp" value={opdForm.cnic} onChange={e=>of("cnic",e.target.value)} placeholder="XXXXX-XXXXXXX-X"/></div>
            <div className="form-group"><label>Phone</label><input className="inp" value={opdForm.phone} onChange={e=>of("phone",e.target.value)} placeholder="03XX-XXXXXXX"/></div>
            <div className="form-group"><label>Assign Doctor *</label>
              <select className="inp" value={opdForm.doctorId} onChange={e=>of("doctorId",e.target.value)}>
                {DOCTORS_LIST.map(d=><option key={d.id} value={d.id}>{d.name} — {d.dept}</option>)}
              </select>
            </div>
          </div>
          <div className="action-row">
            <button className="btn btn-sm btn-green" onClick={submitOPD}>✅ Register & Generate OPD Slip</button>
          </div>
        </div>
      )}

      {tab==="admission" && (
        <div className="card fade-up">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">🛏️</span>Patient Admission Form</div></div>
          <div className="form-grid">
            <div className="form-group"><label>Select Patient *</label>
              <select className="inp" value={admForm.patientId} onChange={e=>af("patientId",e.target.value)}>
                <option value="">— Select OPD Patient —</option>
                {opdPats.map(p=><option key={p._id} value={p._id}>{p.name} (Token #{p.token} | {p.dept})</option>)}
              </select>
              {opdPats.length===0&&<span className="hint-tag">Register a patient from OPD tab first</span>}
            </div>
            <div className="form-group"><label>Ward</label>
              <select className="inp" value={admForm.wardId} onChange={e=>af("wardId",e.target.value)}>
                {WARDS_LIST.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Bed Number *</label>
              <select className="inp" value={admForm.bed} onChange={e=>af("bed",e.target.value)}>
                <option value="">— Select Bed —</option>
                {selWard?.beds.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Payment Type</label>
              <select className="inp" value={admForm.payType} onChange={e=>af("payType",e.target.value)}>
                <option>Cash</option><option>Insurance</option><option>Card</option><option>Government Scheme</option>
              </select>
            </div>
            <div className="form-group full"><label>History & Chief Complaints</label>
              <textarea className="inp" value={admForm.history} onChange={e=>af("history",e.target.value)} placeholder="Symptoms, chief complaints, past medical history..."/>
            </div>
            <div className="form-group"><label>Waris Name *</label><input className="inp" value={admForm.warisName} onChange={e=>af("warisName",e.target.value)} placeholder="Emergency contact"/></div>
            <div className="form-group"><label>Relation</label><input className="inp" value={admForm.warisRel} onChange={e=>af("warisRel",e.target.value)} placeholder="Father / Spouse / Son..."/></div>
            <div className="form-group"><label>Waris Phone</label><input className="inp" value={admForm.warisPhone} onChange={e=>af("warisPhone",e.target.value)} placeholder="03XX-XXXXXXX"/></div>
            <div className="form-group"><label>Policy # (if insurance)</label><input className="inp" value={admForm.policyNo} onChange={e=>af("policyNo",e.target.value)} placeholder="Policy number"/></div>
          </div>
          <div className="action-row">
            <button className="btn btn-sm btn-teal" onClick={submitAdm}>🛏️ Admit Patient & Generate Slip</button>
          </div>
        </div>
      )}

      {tab==="lab" && (
        <div className="card fade-up">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">🔬</span>Lab Test Request</div></div>
          <div className="form-grid">
            <div className="form-group"><label>Select Patient *</label>
              <select className="inp" value={labForm.patientId} onChange={e=>lf("patientId",e.target.value)}>
                <option value="">— Select Patient —</option>
                {patients.map(p=><option key={p._id} value={p._id}>{p.name} ({p.mr})</option>)}
              </select>
            </div>
            <div className="form-group" style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",textTransform:"none",letterSpacing:"normal",fontSize:13}}>
                <input type="checkbox" checked={labForm.urgent} onChange={e=>lf("urgent",e.target.checked)} style={{width:16,height:16,accentColor:"var(--rose)"}}/>
                <span style={{color:labForm.urgent?"var(--rose)":"var(--muted2)",fontWeight:700}}>🚨 Mark as URGENT</span>
              </label>
            </div>
            <div className="form-group full">
              <label>Select Tests * ({labForm.tests.length} selected)</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:6}}>
                {LAB_TESTS.map(t=>(
                  <label key={t} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",
                    background:labForm.tests.includes(t)?"rgba(14,165,233,.1)":"var(--bg3)",
                    border:`1.5px solid ${labForm.tests.includes(t)?"var(--teal)":"var(--border)"}`,
                    borderRadius:8,padding:"8px 10px",transition:"all .18s",textTransform:"none",
                    letterSpacing:"normal",fontSize:12,color:labForm.tests.includes(t)?"#fff":"var(--muted2)"}}>
                    <input type="checkbox" checked={labForm.tests.includes(t)} onChange={()=>toggleTest(t)}
                      style={{width:14,height:14,accentColor:"var(--teal)",flexShrink:0}}/>
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="action-row">
            <button className="btn btn-sm btn-violet" onClick={submitLab}>🔬 Submit Lab Request</button>
          </div>
        </div>
      )}

      {tab==="payment" && (
        <div className="card fade-up">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">💳</span>Payment Collection</div></div>
          <div className="form-group" style={{marginBottom:16}}>
            <label>Select Patient *</label>
            <select className="inp" value={payForm.patientId} onChange={e=>pf("patientId",e.target.value)}>
              <option value="">— Select Patient —</option>
              {patients.map(p=><option key={p._id} value={p._id}>{p.name} ({p.mr}) — {p.status}</option>)}
            </select>
          </div>
          <div className="pay-methods">
            {[{m:"Cash",ic:"💵"},{m:"Card",ic:"💳"},{m:"Insurance",ic:"🏥"},{m:"JazzCash",ic:"📱"},{m:"EasyPaisa",ic:"📱"},{m:"Bank Transfer",ic:"🏦"}].map(({m,ic})=>(
              <div key={m} className={`pay-method ${payForm.method===m?"sel":""}`} onClick={()=>pf("method",m)}>
                <span className="pm-ic">{ic}</span>{m}
              </div>
            ))}
          </div>
          <div className="form-grid">
            <div className="form-group"><label>Amount (PKR) *</label><input className="inp" type="number" value={payForm.amount} onChange={e=>pf("amount",e.target.value)} placeholder="Enter amount"/></div>
            <div className="form-group"><label>Reference # (optional)</label><input className="inp" value={payForm.ref} onChange={e=>pf("ref",e.target.value)} placeholder="Transaction / receipt #"/></div>
          </div>
          <div className="action-row">
            <button className="btn btn-sm btn-green" onClick={submitPay}>✅ Confirm Payment</button>
          </div>
        </div>
      )}

      {tab==="list" && (
        <div className="card fade-up">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">📊</span>Today's Patient List</div></div>
          {patients.length===0 ? <div className="empty-state">No patients registered today</div> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Token</th><th>MR #</th><th>Name</th><th>Age/Sex</th><th>Doctor</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {patients.map(p=>(
                    <tr key={p._id}>
                      <td><span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--teal)"}}>#{p.token}</span></td>
                      <td className="td-mono">{p.mr}</td>
                      <td className="td-bold">{p.name}</td>
                      <td style={{color:"var(--muted2)"}}>{p.age}y / {p.gender[0]}</td>
                      <td>{p.doctor}</td>
                      <td><span className={`badge ${p.admitted?"b-teal":"b-green"}`}>{p.status}</span></td>
                      <td style={{color:"var(--muted)"}}>{p.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Receptionist;
