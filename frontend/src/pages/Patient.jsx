import { useState, useEffect } from 'react';
import api from '../services/api';
import { printLabResult } from '../utils/helpers';

function Patient({ user }) {
  const [myRecords, setMyRecords] = useState([]);
  const [myLabs, setMyLabs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [pat, labs] = await Promise.all([
          api.get('/patients'),
          api.get('/labs')
        ]);
        // Mock filtering by matching name/phone or simply grab the latest test patient for demo
        const matched = pat.data.filter(p => p.name.toLowerCase() === user.name.toLowerCase());
        setMyRecords(matched);

        const mrList = matched.map(m => m.mr);
        setMyLabs(labs.data.filter(l => mrList.includes(l.mr)));
    } catch(err) { console.error(err); }
  };

  return (
    <div className="fade-up">
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="ct-ic">👤</span>My Profile & Hospital Visits</div>
        </div>
        {myRecords.length === 0 ? <div className="empty-state">No hospital records found for your profile.</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>MR #</th><th>Department</th><th>Doctor</th><th>Date</th><th>Status</th><th>Admission</th></tr></thead>
              <tbody>
                {myRecords.map(r=>(
                  <tr key={r._id}>
                    <td className="td-mono" style={{color:"var(--teal)"}}>{r.mr}</td>
                    <td>{r.dept}</td>
                    <td className="td-bold">{r.doctor}</td>
                    <td style={{color:"var(--muted2)"}}>{r.date}</td>
                    <td><span className={`badge ${r.admitted?"b-teal":"b-green"}`}>{r.status}</span></td>
                    <td style={{color:"var(--muted)"}}>{r.admitted ? `Ward: ${r.ward} | Bed: ${r.bed}` : "OPD Only"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="ct-ic">🔬</span>My Lab Results</div>
        </div>
        {myLabs.length === 0 ? <div className="empty-state">No lab results found.</div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Lab ID</th><th>Tests</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {myLabs.map(l=>(
                  <tr key={l._id}>
                    <td className="td-mono" style={{color:"var(--violet)"}}>{l.labId}</td>
                    <td style={{fontSize:12}}>{l.tests.join(", ")}</td>
                    <td style={{color:"var(--muted2)"}}>{l.date}</td>
                    <td><span className={`badge ${l.status==="Done"?"b-green":"b-amber"}`}>{l.status}</span></td>
                    <td>
                      {l.status === "Done" ? (
                        <button className="btn btn-sm btn-teal" onClick={()=>printLabResult(l)}>🖨️ View Report</button>
                      ) : (
                        <span style={{fontSize:12,color:"var(--muted)"}}>Awaiting Results</span>
                      )}
                    </td>
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

export default Patient;
