import React from 'react';

const ROLE_ICONS = { receptionist:"🏥", doctor:"👨⚕️", lab:"🔬", pharmacist:"💊", admin:"🛡️", manager:"📊", patient:"👤" };
const ROLE_LABELS = { receptionist:"Receptionist", doctor:"Doctor", lab:"Lab Technician", pharmacist:"Pharmacist", admin:"Admin", manager:"Manager", patient:"Patient" };
const TOPBAR_TITLES = {
  receptionist:"OPD Registration & Admission — Receptionist",
  doctor:      "Doctor Dashboard — Patient Management",
  lab:         "Laboratory — Sample Processing & Results",
  pharmacist:  "Pharmacy — Dispensing & Inventory",
  admin:       "Admin Panel — Hospital Management",
  manager:     "Manager — Analytics & Reports",
  patient:     "Patient Portal — My Health Records",
};
const ROLE_BADGE_CLASS = { receptionist:"b-teal", doctor:"b-green", lab:"b-violet", pharmacist:"b-amber", admin:"b-rose", manager:"b-teal", patient:"b-gray" };

function Topbar({ user, toggleSidebar }) {
  const today = () => new Date().toLocaleDateString("en-PK",{day:"2-digit",month:"short",year:"numeric"});
  const nowTime = () => new Date().toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit"});

  return (
    <div className="topbar">
      <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
        <button className="menu-btn" onClick={toggleSidebar}>☰</button>
        <div>
          <div className="tb-title">{ROLE_ICONS[user.role]} {TOPBAR_TITLES[user.role]}</div>
          <div className="tb-sub">📅 {today()} &nbsp;·&nbsp; {nowTime()} &nbsp;·&nbsp; MMH System v2.0</div>
        </div>
      </div>
      <div className="tb-right">
        <span className={`badge ${ROLE_BADGE_CLASS[user.role]}`}>{ROLE_ICONS[user.role]} {ROLE_LABELS[user.role].toUpperCase()}</span>
        <span style={{fontSize:12,color:"var(--muted2)"}}>👋 {user.name}</span>
      </div>
    </div>
  );
}

export default Topbar;
