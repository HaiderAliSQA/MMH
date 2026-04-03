import React, { useState, useCallback } from 'react';
import { reportsAPI } from '../../api';

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-PK', { maximumFractionDigits: 0 });

const fmtPKR = (n: number) => `PKR ${fmt(Math.abs(n))}`;

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtShortDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()}-${dt.toLocaleString('en', { month: 'short' })}`;
};

// ── Period Selector ─────────────────────────────────────────────────────────
interface PeriodSelectorProps {
  period: string;
  setPeriod: (p: string) => void;
  fromDate: string;
  setFromDate: (d: string) => void;
  toDate: string;
  setToDate: (d: string) => void;
  onApply: () => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period, setPeriod, fromDate, setFromDate, toDate, setToDate, onApply,
}) => (
  <div className="mmh-period-selector">
    {['today', 'week', 'month', 'year'].map((p) => (
      <button
        key={p}
        className={period === p ? 'active' : ''}
        onClick={() => { setPeriod(p); }}
      >
        {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
      </button>
    ))}
    <span style={{ color: 'var(--mmh-text3)', fontSize: 12 }}>or</span>
    <input
      type="date"
      className="mmh-input"
      style={{ width: 150, height: 36, fontSize: 12 }}
      value={fromDate}
      onChange={(e) => { setFromDate(e.target.value); setPeriod(''); }}
    />
    <input
      type="date"
      className="mmh-input"
      style={{ width: 150, height: 36, fontSize: 12 }}
      value={toDate}
      onChange={(e) => { setToDate(e.target.value); setPeriod(''); }}
    />
    <button className="mmh-btn mmh-btn-primary mmh-btn-sm" onClick={onApply}>
      Apply
    </button>
  </div>
);

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) => (
  <div className="mmh-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <span className="mmh-stat-icon">{icon}</span>
    <div className="mmh-stat-value" style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
    <div className="mmh-stat-label">{label}</div>
  </div>
);

// ── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="mmh-empty">
    <div className="mmh-empty-icon">📊</div>
    <div className="mmh-empty-text">No data for this period</div>
    <div className="mmh-empty-sub">Try selecting a different date range</div>
  </div>
);

// ── Loading Spinner ─────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
    <div className="mmh-loader" />
  </div>
);

// ── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, color = '#10b981' }: { data: { date: string; count: number }[]; color?: string }) => {
  if (!data.length) return <EmptyState />;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const W = 700;
  const H = 180;
  const barW = Math.max(8, Math.min(40, (W - 40) / data.length - 4));
  const gap = (W - 40) / data.length;

  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <svg width={Math.max(W, data.length * (barW + 4) + 40)} height={H + 50} viewBox={`0 0 ${Math.max(W, data.length * (barW + 4) + 40)} ${H + 50}`}>
        {data.map((d, i) => {
          const x = 20 + i * gap + (gap - barW) / 2;
          const barH = Math.max(4, (d.count / maxVal) * (H - 20));
          const y = H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={11} fill="#94a3b8">{d.count}</text>
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#64748b">{fmtShortDate(d.date)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Tab 1: Dispensary Summary ────────────────────────────────────────────────
const DispensaryTab: React.FC<{ data: any; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return <EmptyState />;
  return (
    <div style={{ animation: 'mmh-fade-in 0.35s ease' }}>
      <div className="mmh-stats-grid">
        <StatCard label="Total Dispenses" value={fmt(data.totalDispenses)} icon="💊" color="#10b981" />
        <StatCard label="Unique Patients" value={fmt(data.uniquePatients)} icon="👥" color="#0ea5e9" />
        <StatCard label="Trust Patients" value={fmt(data.trustPatients)} icon="⭐" color="#8b5cf6" />
        <StatCard label="BPL Patients" value={fmt(data.bplPatients)} icon="🤝" color="#f59e0b" />
      </div>

      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-header">
          <div className="mmh-card-title">📈 Daily Dispenses Trend</div>
        </div>
        <div className="mmh-card-body">
          {data.dailyTrend?.length > 0
            ? <BarChart data={data.dailyTrend} color="#10b981" />
            : <EmptyState />}
        </div>
      </div>

      <div className="mmh-card">
        <div className="mmh-card-header">
          <div className="mmh-card-title">💊 Top 10 Dispensed Medicines</div>
        </div>
        <div className="mmh-card-body" style={{ padding: 0 }}>
          {data.topMedicines?.length > 0 ? (
            <table className="mmh-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Medicine Name</th>
                  <th style={{ textAlign: 'right' }}>Total Units</th>
                  <th style={{ textAlign: 'right' }}>Times Dispensed</th>
                </tr>
              </thead>
              <tbody>
                {data.topMedicines.map((m: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <span style={{
                        display: 'inline-flex', width: 24, height: 24, borderRadius: '50%',
                        background: i < 3 ? 'var(--mmh-accent)' : 'var(--mmh-card2)',
                        color: i < 3 ? 'white' : 'var(--mmh-text3)',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                      }}>{i + 1}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{m.name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 700 }}>{fmt(m.totalQty)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--mmh-text2)' }}>{fmt(m.times)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState />}
        </div>
      </div>
    </div>
  );
};

// ── Tab 2: Beneficiaries ─────────────────────────────────────────────────────
const BeneficiariesTab: React.FC<{ data: any; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return <EmptyState />;
  return (
    <div style={{ animation: 'mmh-fade-in 0.35s ease' }}>
      <div className="mmh-stats-grid">
        <StatCard label="Total Beneficiaries" value={fmt(data.totalUniqueBeneficiaries)} icon="🫶" color="#0ea5e9" />
        <StatCard label="New This Period" value={fmt(data.newPatients)} icon="✨" color="#10b981" />
        <StatCard label="Repeat Patients" value={fmt(data.repeatPatients)} icon="🔄" color="#f59e0b" />
        <StatCard
          label="Trust / BPL Ratio"
          value={`${data.trustBeneficiaries} / ${data.bplBeneficiaries}`}
          icon="⚖️"
          color="#8b5cf6"
        />
      </div>

      <div className="mmh-card">
        <div className="mmh-card-header">
          <div className="mmh-card-title">👥 Beneficiary List</div>
          <span style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{data.totalUniqueBeneficiaries} people served</span>
        </div>
        <div className="mmh-card-body" style={{ padding: 0 }}>
          {data.beneficiaries?.length > 0 ? (
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>MR #</th>
                  <th>Patient Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Visits</th>
                  <th style={{ textAlign: 'center' }}>Medicines</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {data.beneficiaries.map((b: any) => (
                  <tr key={b._id} style={{
                    background: b.patientType === 'Trust'
                      ? 'rgba(16,185,129,0.04)'
                      : b.patientType === 'BPL'
                        ? 'rgba(14,165,233,0.04)'
                        : undefined,
                  }}>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--mmh-accent)' }}>{b.mrNumber}</span></td>
                    <td style={{ fontWeight: 700 }}>{b.name}</td>
                    <td>
                      <span className={`mmh-badge ${b.patientType === 'Trust' ? 'mmh-badge-green' : b.patientType === 'BPL' ? 'mmh-badge-sky' : 'mmh-badge-gray'}`}>
                        {b.patientType || 'Regular'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{b.visits}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: '#10b981' }}>{b.medicinesReceived}</td>
                    <td style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{b.lastVisit ? fmtDate(b.lastVisit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState />}
        </div>
      </div>
    </div>
  );
};

// ── Tab 3: Fund Utilization ──────────────────────────────────────────────────
const FundTab: React.FC<{ data: any; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return <EmptyState />;

  const flowItems = [
    { label: 'Pharmacy Revenue', value: data.totalRevenue, icon: '🏦', cls: 'mmh-flow-in', pct: null },
    { label: 'OPD Fees', value: data.opdRevenue, icon: '🩺', cls: 'mmh-flow-in', pct: data.totalRevenue > 0 ? ((data.opdRevenue / data.totalRevenue) * 100).toFixed(1) : '0' },
    { label: 'Lab Collections', value: data.labRevenue, icon: '🧪', cls: 'mmh-flow-in', pct: data.totalRevenue > 0 ? ((data.labRevenue / data.totalRevenue) * 100).toFixed(1) : '0' },
    { label: 'Medicine Sales', value: data.medRevenue, icon: '💊', cls: 'mmh-flow-in', pct: data.totalRevenue > 0 ? ((data.medRevenue / data.totalRevenue) * 100).toFixed(1) : '0' },
  ];

  const outItems = [
    { label: 'Free Dispensary Cost', value: data.dispensaryCost, icon: '🎁', cls: 'mmh-flow-out', pct: data.totalRevenue > 0 ? data.crossSubsidyRatio : '0' },
    { label: 'Operational Costs (est. 40%)', value: data.operationalCost, icon: '⚙️', cls: 'mmh-flow-out', pct: '40.0' },
    { label: 'Net Trust Surplus', value: data.netForTrust, icon: '✅', cls: 'mmh-flow-net', pct: data.totalRevenue > 0 ? (((data.netForTrust) / data.totalRevenue) * 100).toFixed(1) : '0' },
  ];

  return (
    <div style={{ animation: 'mmh-fade-in 0.35s ease' }}>
      <div className="mmh-stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Total Revenue" value={fmtPKR(data.totalRevenue)} icon="💰" color="#10b981" />
        <StatCard label="Dispensary Cost" value={fmtPKR(data.dispensaryCost)} icon="🎁" color="#f59e0b" />
        <StatCard label="Units Given Free" value={fmt(data.totalMedicineUnitsGiven)} icon="💊" color="#8b5cf6" />
        <StatCard label={data.isSelfSustaining ? '✅ Self-Sustaining' : '⚠️ Needs Support'} value={fmtPKR(data.netForTrust)} icon="📊" color={data.isSelfSustaining ? '#10b981' : '#f43f5e'} />
      </div>

      {/* Fund Flow Diagram */}
      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-header">
          <div className="mmh-card-title">📊 Trust Fund Flow</div>
          <span className={`mmh-badge ${data.isSelfSustaining ? 'mmh-badge-green' : 'mmh-badge-rose'}`}>
            {data.isSelfSustaining ? '✅ Self-Sustaining' : '⚠️ Needs Support'}
          </span>
        </div>
        <div className="mmh-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'center' }}>
            {/* Inflows */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>📈 Income</div>
              {flowItems.map((f, i) => (
                <div key={i} className={`mmh-flow-box ${f.cls}`} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.icon} {f.label}</span>
                    {f.pct && <span className="mmh-badge mmh-badge-green">{f.pct}%</span>}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{fmtPKR(f.value)}</div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="mmh-flow-arrow" style={{ fontSize: 32, padding: '0 10px' }}>⟶</div>

            {/* Outflows */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>📉 Expenditure</div>
              {outItems.map((f, i) => (
                <div key={i} className={`mmh-flow-box ${f.cls}`} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.icon} {f.label}</span>
                    {f.pct && <span className="mmh-badge mmh-badge-amber">{f.pct}%</span>}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 900,
                    color: f.cls === 'mmh-flow-net' ? '#0ea5e9' : '#f59e0b', marginTop: 4,
                  }}>{fmtPKR(f.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 4: Pharmacy Revenue ──────────────────────────────────────────────────
const RevenueTab: React.FC<{ data: any; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return <EmptyState />;

  const purposeColors: Record<string, string> = {
    OPD: '#0ea5e9', Lab: '#8b5cf6', Pharmacy: '#10b981', Admission: '#f59e0b', Other: '#64748b',
  };

  const total = data.totalRevenue || 1;
  const purposes = Object.entries(data.byPurpose || {}) as [string, number][];
  const methods = Object.entries(data.byMethod || {}) as [string, number][];

  return (
    <div style={{ animation: 'mmh-fade-in 0.35s ease' }}>
      <div className="mmh-stats-grid">
        <StatCard label="Total Revenue" value={fmtPKR(data.totalRevenue)} icon="💰" color="#10b981" />
        <StatCard label="OPD Fees" value={fmtPKR(data.byPurpose?.['OPD'] || 0)} icon="🩺" color="#0ea5e9" />
        <StatCard label="Lab Revenue" value={fmtPKR(data.byPurpose?.['Lab'] || 0)} icon="🧪" color="#8b5cf6" />
        <StatCard label="Total Transactions" value={fmt(data.totalTransactions)} icon="🧾" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Revenue by purpose */}
        <div className="mmh-card">
          <div className="mmh-card-header"><div className="mmh-card-title">📊 By Purpose</div></div>
          <div className="mmh-card-body">
            {purposes.length > 0 ? purposes.sort((a,b) => b[1]-a[1]).map(([purpose, amount]) => {
              const pct = ((amount / total) * 100).toFixed(1);
              return (
                <div key={purpose} className="mmh-rev-bar-row">
                  <div className="mmh-rev-bar-label">{purpose}</div>
                  <div className="mmh-rev-bar-track">
                    <div className="mmh-rev-bar-fill" style={{ width: `${pct}%`, background: purposeColors[purpose] || '#64748b' }} />
                  </div>
                  <div className="mmh-rev-bar-amount">{fmtPKR(amount)}</div>
                  <div className="mmh-rev-bar-pct">{pct}%</div>
                </div>
              );
            }) : <EmptyState />}
          </div>
        </div>

        {/* Revenue by method */}
        <div className="mmh-card">
          <div className="mmh-card-header"><div className="mmh-card-title">💳 By Payment Method</div></div>
          <div className="mmh-card-body" style={{ padding: 0 }}>
            {methods.length > 0 ? (
              <table className="mmh-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.sort((a,b)=>b[1]-a[1]).map(([method, amount]) => (
                    <tr key={method}>
                      <td style={{ fontWeight: 700 }}>{method}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 700 }}>{fmtPKR(amount)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--mmh-text3)', fontSize: 12 }}>{((amount / total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState />}
          </div>
        </div>
      </div>

      {/* Daily Revenue */}
      {data.revenueTrend?.length > 0 && (
        <div className="mmh-card" style={{ marginTop: 20 }}>
          <div className="mmh-card-header"><div className="mmh-card-title">📅 Daily Revenue</div></div>
          <div className="mmh-card-body">
            <BarChart data={data.revenueTrend.map((d: any) => ({ date: d.date, count: Math.round(d.amount / 1000) }))} color="#0ea5e9" />
            <div style={{ fontSize: 11, color: 'var(--mmh-text3)', textAlign: 'center', marginTop: 4 }}>Values in PKR thousands (000)</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Tab 5: Board Summary ─────────────────────────────────────────────────────
const BoardTab: React.FC<{ data: any; loading: boolean; period: string; fromDate: string; toDate: string }> = ({ data, loading, period, fromDate, toDate }) => {
  if (loading) return <Spinner />;
  if (!data) return <EmptyState />;

  const printReport = () => {
    const periodLabel = period ? `Period: ${period.charAt(0).toUpperCase() + period.slice(1)}` :
      fromDate && toDate ? `Period: ${fmtDate(fromDate)} – ${fmtDate(toDate)}` : 'Period: This Month';
    const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>MMH Board Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #000; padding: 40px; font-size: 13px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #0c3b6b; padding-bottom: 20px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #0c3b6b; margin-bottom: 6px; }
    .header p { font-size: 13px; color: #555; }
    .section { margin-bottom: 24px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .section-title { background: #0c3b6b; color: white; padding: 10px 16px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #f0f0f0; }
    .row:last-child { border-bottom: none; }
    .row .key { color: #555; }
    .row .val { font-weight: 700; font-family: monospace; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #555; }
    .sig-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 5px; width: 200px; text-align: center; font-size: 11px; }
    .stamp { color: #10b981; font-weight: 900; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 MAJIDA MEMORIAL HOSPITAL</h1>
    <p><strong>Monthly Performance & Trust Report</strong></p>
    <p>${periodLabel} &nbsp;|&nbsp; Generated: ${today}</p>
  </div>

  <div class="section">
    <div class="section-title">👥 Patient Services</div>
    <div class="row"><span class="key">New Patient Registrations</span><span class="val">${fmt(data.patients.newRegistrations)}</span></div>
    <div class="row"><span class="key">OPD Visits</span><span class="val">${fmt(data.patients.opdVisits)}</span></div>
    <div class="row"><span class="key">Currently Admitted</span><span class="val">${fmt(data.patients.currentlyAdmitted)}</span></div>
    <div class="row"><span class="key">Lab Tests Completed</span><span class="val">${fmt(data.patients.labTestsDone)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">🎁 Trust Dispensary (Free Medicines)</div>
    <div class="row"><span class="key">Beneficiaries Served</span><span class="val">${fmt(data.dispensary.beneficiariesServed)}</span></div>
    <div class="row"><span class="key">Total Dispenses</span><span class="val">${fmt(data.dispensary.totalDispenses)}</span></div>
    <div class="row"><span class="key">Free Medicines Given</span><span class="val">${fmt(data.dispensary.medicinesGiven)} units</span></div>
    <div class="row"><span class="key">Low Stock Alerts</span><span class="val" style="color:${data.dispensary.lowStockAlerts > 0 ? '#e11d48' : '#10b981'}">${data.dispensary.lowStockAlerts}</span></div>
    <div class="row"><span class="key">Dispensary Status</span><span class="val stamp">Active</span></div>
  </div>

  <div class="section">
    <div class="section-title">💰 Financial Summary</div>
    <div class="row"><span class="key">Total Revenue (Pharmacy + OPD + Lab)</span><span class="val">${fmtPKR(data.financials.totalRevenue)}</span></div>
    <div class="row"><span class="key">Dispensary Cost (est. @ PKR 15/unit)</span><span class="val">${fmtPKR(data.financials.estimatedDispensaryCost)}</span></div>
    <div class="row"><span class="key">Net Trust Surplus</span><span class="val stamp">${fmtPKR(Math.max(0, data.financials.netSurplus))}</span></div>
    <div class="row"><span class="key">Self-Sustaining</span><span class="val stamp">${data.financials.netSurplus > 0 ? '✅ YES' : '❌ Needs Support'}</span></div>
  </div>

  <div class="footer">
    <div>
      <div>Prepared by: Admin — MMH</div>
      <div style="margin-top:4px">Date: ${today}</div>
    </div>
    <div class="sig-line">Authorized Signature</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div style={{ animation: 'mmh-fade-in 0.35s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="mmh-btn mmh-btn-primary" onClick={printReport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          🖨️ Print Board Report
        </button>
      </div>

      {/* Board summary preview */}
      <div className="mmh-card" style={{ border: '2px solid var(--mmh-border2)', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0c3b6b, #0ea5e9)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '0.02em' }}>MAJIDA MEMORIAL HOSPITAL</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Monthly Performance & Trust Report</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            Generated: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="mmh-card-body">
          {/* Patient Services */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--mmh-accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>👥 Patient Services</div>
            {[
              ['New Registrations', fmt(data.patients.newRegistrations)],
              ['OPD Visits', fmt(data.patients.opdVisits)],
              ['Currently Admitted', fmt(data.patients.currentlyAdmitted)],
              ['Lab Tests Done', fmt(data.patients.labTestsDone)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--mmh-border)' }}>
                <span style={{ color: 'var(--mmh-text2)', fontSize: 13 }}>{k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--mmh-text)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Dispensary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>🎁 Trust Dispensary</div>
            {[
              ['Beneficiaries Served', fmt(data.dispensary.beneficiariesServed)],
              ['Total Dispenses', fmt(data.dispensary.totalDispenses)],
              ['Free Medicines Given', `${fmt(data.dispensary.medicinesGiven)} units`],
              ['Low Stock Alerts', String(data.dispensary.lowStockAlerts)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--mmh-border)' }}>
                <span style={{ color: 'var(--mmh-text2)', fontSize: 13 }}>{k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#10b981' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Financial */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>💰 Financial Summary</div>
            {[
              ['Total Revenue', fmtPKR(data.financials.totalRevenue)],
              ['Dispensary Cost (est.)', fmtPKR(data.financials.estimatedDispensaryCost)],
              ['Net Trust Surplus', fmtPKR(Math.max(0, data.financials.netSurplus))],
              ['Self-Sustaining', data.financials.netSurplus > 0 ? '✅ YES' : '❌ Needs Support'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--mmh-border)' }}>
                <span style={{ color: 'var(--mmh-text2)', fontSize: 13 }}>{k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--mmh-text)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--mmh-border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--mmh-text3)' }}>
            <span>Prepared by: Admin — MMH</span>
            <span>Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Reports Page ────────────────────────────────────────────────────────
const TABS = [
  { key: 'dispensary', label: '📊 Dispensary', },
  { key: 'beneficiaries', label: '👥 Beneficiaries' },
  { key: 'fund', label: '💰 Fund Utilization' },
  { key: 'revenue', label: '🏦 Revenue' },
  { key: 'board', label: '📋 Board Summary' },
];

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dispensary');
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [dispensaryData, setDispensaryData] = useState<any>(null);
  const [beneData, setBeneData] = useState<any>(null);
  const [fundData, setFundData] = useState<any>(null);
  const [revData, setRevData] = useState<any>(null);
  const [boardData, setBoardData] = useState<any>(null);

  const getParams = useCallback(() => {
    if (fromDate && toDate) return { from: fromDate, to: toDate };
    return { period: period || 'month' };
  }, [period, fromDate, toDate]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const params = getParams();
    try {
      if (activeTab === 'dispensary') {
        const r = await reportsAPI.dispensarySummary(params);
        setDispensaryData(r.data.data);
      } else if (activeTab === 'beneficiaries') {
        const r = await reportsAPI.beneficiaries(params);
        setBeneData(r.data.data);
      } else if (activeTab === 'fund') {
        const r = await reportsAPI.fundUtilization(params);
        setFundData(r.data.data);
      } else if (activeTab === 'revenue') {
        const r = await reportsAPI.pharmacyRevenue(params);
        setRevData(r.data.data);
      } else if (activeTab === 'board') {
        const r = await reportsAPI.boardSummary(params);
        setBoardData(r.data.data);
      }
    } catch (err) {
      console.error('Report load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getParams]);

  // Auto-load when tab changes
  React.useEffect(() => {
    loadReport();
  }, [activeTab]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    setFromDate('');
    setToDate('');
  };

  const handleApply = () => {
    loadReport();
  };

  const periodProps = { period, setPeriod: handlePeriodChange, fromDate, setFromDate, toDate, setToDate, onApply: handleApply };

  const currentData = activeTab === 'dispensary' ? dispensaryData
    : activeTab === 'beneficiaries' ? beneData
    : activeTab === 'fund' ? fundData
    : activeTab === 'revenue' ? revData
    : boardData;

  return (
    <div style={{ animation: 'mmh-slide-up 0.35s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">📊 Trust Reports</h1>
          <p className="mmh-page-subtitle">
            Hospital performance analytics for donors, admin & trust board
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading && <div className="mmh-spinner mmh-spinner-dark" />}
          <span className="mmh-badge mmh-badge-green">Live Data</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--mmh-border)', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`mmh-page-tab ${activeTab === t.key ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period Selector */}
      <PeriodSelector {...periodProps} />

      {/* Tab Content */}
      {activeTab === 'dispensary' && <DispensaryTab data={dispensaryData} loading={loading} />}
      {activeTab === 'beneficiaries' && <BeneficiariesTab data={beneData} loading={loading} />}
      {activeTab === 'fund' && <FundTab data={fundData} loading={loading} />}
      {activeTab === 'revenue' && <RevenueTab data={revData} loading={loading} />}
      {activeTab === 'board' && <BoardTab data={boardData} loading={loading} period={period} fromDate={fromDate} toDate={toDate} />}

      {/* Show empty state only if not loading and no data */}
      {!loading && !currentData && <EmptyState />}
    </div>
  );
};

export default ReportsPage;
