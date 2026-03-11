import { useState } from 'react';
import api from '../services/api';

const ROLE_ICONS = { receptionist:"🏥", doctor:"👨⚕️", lab:"🔬", pharmacist:"💊", admin:"🛡️", manager:"📊", patient:"👤" };
const ROLE_LABELS = { receptionist:"Receptionist", doctor:"Doctor", lab:"Lab Technician", pharmacist:"Pharmacist", admin:"Admin", manager:"Manager", patient:"Patient" };

function Login({ onLogin }) {
  const [role, setRole] = useState("receptionist");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const roles = Object.entries(ROLE_ICONS).map(([id,ic])=>({ id, ic, label:ROLE_LABELS[id] }));

  const doLogin = async () => {
    try {
        const res = await api.post('/auth/login', { role, pass });
        if(res.data.success) {
            onLogin(res.data.user);
        }
    } catch(error) {
        setErr(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="mmh-logo">
          <div className="mmh-emblem">🏥</div>
          <div className="mmh-name">
            <h1>Majida Memorial Hospital</h1>
            <p>Hospital Management System — MMH</p>
          </div>
        </div>
        <div className="login-label">Select Your Role</div>
        <div className="role-grid">
          {roles.map(r=>(
            <button key={r.id} className={`role-pill ${role===r.id?"sel":""}`} onClick={()=>{setRole(r.id);setErr("");}}>
              <span className="ri">{r.ic}</span>{r.label}
            </button>
          ))}
        </div>
        <input className="inp" type="password" placeholder="Password — demo: 1234"
          value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        {err && <div className="err-msg">{err}</div>}
        <button className="btn btn-primary" onClick={doLogin}>Login to MMH →</button>
        <div style={{textAlign:"center",fontSize:11,color:"var(--muted)",marginTop:14}}>
          All roles use password: <strong style={{color:"var(--teal)",fontFamily:"var(--mono)"}}>1234</strong>
        </div>
      </div>
    </div>
  );
}

export default Login;
