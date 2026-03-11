import { useState, useEffect } from 'react';
import api from '../services/api';
import { WARDS_LIST, DOCTORS_LIST } from '../utils/helpers';

function Manager() {
  const [patients, setPatients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [labRequests, setLabRequests] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [pat, pay, lab] = await Promise.all([
          api.get('/patients'),
          api.get('/payments'),
          api.get('/labs')
        ]);
        setPatients(pat.data);
        setPayments(pay.data);
        setLabRequests(lab.data);
    } catch(err) { console.error(err); }
  };

  const totalRev = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOpd = patients.filter(p => !p.admitted).length;
  const totalAdmitted = patients.filter(p => p.admitted).length;
  const labTestsDone = labRequests.filter(r => r.status === "Done").length;

  return (
    <div className="fade-up">
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="ct-ic">📈</span>Hospital Performance Overview</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,padding:"0 0 20px 0"}}>
          {[{l:"Total Revenue (Today)",v:`₨${totalRev.toLocaleString()}`,c:"var(--emerald)",ic:"💰"},
            {l:"OPD Registrations",v:totalOpd,c:"var(--teal)",ic:"📋"},
            {l:"Admissions",v:totalAdmitted,c:"var(--amber)",ic:"🛏️"},
            {l:"Lab Tests Completed",v:labTestsDone,c:"var(--violet)",ic:"🔬"}
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--bg3)",padding:20,borderRadius:12,border:"1px solid var(--border)",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:8}}>{s.ic}</div>
              <div style={{fontSize:13,color:"var(--muted2)",marginBottom:6,fontWeight:600}}>{s.l}</div>
              <div style={{fontSize:24,fontWeight:800,fontFamily:"var(--mono)",color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card" style={{margin:0}}>
          <div className="card-hd"><div className="card-title">👨⚕️ Doctor Performance</div></div>
          <table>
            <thead><tr><th>Doctor</th><th>Patients Seen</th></tr></thead>
            <tbody>
              {DOCTORS_LIST.map(d=>(
                <tr key={d.id}>
                  <td className="td-bold">{d.name}</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--teal)"}}>
                    {patients.filter(p=>p.doctor===d.name).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{margin:0}}>
          <div className="card-hd"><div className="card-title">🏥 Ward Occupancy</div></div>
          <table>
            <thead><tr><th>Ward</th><th>Occupancy Rate</th></tr></thead>
            <tbody>
              {WARDS_LIST.map(w=>{
                const occ = patients.filter(p=>p.ward===w.name).length;
                const tot = w.beds.length;
                const pct = Math.round((occ/tot)*100);
                return (
                  <tr key={w.id}>
                    <td className="td-bold">{w.name}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flexGrow:1,height:8,background:"var(--bg2)",borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:pct>80?"var(--rose)":pct>50?"var(--amber)":"var(--emerald)",borderRadius:4}}/>
                        </div>
                        <span style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Manager;
