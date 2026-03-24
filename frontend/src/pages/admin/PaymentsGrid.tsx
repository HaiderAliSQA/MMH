import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Payment {
  _id: string;
  invoiceNumber: string;
  patient?: { _id: string; name: string; mrNumber: string };
  patientName?: string;
  amount: number;
  paymentMethod: string;
  purpose: string;
  status: string;
  collectedBy?: { name: string };
  notes?: string;
  createdAt: string;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Insurance', 'JazzCash', 'EasyPaisa', 'Bank Transfer'];

const PaymentsGrid: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Filters & Pagination
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchPayments = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (method) params.method = method;
      if (search) params.search = search;

      const res = await api.get('/payments', { params });
      setPayments(res.data?.payments || []);
      setTotalRevenue(res.data?.totalRevenue || 0);
      setTotalPages(res.data?.totalPages || 0);
      setTotalCount(res.data?.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Fetch Payments Error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(0);
  }, [fromDate, toDate, method]); // Auto-fetch on filter change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.4s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">💳 Payments Management</h1>
          <p className="mmh-page-subtitle">Track hospital revenue and transactions</p>
        </div>
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.1)', 
          padding: '12px 24px', 
          borderRadius: 16, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
            <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Revenue (Selected Period)</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>PKR {totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mmh-card" style={{ marginBottom: 24 }}>
        <div className="mmh-card-body">
          <form className="mmh-form-grid" style={{ gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr) 1.5fr auto', gap: 16, alignItems: 'end' }} onSubmit={handleSearch}>
            <div className="mmh-field">
              <label className="mmh-label">From Date</label>
              <input type="date" className="mmh-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">To Date</label>
              <input type="date" className="mmh-input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Payment Method</label>
              <select className="mmh-input-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Search (Invoice / Patient / Notes)</label>
              <input type="text" className="mmh-input" placeholder="Enter search term..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="mmh-btn mmh-btn-primary" style={{ height: 42, padding: '0 24px' }}>🔍 Search</button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="mmh-card">
        <div className="mmh-card-body" style={{ padding: 0 }}>
          <div className="mmh-table-scroll" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Invoice #</th>
                  <th>Patient Detail</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Collector</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="mmh-empty" style={{ padding: 40 }}>Loading records...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} className="mmh-empty" style={{ padding: 40 }}>No payment records found for this criteria</td></tr>
                ) : (
                  payments.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ color: 'white', fontWeight: 500 }}>{new Date(p.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ opacity: 0.5, fontSize: 10 }}>{new Date(p.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 4 }}>{p.invoiceNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'white' }}>{p.patient?.name || p.patientName}</div>
                        <div style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{p.patient?.mrNumber || '—'}</div>
                      </td>
                      <td><span className="mmh-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>{p.purpose}</span></td>
                      <td style={{ fontWeight: 900, color: '#10b981', fontSize: 14 }}>PKR {p.amount.toLocaleString()}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{p.paymentMethod === 'Cash' ? '💵' : p.paymentMethod === 'Card' ? '💳' : '📱'}</span>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`mmh-badge ${p.status === 'Paid' ? 'mmh-badge-green' : 'mmh-badge-amber'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#94a3b8' }}>
                         👤 {p.collectedBy?.name || 'System Auto'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--mmh-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--mmh-bg2)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Showing {payments.length} of {totalCount} records — Page {page + 1} of {totalPages}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" disabled={page === 0} onClick={() => fetchPayments(page - 1)}>◀ Previous</button>
                    <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" disabled={page >= totalPages - 1} onClick={() => fetchPayments(page + 1)}>Next Page ▶</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsGrid;
