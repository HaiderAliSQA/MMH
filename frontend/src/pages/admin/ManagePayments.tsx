import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Payment {
  _id: string;
  invoiceNumber: string;
  patient?: { name: string; mrNumber: string };
  patientName: string;
  amount: number;
  method: string;
  purpose: string;
  refNo?: string;
  notes?: string;
  createdAt: string;
}

const ManagePayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('today');
  const [method, setMethod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let from = '';
      let to = new Date().toISOString();
      const now = new Date();

      if (dateRange === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        from = start.toISOString();
      } else if (dateRange === 'yesterday') {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        from = start.toISOString();
        const end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        to = end.toISOString();
      } else if (dateRange === 'week') {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        from = start.toISOString();
      } else if (dateRange === 'month') {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        from = start.toISOString();
      }

      const params: any = { method: method || undefined, search: searchTerm || undefined };
      if (from) {
        params.from = from;
        params.to = to;
      }

      const r = await api.get('/payments', { params });
      setPayments(r.data?.payments || []);
      setTotalRevenue(r.data?.totalRevenue || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [dateRange, method]);

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const getMethodBadge = (m: string) => {
    const ml = m.toLowerCase();
    let cls = 'mmh-badge-amber';
    if (ml.includes('cash')) cls = 'mmh-badge-green';
    else if (ml.includes('card') || ml.includes('bank')) cls = 'mmh-badge-sky';
    return <span className={`mmh-badge ${cls}`}>{m}</span>;
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Revenue Management</h1>
          <p className="mmh-page-subtitle">Track hospital income and filter transaction history</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="mmh-stat-card-mini" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '8px 15px', borderRadius: 10 }}>
             <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Period Revenue</div>
             <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399' }}>Rs. {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-body" style={{ padding: '15px 20px' }}>
          <form className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1.5fr auto', alignItems: 'end', gap: 15 }} onSubmit={handleSearchTrigger}>
            <div className="mmh-field">
              <label className="mmh-label">Date Period</label>
              <select className="mmh-input-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Payment Method</label>
              <select className="mmh-input-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Search Invoice / Patient</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                <input 
                  className="mmh-input" 
                  style={{ paddingLeft: 35 }} 
                  placeholder="Invoice # or Name..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button className="mmh-btn mmh-btn-primary" type="submit" style={{ height: 40, padding: '0 20px' }}>
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      <div className="mmh-table-card">
        <div className="mmh-table-card-top" />
        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Purpose</th>
                <th>Recorded At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="mmh-empty">Loading financial data...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="mmh-empty">
                   <div className="mmh-empty-icon">💸</div>
                   <div className="mmh-empty-text">No transactions found</div>
                </td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#0ea5e9', fontSize: 13, fontWeight: 700 }}>
                    {p.invoiceNumber}
                  </td>
                  <td>
                    <div className="mmh-td-name">{p.patient?.name || p.patientName}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono' }}>{p.patient?.mrNumber || 'Walk-in'}</div>
                  </td>
                  <td style={{ fontWeight: 900, color: '#10b981' }}>
                    Rs. {p.amount.toLocaleString()}
                  </td>
                  <td>{getMethodBadge(p.method)}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{p.purpose}</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>
                    {new Date(p.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: '#475569' }}>
                    {p.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagePayments;
