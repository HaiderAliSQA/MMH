export const DOCTORS_LIST = [
  { id:1, name:"Dr. Hamid Raza",   dept:"Cardiology",       status:"On Duty" },
  { id:2, name:"Dr. Sara Malik",   dept:"Neurology",        status:"On Duty" },
  { id:3, name:"Dr. Usman Tariq",  dept:"Orthopedics",      status:"On Duty" },
  { id:4, name:"Dr. Fatima Noor",  dept:"General Medicine", status:"On Leave" },
  { id:5, name:"Dr. Ali Zaman",    dept:"Pediatrics",       status:"On Duty" },
];

export const WARDS_LIST = [
  { id:1, name:"Cardiology Ward",    beds:["C-01","C-02","C-03","C-04"] },
  { id:2, name:"Neurology Ward",     beds:["N-01","N-02","N-03"] },
  { id:3, name:"Orthopedic Ward",    beds:["O-01","O-02","O-03","O-04","O-05"] },
  { id:4, name:"General Ward",       beds:["G-01","G-02","G-03","G-04","G-05","G-06"] },
  { id:5, name:"Pediatrics Ward",    beds:["P-01","P-02","P-03"] },
  { id:6, name:"ICU",                beds:["ICU-01","ICU-02","ICU-03","ICU-04"] },
];

export const LAB_TESTS = [
  "CBC (Complete Blood Count)","Blood Sugar (Fasting)","Blood Sugar (Random)",
  "Urine R/E","LFTs (Liver Function)","RFTs (Renal Function)","Lipid Profile",
  "Thyroid Profile (TSH)","HbA1c","Chest X-Ray","ECG","Ultrasound Abdomen",
  "COVID-19 PCR","Hepatitis B/C","Dengue NS1"
];

let _tok = 1;
export const genMR    = () => `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`;
export const genToken = () => String(_tok++).padStart(4,"0");
export const genInv   = () => `INV-${Date.now().toString().slice(-6)}`;
export const today    = () => new Date().toLocaleDateString("en-PK",{day:"2-digit",month:"short",year:"numeric"});
export const nowTime  = () => new Date().toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit"});

