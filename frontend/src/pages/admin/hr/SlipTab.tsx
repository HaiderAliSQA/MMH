import React, { useState } from 'react';
import { hrAPI } from '../../../api';
import TypeSearch from '../../../components/TypeSearch';

const fmt = (n: number) => n.toLocaleString();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SlipTab: React.FC<{ employees: any[] }> = ({ employees }) => {
  const [empId, setEmpId] = useState('');
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2026);
  const [slip, setSlip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const empOptions = employees.map(e => ({ value: e._id, label: `${e.name} — ${e.employeeId}`, sub: e.department }));
  const monthOptions = MONTHS.map((m,i) => ({ value: String(i+1), label: m }));
  const yearOptions = [2024,2025,2026,2027].map(y => ({ value: String(y), label: String(y) }));

  const loadSlip = async () => {
    if (!empId) { setError('Select an employee'); return; }
    setLoading(true); setError(''); setSlip(null);
    try {
      // Find payroll record
      const r = await hrAPI.getPayroll(month, year);
      const found = (r.data || []).find((p: any) => p.employee?._id === empId || p.employee === empId);
      if (!found) { setError('No payroll record found for this employee/month'); setLoading(false); return; }
      const slipRes = await hrAPI.getSlip(found._id);
      setSlip(slipRes.data);
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to load slip'); }
    finally { setLoading(false); }
  };

  const printSlip = () => {
    if (!slip) return;
    const root = document.documentElement;
    const accent = getComputedStyle(root).getPropertyValue('--mmh-accent').trim() || '#0ea5e9';
    const text = getComputedStyle(root).getPropertyValue('--mmh-text').trim() || '#0f172a';
    const border = getComputedStyle(root).getPropertyValue('--mmh-border').trim() || '#e2e8f0';
    const bg2 = getComputedStyle(root).getPropertyValue('--mmh-bg2').trim() || '#f8fafc';

    const pw = window.open('', 'Print', 'width=520,height=800');
    if (!pw) return;
    const s = slip;
    const allw = (s.houseAllowance||0) + (s.medicalAllowance||0) + (s.transportAllowance||0);
    pw.document.write(`<!DOCTYPE html><html><head><title>Salary Slip</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
      :root {
        --mmh-accent: ${accent};
        --mmh-text: ${text};
        --mmh-border: ${border};
        --mmh-bg2: ${bg2};
      }
      *{box-sizing:border-box;margin:0;padding:0}body{background:white;display:flex;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif}
      .w{width:420px;background:white;color:var(--mmh-text);border:1px solid var(--mmh-border);border-radius:14px;overflow:hidden}
      .hd{background:var(--mmh-accent);color:white;padding:18px 22px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .hd-h{font-size:18px;font-weight:900;font-style:italic}.hd-s{font-size:11px;opacity:.75;margin-top:3px}.hd-t{font-size:10px;text-transform:uppercase;letter-spacing:.15em;opacity:.7;margin-top:5px}
      .bd{padding:18px 22px}.st{font-size:10px;font-weight:800;color:var(--mmh-accent);text-transform:uppercase;letter-spacing:.1em;margin:12px 0 8px;padding-bottom:4px;border-bottom:1.5px solid var(--mmh-border)}
      .row{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px dotted var(--mmh-bg2);color:var(--mmh-text)}.lbl{color:#64748b}.val{font-weight:600;color:var(--mmh-text)}.grn{color:#059669;font-weight:600}.red{color:#dc2626;font-weight:600}
      .net{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(14,165,233,0.05);border:2px solid var(--mmh-accent);border-radius:10px;margin-top:12px}.net-l{font-size:15px;font-weight:800;color:var(--mmh-accent)}.net-v{font-size:22px;font-weight:900;font-family:'JetBrains Mono',monospace;color:var(--mmh-accent)}
      .ft{background:var(--mmh-bg2);padding:10px 14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid var(--mmh-border)}
      @media print{body{padding:0}}</style></head><body><div class="w">
    <div class="hd"><div class="hd-h">🏥 Majida Memorial Hospital</div><div class="hd-s">Chiniot, Punjab</div><div class="hd-t">— Salary Slip — ${MONTHS[month-1]} ${year}</div></div>
    <div class="bd">
    <div class="st">Employee Details</div>
    ${[['Name',s.employee?.name],['ID',s.employee?.employeeId],['Department',s.employee?.department],['Designation',s.employee?.designation||'—']].map(([k,v])=>`<div class="row"><span class="lbl">${k}</span><span class="val">${v}</span></div>`).join('')}
    <div class="st">Earnings</div>
    ${[['Basic Salary',fmt(s.basicSalary||0)],['House Allowance',fmt(s.houseAllowance||0)],['Medical Allowance',fmt(s.medicalAllowance||0)],['Transport Allowance',fmt(s.transportAllowance||0)],['Overtime Pay',fmt(s.overtimePay||0)]].filter(([,v])=>v!=='0').map(([k,v])=>`<div class="row"><span class="lbl">${k}</span><span class="grn">${v}</span></div>`).join('')}
    <div class="row"><span class="lbl"><b>Total Earnings</b></span><span class="grn"><b>${fmt(s.grossSalary||0)}</b></span></div>
    <div class="st">Deductions</div>
    ${[['Tax',s.incomeTax],['EOBI',s.eobi],['Late Deduction',s.lateDeduction],['Absence Deduction',s.absentDeduction],['Half-Day Deduction',s.halfDayDeduction],['Loan Deduction',s.loanDeduction]].filter(([,v])=>(v as number)>0).map(([k,v])=>`<div class="row"><span class="lbl">${k}</span><span class="red">${fmt(v as number)}</span></div>`).join('')}
    <div class="row"><span class="lbl"><b>Total Deductions</b></span><span class="red"><b>${fmt(s.totalDeductions||0)}</b></span></div>
    <div class="net"><span class="net-l">NET SALARY</span><span class="net-v">${fmt(s.netSalary||0)}</span></div>
    </div><div class="ft">This is a system-generated salary slip — Majida Memorial Hospital, Chiniot</div>
    </div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);
    pw.document.close();
  };

  return (
    <div>
      <div className="mmh-card" style={{marginBottom:24,overflow:'visible'}}>
        <div className="mmh-card-accent-top" style={{background:'var(--mmh-accent)'}} />
        <div className="mmh-card-header"><div className="mmh-card-title">📄 Salary Slip Generator</div></div>
        <div className="mmh-card-body" style={{overflow:'visible'}}>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-end',overflow:'visible'}}>
            <div style={{flex:1,minWidth:220,overflow:'visible'}}>
              <TypeSearch options={empOptions} value={empId} onChange={v=>setEmpId(v)} placeholder="Search employee..." label="Employee" required />
            </div>
            <div style={{width:130}}>
              <TypeSearch options={monthOptions} value={String(month)} onChange={v=>setMonth(+v)} placeholder="Month..." label="Month" />
            </div>
            <div style={{width:100}}>
              <TypeSearch options={yearOptions} value={String(year)} onChange={v=>setYear(+v)} placeholder="Year..." label="Year" />
            </div>
            <button className="mmh-btn mmh-btn-primary" style={{height:46}} onClick={loadSlip} disabled={loading}>
              {loading ? '⏳ Loading...' : '📊 Load Slip'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mmh-banner-error" style={{marginBottom:16}}>⚠️ {error}</div>}

      {slip && (
        <div className="mmh-card">
          <div className="mmh-card-body" style={{padding:24}}>
            {/* Print-ready slip preview */}
            <div className="mmh-salary-slip">
              <div className="mmh-slip-pay-header">
                <div className="mmh-slip-pay-hospital">🏥 Majida Memorial Hospital</div>
                <div className="mmh-slip-pay-sub">Chiniot, Punjab</div>
                <div className="mmh-slip-pay-type">— Salary Slip — {MONTHS[month-1]} {year}</div>
              </div>
              <div className="mmh-slip-pay-body">
                <div className="mmh-slip-section-title">Employee Details</div>
                {[['Name',slip.employee?.name],['ID',slip.employee?.employeeId],['Department',slip.employee?.department],['Designation',slip.employee?.designation||'—']].map(([k,v])=>(
                  <div key={k as string} className="mmh-slip-pay-row"><span className="mmh-slip-pay-label">{k}</span><span className="mmh-slip-pay-val">{v}</span></div>
                ))}

                <div className="mmh-slip-section-title">Earnings</div>
                {[['Basic Salary',slip.basicSalary],['House Allowance',slip.houseAllowance],['Medical Allowance',slip.medicalAllowance],['Transport Allowance',slip.transportAllowance],['Overtime Pay',slip.overtimePay]].filter(([,v])=>(v as number||0)>0).map(([k,v])=>(
                  <div key={k as string} className="mmh-slip-pay-row"><span className="mmh-slip-pay-label">{k}</span><span className="mmh-slip-pay-green">{fmt(v as number || 0)}</span></div>
                ))}
                <div className="mmh-slip-pay-row"><span className="mmh-slip-pay-label" style={{fontWeight:700}}>Total Earnings</span><span className="mmh-slip-pay-green" style={{fontWeight:800}}>{fmt(slip.grossSalary||0)}</span></div>

                <div className="mmh-slip-section-title">Deductions</div>
                {[['Tax',slip.incomeTax],['EOBI',slip.eobi],['Late Deduction',slip.lateDeduction],['Absence Deduction',slip.absentDeduction],['Half-Day Deduction',slip.halfDayDeduction],['Loan Deduction',slip.loanDeduction]].filter(([,v])=>(v as number)>0).map(([k,v])=>(
                  <div key={k as string} className="mmh-slip-pay-row"><span className="mmh-slip-pay-label">{k}</span><span className="mmh-slip-pay-red">{fmt(v as number)}</span></div>
                ))}
                <div className="mmh-slip-pay-row"><span className="mmh-slip-pay-label" style={{fontWeight:700}}>Total Deductions</span><span className="mmh-slip-pay-red" style={{fontWeight:800}}>{fmt(slip.totalDeductions||0)}</span></div>

                <div className="mmh-slip-net-box">
                  <span className="mmh-slip-net-label">NET SALARY</span>
                  <span className="mmh-slip-net-amount">{fmt(slip.netSalary||0)}</span>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:20}}>
              <button className="mmh-btn mmh-btn-primary" onClick={printSlip}>🖨️ Print Slip</button>
              <button className="mmh-btn mmh-btn-ghost" onClick={printSlip}>📥 Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlipTab;
