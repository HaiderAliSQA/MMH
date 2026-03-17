import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Medicine {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  expiry: string;
  unit: string;
  reorderLevel: number;
}

const ManageMedicines: React.FC = () => {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tablet',
    price: 0,
    quantity: 0,
    expiry: '',
    unit: 'Box',
    reorderLevel: 20
  });

  useEffect(() => {
    fetchMeds();
  }, []);

  const fetchMeds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicines');
      setMeds(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await api.put(`/medicines/${editingMed._id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      setModalOpen(false);
      fetchMeds();
    } catch (err) {
      alert("Error saving medicine");
    }
  };

  const deleteMed = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      fetchMeds();
    } catch (err) {
      alert("Error deleting");
    }
  };

  const filtered = meds.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other'];

  return (
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Pharmacy Inventory</h1>
          <p className="mmh-page-subtitle">Track stock levels, expiry dates and medicine categories</p>
        </div>
        <button
          className="mmh-btn mmh-btn-green"
          onClick={() => {
            setEditingMed(null);
            setFormData({ name: '', category: 'Tablet', price: 0, quantity: 0, expiry: '', unit: 'Box', reorderLevel: 20 });
            setModalOpen(true);
          }}
        >
          + Add New Medicine
        </button>
      </div>

      <div className="mmh-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="mmh-stat-card" style={{ padding: '16px' }}>
          <div className="mmh-stat-label">Total SKUs</div>
          <div className="mmh-stat-value" style={{ fontSize: '24px' }}>{meds.length}</div>
        </div>
        <div className="mmh-stat-card" style={{ padding: '16px' }}>
          <div className="mmh-stat-label">Low Stock</div>
          <div className="mmh-stat-value" style={{ fontSize: '24px', color: 'var(--mmh-rose)' }}>{meds.filter(m => m.quantity < m.reorderLevel).length}</div>
        </div>
        <div className="mmh-stat-card" style={{ padding: '16px' }}>
          <div className="mmh-stat-label">Expiring Soon</div>
          <div className="mmh-stat-value" style={{ fontSize: '24px', color: 'var(--mmh-amber)' }}>0</div>
        </div>
      </div>

      <div className="mmh-table-card">
        <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-green)' }} />
        <div className="mmh-table-card-header">
          <div className="mmh-search-wrap" style={{ maxWidth: '400px' }}>
            <span className="mmh-search-icon">🔍</span>
            <input
              className="mmh-search-input"
              placeholder="Search medicine name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchMeds}>🔄 Refresh</button>
        </div>

        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Inventory</th>
                <th>Expiry</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="mmh-empty">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="mmh-empty">No medicines found</td></tr>
              ) : filtered.map(m => (
                <tr key={m._id}>
                  <td className="mmh-td-name">{m.name}</td>
                  <td>
                    <span className="mmh-badge mmh-badge-gray">{m.category}</span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{m.price.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: m.quantity < m.reorderLevel ? 'var(--mmh-rose)' : 'white' }}>{m.quantity}</span>
                      <span style={{ fontSize: '10px', color: 'var(--mmh-muted)' }}>{m.unit}</span>
                    </div>
                  </td>
                  <td>{m.expiry ? new Date(m.expiry).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => {
                        setEditingMed(m);
                        setFormData({ ...m, expiry: m.expiry?.split('T')[0] || '' });
                        setModalOpen(true);
                      }}>✏️</button>
                      <button className="mmh-btn mmh-btn-danger mmh-btn-xs" onClick={() => deleteMed(m._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="mmh-overlay">
          <form className="mmh-modal mmh-modal-sm" onSubmit={handleSave}>
            <div className="mmh-modal-header">
              <div className="mmh-modal-title">{editingMed ? 'Edit Medicine' : 'Add New medicine'}</div>
              <button type="button" className="mmh-modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div className="mmh-field" style={{ marginBottom: '14px' }}>
                <label className="mmh-label">Name</label>
                <input className="mmh-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="mmh-form-grid">
                <div className="mmh-field">
                  <label className="mmh-label">Category</label>
                  <select className="mmh-input-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Unit</label>
                  <input className="mmh-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Price</label>
                  <input type="number" className="mmh-input" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Quantity</label>
                  <input type="number" className="mmh-input" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Expiry Date</label>
                  <input type="date" className="mmh-input" value={formData.expiry} onChange={e => setFormData({ ...formData, expiry: e.target.value })} />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Reorder Level</label>
                  <input type="number" className="mmh-input" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 20 })} />
                </div>
              </div>
            </div>
            <div className="mmh-modal-footer">
              <button type="button" className="mmh-btn mmh-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="mmh-btn mmh-btn-green">{editingMed ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageMedicines;