export function printOPD(p) {
  const w = window.open("","_blank","width=440,height=640");
  if(!w) return;
  w.document.write(`<html><head><title>OPD Slip - MMH</title>
  <style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;background:#fff}
  .hdr{background:#0c3b6b;color:#fff;padding:14px;text-align:center;border-radius:8px 8px 0 0}
  .hdr h2{font-size:18px;font-weight:800;margin:0 0 3px;font-style:italic}.hdr p{font-size:11px;margin:0;opacity:.8}
  .bdy{border:2px solid #0c3b6b;border-top:none;padding:16px;border-radius:0 0 8px 8px}
  .tok{text-align:center;background:#f0f6ff;border-radius:6px;padding:14px;margin-bottom:14px}
  .tn{font-size:50px;font-weight:800;color:#0c3b6b;font-family:monospace;line-height:1}
  .tl{font-size:10px;color:#666}
  .row{display:flex;justify-content:space-between;font-size:13px;border-bottom:1px dashed #e5e7eb;padding:6px 0}
  .row:last-child{border:none}.sl{color:#888}.sv{font-weight:700}
  .ft{text-align:center;font-size:10px;color:#aaa;margin-top:12px;border-top:1px solid #eee;padding-top:10px}
  </style></head><body>
  <div class="hdr"><h2>MMH — Majida Memorial Hospital</h2><p>OPD Registration Slip</p></div>
  <div class="bdy">
    <div class="tok"><div class="tn">${p.token}</div><div class="tl">TOKEN NUMBER</div></div>
    ${[["MR Number",p.mr],["Patient Name",p.name],["Age / Gender",`${p.age} yrs / ${p.gender}`],
       ["CNIC",p.cnic],["Phone",p.phone||"—"],["Doctor",p.doctor],["Department",p.dept],
       ["Date",p.date],["Time",p.time]].map(([l,v])=>`
    <div class="row"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join("")}
    <div class="ft">Please show this slip at Doctor's counter<br/>MMH — OPD Services | ${today()}</div>
  </div>
  <script>window.onload=()=>{window.print();window.close()}<\/script>
  </body></html>`);
  w.document.close();
}

export function printAdmission(p) {
  const w = window.open("","_blank","width=680,height=960");
  if(!w) return;
  w.document.write(`<html><head><title>Admission Slip - MMH</title>
  <style>body{font-family:'Segoe UI',sans-serif;margin:20px;font-size:13px;background:#fff}
  .hdr{background:#0c3b6b;color:#fff;padding:16px;text-align:center}
  h2{margin:0;font-size:20px;font-weight:800;font-style:italic}h2 span{display:block;font-size:12px;font-weight:400;opacity:.8;margin-top:3px}
  .bdy{border:2px solid #0c3b6b;border-top:none;padding:18px}
  .sec{margin-bottom:14px;border-bottom:1px solid #eee;padding-bottom:14px}
  .sec:last-child{border:none;margin:0;padding:0}
  .st{font-size:10px;font-weight:800;color:#0c3b6b;text-transform:uppercase;letter-spacing:.08em;
    background:#f0f6ff;display:inline-block;padding:3px 8px;border-radius:3px;margin-bottom:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .f .fl{font-size:10px;color:#888}.f .fv{font-weight:700;border-bottom:1px solid #eee;padding-bottom:3px}
  .notes{border:1px solid #e5e7eb;border-radius:4px;padding:10px;min-height:70px;font-size:12px;color:#555}
  .ft{text-align:center;font-size:10px;color:#aaa;margin-top:14px;border-top:1px solid #eee;padding-top:10px}
  </style></head><body>
  <div class="hdr"><h2>MMH — Majida Memorial Hospital<span>PATIENT ADMISSION FORM</span></h2></div>
  <div class="bdy">
    <div class="sec"><div class="st">Patient Information</div>
    <div class="grid">
      ${[["MR Number",p.mr],["Admission Date",p.admitDate||today()],["Full Name",p.name],["Age/Gender",`${p.age}/${p.gender}`],["CNIC",p.cnic],["Phone",p.phone||"—"]].map(([l,v])=>`<div class="f"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
    </div></div>
    <div class="sec"><div class="st">Admission Details</div>
    <div class="grid">
      ${[["Doctor",p.doctor],["Department",p.dept],["Ward",p.ward||"—"],["Bed",p.bed||"—"]].map(([l,v])=>`<div class="f"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
    </div></div>
    <div class="sec"><div class="st">History & Symptoms</div>
    <div class="notes">${p.history||"—"}</div></div>
    <div class="sec"><div class="st">Emergency Contact (Waris)</div>
    <div class="grid">
      ${[["Name",p.warisName||"—"],["Relation",p.warisRel||"—"],["Phone",p.warisPhone||"—"]].map(([l,v])=>`<div class="f"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
    </div></div>
    <div class="sec"><div class="st">Payment / Insurance</div>
    <div class="grid">
      ${[["Payment Type",p.payType||"Cash"],["Policy #",p.policyNo||"—"]].map(([l,v])=>`<div class="f"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
    </div></div>
    <div class="ft">Patient Signature: _____________________&nbsp;&nbsp;&nbsp;Doctor Signature: _____________________<br/>MMH — Admission Department</div>
  </div>
  <script>window.onload=()=>{window.print();window.close()}<\/script>
  </body></html>`);
  w.document.close();
}

export function printLabResult(req) {
  const w = window.open("","_blank","width=500,height=700");
  if(!w) return;
  w.document.write(`<html><head><title>Lab Report - MMH</title>
  <style>body{font-family:'Segoe UI',sans-serif;margin:20px;background:#fff}
  .hdr{background:#0c3b6b;color:#fff;padding:14px;text-align:center;border-radius:8px 8px 0 0}
  h2{margin:0;font-size:18px;font-weight:800;font-style:italic}.hdr p{font-size:11px;opacity:.8}
  .bdy{border:2px solid #0c3b6b;border-top:none;padding:16px}
  .pi{background:#f0f6ff;border-radius:6px;padding:12px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .f .fl{font-size:10px;color:#888}.f .fv{font-weight:700;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#0c3b6b;color:#fff;padding:8px;text-align:left}
  td{padding:8px;border-bottom:1px solid #eee}
  .ft{text-align:center;font-size:10px;color:#aaa;margin-top:12px;border-top:1px solid #eee;padding-top:10px}
  </style></head><body>
  <div class="hdr"><h2>MMH — Majida Memorial Hospital</h2><p>LABORATORY REPORT</p></div>
  <div class="bdy">
    <div class="pi">
      ${[["Patient",req.patientName],["MR #",req.mr],["Lab ID",req.labId||"—"],["Date",req.date]].map(([l,v])=>`<div class="f"><div class="fl">${l}</div><div class="fv">${v}</div></div>`).join("")}
    </div>
    <table><thead><tr><th>Test Name</th><th>Result</th><th>Normal Range</th><th>Status</th></tr></thead>
    <tbody>
    ${(req.results||[]).map(r=>`<tr><td>${r.test}</td><td><strong>${r.value||"—"}</strong></td><td>${r.normal||"—"}</td><td>${r.flag||"Normal"}</td></tr>`).join("")}
    </tbody></table>
    <div class="ft">Lab Technician: _______________________&nbsp;&nbsp;Doctor Sign: _______________________<br/>MMH — Laboratory Department | ${today()}</div>
  </div>
  <script>window.onload=()=>{window.print();window.close()}<\/script>
  </body></html>`);
  w.document.close();
}
