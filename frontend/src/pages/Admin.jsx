import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { WARDS_LIST, DOCTORS_LIST } from '../utils/helpers';

function Admin() {
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("overview");
  const location = useLocation();
  
  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);
  
  const [medForm, setMedForm] = useState({ _id:null, name:"", cat:"", qty:"", min:"", price:"" });
  const [editMed, setEditMed] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
        if(tab === "overview" || tab === "patients" || tab === "wards") setPatients((await api.get('/patients')).data);
        if(tab === "overview" || tab === "medicines") setMedicines((await api.get('/medicines')).data);
        if(tab === "overview") setLabRequests((await api.get('/labs')).data);
        if(tab === "overview" || tab === "payments") setPayments((await api.get('/payments')).data);
    } catch(err) { console.error(err); }
  };

  const saveMed = async () => {
    if(!medForm.name||!medForm.qty){alert("Fill required fields");return;}
    try {
        if(editMed) {
          const res = await api.put(`/medicines/${editMed._id}`, { ...medForm, qty:Number(medForm.qty), min:Number(medForm.min), price:Number(medForm.price) });
          setMedicines(medicines.map(m => m._id === res.data._id ? res.data : m));
        } else {
          const res = await api.post('/medicines', { name:medForm.name, cat:medForm.cat, qty:Number(medForm.qty), min:Number(medForm.min)||20, price:Number(medForm.price)||0 });
          setMedicines([...medicines, res.data]);
        }
        setMedForm({ _id:null, name:"", cat:"", qty:"", min:"", price:"" }); setEditMed(null);
    } catch (err) { alert("Failed to save medicine"); }
  };

  const totalRev = payments.reduce((s,p)=>s+Number(p.amount),0);
  const TABS = [{id:"overview",icon:"📊",label:"Overview"},{id:"patients",icon:"👥",label:"All Patients"},{id:"doctors",icon:"👨⚕️",label:"Doctors"},{id:"medicines",icon:"💊",label:"Medicines"},{id:"wards",icon:"🏥",label:"Wards"},{id:"payments",icon:"💰",label:"Payments"}];

  return (
    <div className="fade-up">
      <div className="tabs" style={{flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab==="overview" && (
        <>
          <div className="stats-row">
            {[{ic:"👥",val:patients.length,label:"Total Patients",cl:"linear-gradient(90deg,#0ea5e9,#38bdf8)"},{ic:"🛏️",val:patients.filter(p=>p.admitted).length,label:"Admitted",cl:"linear-gradient(90deg,#10b981,#34d399)"},{ic:"🔬",val:labRequests.length,label:"Lab Requests",cl:"linear-gradient(90deg,#8b5cf6,#a78bfa)"},{ic:"💰",val:`₨${(totalRev/1000).toFixed(1)}k`,label:"Revenue",cl:"linear-gradient(90deg,#f59e0b,#fbbf24)"}].map((s,i)=>(
              <div className="stat-card" key={i} style={{"--accent-line":s.cl}}>
                <div className="sc-icon">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div className="card">
              <div className="card-hd"><div className="card-title">🏥 Ward Status</div></div>
              <table>
                <thead><tr><th>Ward</th><th>Total</th><th>Occupied</th><th>Free</th></tr></thead>
                <tbody>
                  {WARDS_LIST.map(w=>{
                    const occ=patients.filter(p=>p.ward===w.name).length;
                    return (<tr key={w.id}><td className="td-bold">{w.name}</td><td>{w.beds.length}</td>
                      <td><span className="badge b-rose">{occ}</span></td>
                      <td><span className="badge b-green">{w.beds.length-occ}</span></td></tr>);
                  })}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-hd"><div className="card-title">⚠️ Low Stock Medicines</div></div>
              {medicines.filter(m=>m.qty<=m.min).length===0
                ? <div className="empty-state" style={{padding:"20px 0"}}>All medicines are well stocked ✅</div>
                : <table><thead><tr><th>Medicine</th><th>Stock</th><th>Min</th></tr></thead>
                  <tbody>{medicines.filter(m=>m.qty<=m.min).map(m=>(
                    <tr key={m._id}><td className="td-bold">{m.name}</td>
                      <td><span className="badge b-rose">{m.qty}</span></td>
                      <td style={{color:"var(--muted2)"}}>{m.min}</td></tr>
                  ))}</tbody></table>
              }
            </div>
          </div>
        </>
      )}

      {tab==="patients" && (
        <div className="card">
          <div className="card-hd"><div className="card-title">👥 All Patients</div></div>
          {patients.length===0 ? <div className="empty-state">No patients yet</div> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Token</th><th>MR #</th><th>Name</th><th>Age/Sex</th><th>Doctor</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>{patients.map(p=>(
                  <tr key={p._id}>
                    <td className="td-mono" style={{color:"var(--teal)"}}>#{p.token}</td>
                    <td className="td-mono">{p.mr}</td>
                    <td className="td-bold">{p.name}</td>
                    <td style={{color:"var(--muted2)"}}>{p.age}y/{p.gender[0]}</td>
                    <td>{p.doctor}</td>
                    <td><span className={`badge ${p.admitted?"b-teal":"b-green"}`}>{p.status}</span></td>
                    <td><span className="badge b-amber">{p.payType||"—"}</span></td>
                    <td style={{color:"var(--muted)"}}>{p.date}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==="doctors" && (
        <div className="card">
          <div className="card-hd"><div className="card-title">👨⚕️ Doctors on Duty</div></div>
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Department</th><th>Patients Today</th><th>Status</th></tr></thead>
            <tbody>{DOCTORS_LIST.map((d,i)=>(
              <tr key={d.id}>
                <td style={{color:"var(--muted)"}}>{i+1}</td>
                <td className="td-bold">{d.name}</td>
                <td>{d.dept}</td>
                <td><span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--teal)"}}>{patients.filter(p=>p.doctor===d.name).length}</span></td>
                <td><span className={`badge ${d.status==="On Duty"?"b-green":"b-gray"}`}>{d.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==="medicines" && (
        <>
          <div className="card">
            <div className="card-hd"><div className="card-title">➕ {editMed?"Edit":"Add"} Medicine</div></div>
            <div className="form-grid g3">
              <div className="form-group"><label>Name *</label><input className="inp" value={medForm.name} onChange={e=>setMedForm(p=>({...p,name:e.target.value}))} placeholder="Medicine name"/></div>
              <div className="form-group"><label>Category</label><input className="inp" value={medForm.cat} onChange={e=>setMedForm(p=>({...p,cat:e.target.value}))} placeholder="e.g. Antibiotic"/></div>
              <div className="form-group"><label>Quantity *</label><input className="inp" type="number" value={medForm.qty} onChange={e=>setMedForm(p=>({...p,qty:e.target.value}))} placeholder="Units"/></div>
              <div className="form-group"><label>Min Level</label><input className="inp" type="number" value={medForm.min} onChange={e=>setMedForm(p=>({...p,min:e.target.value}))} placeholder="Min stock"/></div>
              <div className="form-group"><label>Price/unit (PKR)</label><input className="inp" type="number" value={medForm.price} onChange={e=>setMedForm(p=>({...p,price:e.target.value}))} placeholder="Price"/></div>
            </div>
            <div className="action-row">
              {editMed && <button className="btn btn-sm btn-ghost" onClick={()=>{setEditMed(null);setMedForm({_id:null,name:"",cat:"",qty:"",min:"",price:""});}}>Cancel</button>}
              <button className="btn btn-sm btn-green" onClick={saveMed}>{editMed?"✅ Update":"➕ Add Medicine"}</button>
            </div>
          </div>
          <div className="card">
            <div className="card-hd"><div className="card-title">📦 Medicine Inventory</div></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Min</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{medicines.map(m=>(
                  <tr key={m._id}>
                    <td className="td-bold">{m.name}</td>
                    <td><span className="badge b-teal">{m.cat}</span></td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:m.qty<=m.min?"var(--rose)":"#fff"}}>{m.qty}</td>
                    <td style={{color:"var(--muted2)",fontFamily:"var(--mono)"}}>{m.min}</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--emerald)"}}>₨{m.price}</td>
                    <td><span className={`badge ${m.qty<=m.min?"b-rose":m.qty<=m.min*2?"b-amber":"b-green"}`}>{m.qty<=m.min?"Low":m.qty<=m.min*2?"Moderate":"OK"}</span></td>
                    <td><button className="btn btn-sm btn-ghost" onClick={()=>{setEditMed(m);setMedForm({...m,qty:String(m.qty),min:String(m.min),price:String(m.price)});}}>Edit</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==="wards" && (
        <div className="card">
          <div className="card-hd"><div className="card-title">🏥 Ward & Bed Management</div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {WARDS_LIST.map(w=>{
              const occ = patients.filter(p=>p.ward===w.name);
              return (
                <div key={w.id} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                  <div style={{fontWeight:700,color:"#fff",marginBottom:6,fontSize:13}}>{w.name}</div>
                  <div style={{fontSize:12,color:"var(--muted2)",marginBottom:10}}>{w.beds.length} beds total</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {w.beds.map(b=>{
                      const isOcc = occ.find(p=>p.bed===b);
                      return (
                        <div key={b} style={{padding:"4px 8px",borderRadius:6,fontSize:11,fontFamily:"var(--mono)",fontWeight:700,
                          background:isOcc?"rgba(244,63,94,.15)":"rgba(16,185,129,.1)",
                          border:`1px solid ${isOcc?"rgba(244,63,94,.4)":"rgba(16,185,129,.3)"}`,
                          color:isOcc?"#fb7185":"#34d399"}}
                          title={isOcc?isOcc.name:"Free"}>
                          {b}{isOcc?" 🔴":" ✅"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="payments" && (
        <div className="card">
          <div className="card-hd">
            <div className="card-title">💰 Payment Records</div>
            <div style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--emerald)",fontSize:16}}>Total: ₨{totalRev.toLocaleString()}</div>
          </div>
          {payments.length===0 ? <div className="empty-state">No payments recorded yet</div> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Invoice</th><th>Patient</th><th>Method</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>{payments.map(p=>(
                  <tr key={p._id}>
                    <td className="td-mono" style={{color:"var(--teal)"}}>{p.invoiceNo}</td>
                    <td className="td-bold">{p.patientName}</td>
                    <td><span className="badge b-violet">{p.method}</span></td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--emerald)"}}>₨{Number(p.amount).toLocaleString()}</td>
                    <td style={{color:"var(--muted)"}}>{p.date}</td>
                    <td><span className="badge b-green">✅ {p.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
