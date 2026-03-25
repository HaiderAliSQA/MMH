import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../../api';

const fmt = (n: number) => n.toLocaleString();

const PayrollTab: React.FC<{ employees: any[] }> = ({ employees }) => {
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2026);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({ totalGross: 0, totalDeductions: 0, totalNet: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState<{type:string;msg:string}|null>(null);
  const [deductPopup, setDeductPopup] = useState<string|null>(null);

  useEffect(() => { loadPayroll(); }, [month, year]);

  const loadPayroll = async () => {
    setLoading(true);
    try { 
      const r = await hrAPI.getPayroll(month, year); 
      // The backend returns an object { payrolls, totals }
      const data = r.data || {};
      setPayroll(data.payrolls || []); 
      if (data.totals) setTotals(data.totals);
    }
    catch {} finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setBanner(null);
    try {
      await hrAPI.generateAll(month, year);
      setBanner({type:'success',msg:`Payroll generated for ${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]} ${year}`});
      loadPayroll();
    } catch (e:any) { setBanner({type:'error',msg:e.response?.data?.message||'Generation failed'}); }
    finally { setGenerating(false); }
  };

  const handleMarkPaid = async (id: string) => {
    try { await hrAPI.markPaid(id); loadPayroll(); } catch {}
  };

  const totalGross = totals.totalGross || 0;
  const totalDeduct = totals.totalDeductions || 0;
  const totalNet = totals.totalNet || 0;

  const exportCSV = () => {
    const hdr = 'Employee,ID,Basic,Allowances,Gross,Deductions,Net,Status\n';
    const rows = payroll.map(p =>
      `${p.employee?.name},${p.employee?.employeeId},${p.basicSalary},${(p.houseAllowance||0)+(p.medicalAllowance||0)+(p.transportAllowance||0)},${p.grossSalary},${p.totalDeductions},${p.netSalary},${p.status}`
    ).join('\n');
    const blob = new Blob([hdr+rows], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payroll-${month}-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {banner && <div className={`mmh-banner-${banner.type}`} style={{marginBottom:16}}>{banner.type==='success'?'✅':'⚠️'} {banner.msg}</div>}

      <div className="mmh-stats-grid" style={{marginBottom:24}}>
        {[
          { label:'Total Gross', value:fmt(totalGross), icon:'💰', accent:'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
          { label:'Deductions', value:fmt(totalDeduct), icon:'📉', accent:'linear-gradient(90deg,#f43f5e,#fb7185)' },
          { label:'Net Payable', value:fmt(totalNet), icon:'💵', accent:'linear-gradient(90deg,#10b981,#34d399)' },
          { label:'Employees', value:payroll.length, icon:'👥', accent:'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{background:c.accent}} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value" style={{fontSize: typeof c.value==='string'?18:30}}>{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
        <div className="mmh-field" style={{width:120}}>
          <select className="mmh-input-select" value={month} onChange={e=>setMonth(+e.target.value)}>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="mmh-field" style={{width:100}}>
          <select className="mmh-input-select" value={year} onChange={e=>setYear(+e.target.value)}>
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{flex:1}} />
        <button className="mmh-btn mmh-btn-green mmh-btn-sm" onClick={handleGenerate} disabled={generating}>
          {generating ? '⏳ Generating...' : '⚙️ Generate Payroll'}
        </button>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={exportCSV} disabled={payroll.length===0}>📥 Export CSV</button>
      </div>

      <div className="mmh-card">
        <div className="mmh-card-body" style={{padding:0}}>
          <div className="mmh-payroll-header-row mmh-payroll-table-row">
            <div>Employee</div><div>Basic</div><div>Allowances</div><div>Gross</div><div>Deductions</div><div>Status</div><div>Actions</div>
          </div>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}><div className="mmh-loader" /></div>
          ) : payroll.length === 0 ? (
            <div className="mmh-empty" style={{padding:'40px 0'}}><div className="mmh-empty-icon">💰</div><div className="mmh-empty-text">No payroll data. Click "Generate Payroll".</div></div>
          ) : payroll.map(p => (
            <div key={p._id} className="mmh-payroll-table-row" style={{position:'relative'}}>
              <div>
                <div style={{fontWeight:700,color:'white',fontSize:13}}>{p.employee?.name}</div>
                <div style={{fontSize:11,color:'#64748b'}}>{p.employee?.employeeId} · {p.employee?.department}</div>
              </div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:13}}>{fmt(p.basicSalary||0)}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#34d399'}}>+{fmt((p.houseAllowance||0)+(p.medicalAllowance||0)+(p.transportAllowance||0))}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:14,color:'#38bdf8'}}>{fmt(p.grossSalary||0)}</div>
              <div style={{position:'relative'}}>
                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" style={{color:'#fb7185',fontFamily:'JetBrains Mono,monospace',fontWeight:700}} onClick={()=>setDeductPopup(deductPopup===p._id?null:p._id)}>
                  -{fmt(p.totalDeductions||0)}
                </button>
                {deductPopup === p._id && (
                  <div className="mmh-payroll-deduct-popup" style={{top:'100%',left:0}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:700,color:'white',marginBottom:8,fontSize:13}}>Deduction Breakdown</div>
                    {[{l:'Tax',v:p.incomeTax},{l:'EOBI',v:p.eobi},{l:'Late',v:p.lateDeduction},{l:'Absent',v:p.absentDeduction},{l:'Half-Day',v:p.halfDayDeduction},{l:'Loan',v:p.loanDeduction}].map(d=>(
                      d.v > 0 && <div key={d.l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:12}}><span style={{color:'#94a3b8'}}>{d.l}</span><span style={{color:'#fb7185',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{fmt(d.v)}</span></div>
                    ))}
                    <div style={{height:1,background:'#1e3050',margin:'6px 0'}} />
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:800}}><span>Net:</span><span style={{color:'#34d399',fontFamily:'JetBrains Mono,monospace'}}>{fmt(p.netSalary||0)}</span></div>
                  </div>
                )}
              </div>
              <div><span className={`mmh-badge ${p.status==='Paid'?'mmh-badge-green':p.status==='Generated'?'mmh-badge-amber':'mmh-badge-gray'}`}>{p.status||'N/A'}</span></div>
              <div>
                {p.status === 'Generated' && <button className="mmh-btn mmh-btn-green mmh-btn-xs" onClick={()=>handleMarkPaid(p._id)}>💰 Pay</button>}
                {p.status === 'Paid' && <span style={{fontSize:11,color:'#34d399'}}>✅ Paid</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayrollTab;
