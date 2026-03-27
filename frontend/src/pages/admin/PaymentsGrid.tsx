import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import Pagination from '../../components/Pagination';

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

const PaymentsGrid: React.FC<{ 
  forceSource?: string; 
  forceCollectorId?: string;
  title?: string; 
  hideHeader?: boolean;
  onStatsUpdate?: (stats: { total: number; revenue: number }) => void;
}> = ({ 
  forceSource, 
  forceCollectorId,
  title = '💳 Payments Management',
  hideHeader = false,
  onStatsUpdate
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Filters & Pagination
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState(forceSource || '');
  const [collector, setCollector] = useState(forceCollectorId || '');
  const [users, setUsers] = useState<any[]>([]);
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
      if (source) params.source = source;
      if (collector) params.collector = collector;

      const res = await api.get('/payments', { params });
      setPayments(res.data?.payments || []);
      setTotalRevenue(res.data?.totalRevenue || 0);
      setTotalPages(res.data?.totalPages || 0);
      setTotalCount(res.data?.total || 0);
      setPage(p);
      
      if (onStatsUpdate) {
        onStatsUpdate({ 
          total: res.data?.total || 0, 
          revenue: res.data?.totalRevenue || 0 
        });
      }
    } catch (err) {
      console.error('Fetch Payments Error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        // Only show users who could reasonably be collectors (receptionists, pharmacists, managers, admins)
        const possibleCollectors = (res.data || []).filter((u: any) => 
          ['receptionist', 'pharmacist', 'manager', 'admin'].includes(u.role)
        );
        setUsers(possibleCollectors);
      } catch {}
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchPayments(0);
  }, [fromDate, toDate, method, source, collector]); // Auto-fetch on filter change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.4s ease' }}>
      {!hideHeader && (
        <div className="mmh-page-header">
          <div>
            <h1 className="mmh-page-title">{title}</h1>
            <p className="mmh-page-subtitle">Track hospital revenue and transactions</p>
          </div>
          <div style={{ 
            background: 'var(--mmh-bg3)', 
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--mmh-border)', 
            padding: '12px 24px', 
            borderRadius: 16, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
              <span style={{ fontSize: 11, color: 'var(--mmh-text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Revenue (Selected Period)</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--mmh-success)', fontFamily: 'JetBrains Mono, monospace' }}>PKR {totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mmh-card" style={{ marginBottom: 24 }}>
        <div className="mmh-card-body">
          <form className="mmh-form-grid" style={{ gridTemplateColumns: `repeat(${[!forceSource, !forceCollectorId, true, true, true].filter(Boolean).length}, 1fr) auto`, gap: 16, alignItems: 'end' }} onSubmit={handleSearch}>
            <div className="mmh-field">
              <label className="mmh-label">From Date</label>
              <input type="date" className="mmh-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">To Date</label>
              <input type="date" className="mmh-input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="mmh-field" style={{ display: forceSource ? 'none' : 'block' }}>
              <label className="mmh-label">Payment Source</label>
              <select className="mmh-input-select" value={source} onChange={e => setSource(e.target.value)}>
                <option value="">All Sources</option>
                <option value="reception">Reception</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>
            <div className="mmh-field" style={{ display: forceCollectorId ? 'none' : 'block' }}>
              <label className="mmh-label">Collector Name</label>
              <select className="mmh-input-select" value={collector} onChange={e => setCollector(e.target.value)}>
                <option value="">All Collectors</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Payment Method</label>
              <select className="mmh-input-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* Search filter commented out as requested */}
            {/* 
            <div className="mmh-field">
              <label className="mmh-label">Search (Invoice / Patient / Notes)</label>
              <input type="text" className="mmh-input" placeholder="Enter search term..." value={search} onChange={e => setSearch(e.target.value)} />
            </div> 
            */}
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
                  <th>Patient</th>
                  <th>MR#</th>
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
                        <div style={{ color: 'var(--mmh-text)', fontWeight: 500 }}>{new Date(p.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ color: 'var(--mmh-text3)', fontSize: 10 }}>{new Date(p.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--mmh-success)', fontWeight: 700, background: 'var(--mmh-success-soft)', padding: '4px 8px', borderRadius: 4 }}>{p.invoiceNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--mmh-text)' }}>{p.patient?.name || p.patientName}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--mmh-accent)', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>{p.patient?.mrNumber || '—'}</div>
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--mmh-success)', fontSize: 14 }}>PKR {p.amount.toLocaleString()}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{p.paymentMethod === 'Cash' ? '💵' : p.paymentMethod === 'Card' ? '💳' : p.paymentMethod === 'Insurance' ? '🏥' : '📱'}</span>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`mmh-badge ${p.status === 'Paid' ? 'mmh-badge-green' : 'mmh-badge-amber'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--mmh-text)', fontWeight: 600 }}>
                         👤 {p.collectedBy?.name || 'System Auto'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination 
            totalResults={totalCount}
            currentPage={page + 1}
            rowsPerPage={limit}
            onPageChange={(p) => fetchPayments(p - 1)}
            onRowsPerPageChange={() => {}} // Limit is fixed in this grid
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentsGrid;
