import { useNavigate, useLocation } from 'react-router-dom';

const ROLE_ICONS = { receptionist:"🏥", doctor:"👨⚕️", lab:"🔬", pharmacist:"💊", admin:"🛡️", manager:"📊", patient:"👤" };
const ROLE_LABELS = { receptionist:"Receptionist", doctor:"Doctor", lab:"Lab Technician", pharmacist:"Pharmacist", admin:"Admin", manager:"Manager", patient:"Patient" };

const SIDEBAR_NAV = {
  receptionist: [{id:"opd",ic:"📋",label:"OPD & Admission",path:"/receptionist"},{id:"lab",ic:"🔬",label:"Lab Requests",path:"/receptionist"},{id:"payment",ic:"💳",label:"Payments",path:"/receptionist"}],
  doctor:       [{id:"d",ic:"👨⚕️",label:"My Patients",path:"/doctor"},{id:"d",ic:"🔬",label:"Lab Orders",path:"/doctor"}],
  lab:          [{id:"d",ic:"🔬",label:"Lab Requests",path:"/lab"},{id:"d",ic:"✅",label:"Results Entry",path:"/lab"}],
  pharmacist:   [{id:"dispense",ic:"💊",label:"Dispense",path:"/pharmacist"},{id:"inventory",ic:"📦",label:"Inventory",path:"/pharmacist"}],
  admin:        [{id:"overview",ic:"🛡️",label:"Dashboard",path:"/admin"},{id:"patients",ic:"👥",label:"Patients",path:"/admin"},{id:"medicines",ic:"💊",label:"Medicines",path:"/admin"},{id:"wards",ic:"🏥",label:"Wards",path:"/admin"},{id:"payments",ic:"💰",label:"Payments",path:"/admin"}],
  manager:      [{id:"d",ic:"📊",label:"Analytics",path:"/manager"},{id:"d",ic:"📈",label:"Revenue",path:"/manager"},{id:"d",ic:"⚠️",label:"Alerts",path:"/manager"}],
  patient:      [{id:"d",ic:"👤",label:"My Records",path:"/patient"},{id:"d",ic:"🔬",label:"Lab Results",path:"/patient"}],
};

const USERS_MAP = {
  receptionist: { avClass:"av-rec" },
  doctor:       { avClass:"av-doc" },
  lab:          { avClass:"av-lab" },
  pharmacist:   { avClass:"av-pha" },
  admin:        { avClass:"av-adm" },
  manager:      { avClass:"av-mgr" },
  patient:      { avClass:"av-pat" },
};

function Sidebar({ user, onLogout, isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (n) => {
    navigate(n.path, { state: { tab: n.id } });
    if (closeSidebar) closeSidebar();
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sb-logo">
        <div className="sb-emblem">🏥</div>
        <div><h2>MMH</h2><span>Majida Memorial Hospital</span></div>
      </div>
      <div className="sb-user">
        <div className={`avatar ${USERS_MAP[user.role]?.avClass || 'av-pat'}`}>{user.name.charAt(0)}</div>
        <div><div className="sb-uname">{user.name}</div><div className="sb-urole">{ROLE_LABELS[user.role]}</div></div>
      </div>
      <nav className="sb-nav">
        <div className="sb-section">Navigation</div>
        {(SIDEBAR_NAV[user.role]||[]).map((n,i)=>(
          <div key={i} className={`nav-item ${location.pathname===n.path && location.state?.tab===n.id ? 'active' : (!location.state?.tab && i===0 && location.pathname===n.path ? 'active' : '')}`} onClick={() => handleNav(n)}>
            <span className="nav-ic">{n.ic}</span>{n.label}
          </div>
        ))}
        <div className="divider" style={{margin:"12px 10px"}}/>
        <div className="sb-section">System</div>
        <div className="nav-item"><span className="nav-ic">⚙️</span>Settings</div>
        <div className="nav-item"><span className="nav-ic">❓</span>Help & Support</div>
      </nav>
      <div className="sb-footer">
        <button className="btn btn-sm btn-ghost" style={{width:"100%"}} onClick={onLogout}>← Logout</button>
      </div>
    </div>
  );
}
export default Sidebar;
