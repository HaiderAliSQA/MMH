import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

function Pharmacist() {
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [tab, setTab] = useState("dispense");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);
  const [form, setForm] = useState({ patientId:"", items:[{ medId:"", qty:"1" }] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [patRes, medRes] = await Promise.all([
            api.get('/patients'),
            api.get('/medicines')
        ]);
        setPatients(patRes.data);
        setMedicines(medRes.data);
        if(medRes.data.length > 0) {
            setForm(p => ({ ...p, items:[{ medId: medRes.data[0]._id, qty:"1" }]}));
        }
    } catch(err) { console.error(err); }
  };

  const ff = (k,v) => setForm(p=>({...p,[k]:v}));
  const addItem = () => setForm(p=>({...p, items:[...p.items,{medId:(medicines[0]?._id||""),qty:"1"}]}));
  const removeItem = i => setForm(p=>({...p, items:p.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,k,v) => setForm(p=>{ const items=[...p.items]; items[i]={...items[i],[k]:v}; return {...p,items}; });

  const dispense = async () => {
    if(!form.patientId){alert("Select a patient");return;}
    const pat = patients.find(p=>p._id==form.patientId);
    let total = 0;
    
    try {
        // update inventory
        for (const it of form.items) {
          const med = medicines.find(m=>m._id==it.medId);
          if(med) {
              total += med.price * Number(it.qty);
              const newQty = med.qty - Number(it.qty);
              await api.put(`/medicines/${med._id}`, { qty: newQty });
          }
        }

        alert(`✅ Dispensed to ${pat.name}\nTotal: PKR ${total}\n\nInventory updated!`);
        fetchData(); // refresh data
        setForm({ patientId:"", items:[{medId:(medicines[0]?._id||""),qty:"1"}] });
    } catch(err) {
        alert("Failed to dispense");
    }
  };

  return (
    <div className="fade-up">
      <div className="stats-row col3">
        {[{ic:"💊",val:medicines.length,label:"Total Medicines",cl:"linear-gradient(90deg,#f59e0b,#d97706)"},{ic:"⚠️",val:medicines.filter(m=>m.qty<=m.min).length,label:"Low Stock Alerts",cl:"linear-gradient(90deg,#f43f5e,#e11d48)"},{ic:"📦",val:medicines.reduce((s,m)=>s+m.qty,0),label:"Total Stock Units",cl:"linear-gradient(90deg,#10b981,#059669)"}].map((s,i)=>(
          <div className="stat-card" key={i} style={{"--accent-line":s.cl}}>
            <div className="sc-icon">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {medicines.filter(m=>m.qty<=m.min).length > 0 && (
        <div style={{background:"rgba(244,63,94,.08)",border:"1px solid rgba(244,63,94,.3)",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>⚠️</span>
          <span style={{fontSize:13,color:"#fb7185",fontWeight:600}}>
            LOW STOCK: {medicines.filter(m=>m.qty<=m.min).map(m=>m.name).join(", ")}
          </span>
        </div>
      )}

      <div className="tabs">
        {[{id:"dispense",icon:"💊",label:"Dispense Medicine"},{id:"inventory",icon:"📦",label:"Inventory"}].map(t=>(
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab==="dispense" && (
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">💊</span>Dispense Medicine</div></div>
          <div className="form-group" style={{marginBottom:16}}>
            <label>Select Patient *</label>
            <select className="inp" value={form.patientId} onChange={e=>ff("patientId",e.target.value)}>
              <option value="">— Select Patient —</option>
              {patients.map(p=><option key={p._id} value={p._id}>{p.name} ({p.mr})</option>)}
            </select>
          </div>
          {form.items.map((item,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px auto",gap:10,marginBottom:10,alignItems:"flex-end"}}>
              <div className="form-group" style={{margin:0}}>
                {i===0 && <label>Medicine</label>}
                <select className="inp" value={item.medId} onChange={e=>updateItem(i,"medId",e.target.value)}>
                  {medicines.map(m=><option key={m._id} value={m._id}>{m.name} (Stock: {m.qty})</option>)}
                </select>
              </div>
              <div className="form-group" style={{margin:0}}>
                {i===0 && <label>Qty</label>}
                <input className="inp" type="number" min="1" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)}/>
              </div>
              <button className="btn btn-sm btn-rose" onClick={()=>removeItem(i)} style={{marginBottom:0,alignSelf:"flex-end"}}>✕</button>
            </div>
          ))}
          <button className="btn btn-sm btn-ghost" onClick={addItem} style={{marginBottom:16}}>+ Add More</button>
          <div className="action-row">
            <button className="btn btn-sm btn-amber" onClick={dispense}>💊 Dispense & Update Stock</button>
          </div>
        </div>
      )}

      {tab==="inventory" && (
        <div className="card">
          <div className="card-hd"><div className="card-title"><span className="ct-ic">📦</span>Medicine Inventory</div></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Stock</th><th>Min Level</th><th>Price/unit</th><th>Status</th></tr></thead>
              <tbody>
                {medicines.map((m,i)=>{
                  const pct = Math.min(100, Math.round((m.qty/Math.max(m.qty,m.min*3))*100));
                  return (
                    <tr key={m._id}>
                      <td style={{color:"var(--muted)"}}>{i+1}</td>
                      <td className="td-bold">{m.name}</td>
                      <td><span className="badge b-teal">{m.cat}</span></td>
                      <td>
                        <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:14,color:m.qty<=m.min?"var(--rose)":"#fff"}}>{m.qty}</div>
                        <div className="inv-bar"><div className="inv-fill" style={{width:`${pct}%`,background:m.qty<=m.min?"var(--rose)":m.qty<=m.min*2?"var(--amber)":"var(--emerald)"}}/></div>
                      </td>
                      <td style={{color:"var(--muted2)",fontFamily:"var(--mono)"}}>{m.min}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--emerald)"}}>₨{m.price}</td>
                      <td><span className={`badge ${m.qty<=m.min?"b-rose":m.qty<=m.min*2?"b-amber":"b-green"}`}>{m.qty<=m.min?"Low Stock":m.qty<=m.min*2?"Moderate":"In Stock"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pharmacist;
