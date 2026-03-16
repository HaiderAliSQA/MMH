import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Medicine {
  _id: string;
  name: string;
  generic: string;
  category: string;
  quantity: number;
  minQty: number;
  price: number;
}

interface Patient {
  _id: string;
  name: string;
  mrNumber: string;
}

interface CartItem {
  medicineId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

const PharmacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dispense' | 'inventory'>('dispense');
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dispenseHistory, setDispenseHistory] = useState<any[]>([]);

  // Dispense State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Inventory State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    generic: '',
    category: '',
    unit: 'Tablet',
    quantity: 0,
    minQuantity: 20,
    pricePerUnit: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medsRes, patRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/patients')
      ]);
      setMedicines(medsRes.data || []);
      setPatients(patRes.data || []);
      
      // Mocking dispense history for now as per requirement
      // In a real app we'd fetch this from GET /api/dispense
      setDispenseHistory([
        { id: '1', patient: 'Ali Khan', medicines: 'Panadol (2), Amoxil (1)', total: 450, time: '10:30 AM', status: 'Completed' },
        { id: '2', patient: 'Sara Bibi', medicines: 'Brufen (1)', total: 120, time: '11:15 AM', status: 'Completed' }
      ]);
    } catch (error) {
      console.error("Pharmacy Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Dispense Logic ---
  const addToCart = (medId: string) => {
    const med = medicines.find(m => m._id === medId);
    if (!med) return;

    const existing = cart.find(c => c.medicineId === medId);
    if (existing) {
      setCart(cart.map(c => c.medicineId === medId ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price } : c));
    } else {
      setCart([...cart, { 
        medicineId: medId, 
        name: med.name, 
        qty: 1, 
        price: med.price, 
        total: med.price 
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQty = (index: number, qty: number) => {
    if (qty < 1) return;
    const newCart = [...cart];
    newCart[index].qty = qty;
    newCart[index].total = qty * newCart[index].price;
    setCart(newCart);
  };

  const runningTotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);

  const handleDispense = async () => {
    if (!selectedPatientId) return alert("Please select a patient");
    if (cart.length === 0) return alert("Cart is empty");

    setLoading(true);
    try {
      await api.post('/dispense', {
        patientId: selectedPatientId,
        items: cart,
        totalAmount: runningTotal
      });
      alert("Medicines dispensed successfully!");
      setCart([]);
      setSelectedPatientId('');
      fetchData(); // Refresh stock
    } catch (error) {
      console.error("Dispense error:", error);
      alert("Failed to dispense medicines.");
    } finally {
      setLoading(false);
    }
  };

  // --- Inventory Logic ---
  const inventoryStats = useMemo(() => {
    return {
      total: medicines.length,
      inStock: medicines.filter(m => m.quantity > (m.minQty || 0)).length,
      lowStock: medicines.filter(m => m.quantity > 0 && m.quantity <= (m.minQty || 0)).length,
      outOfStock: medicines.filter(m => m.quantity === 0).length
    };
  }, [medicines]);

  const filteredInventory = useMemo(() => {
    return medicines.filter(m => {
      const name = m.name || '';
      const generic = m.generic || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            generic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
      
      const minQty = m.minQty || 0;
      let matchesStock = true;
      if (stockFilter === 'In Stock') matchesStock = m.quantity > 0;
      if (stockFilter === 'Low Stock') matchesStock = m.quantity > 0 && m.quantity <= minQty;
      if (stockFilter === 'Out of Stock') matchesStock = m.quantity === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [medicines, searchQuery, categoryFilter, stockFilter]);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/medicines', newMed);
      alert("Medicine added successfully!");
      setShowAddModal(false);
      setNewMed({
        name: '',
        generic: '',
        category: '',
        unit: 'Tablet',
        quantity: 0,
        minQuantity: 20,
        pricePerUnit: 0
      });
      fetchData();
    } catch (error) {
      console.error("Add Medicine Error:", error);
      alert("Failed to add medicine.");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => ['All', ...new Set(medicines.map(m => m.category))], [medicines]);

  return (
    <div style={{ animation: 'mmh-fade-in 0.4s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">💊 Pharmacy Management</h1>
          <p className="mmh-page-subtitle">Dispensing, inventory control, and stock alerts</p>
        </div>
      </div>

      <div className="mmh-admin-tabs-wrap" style={{ marginBottom: '24px' }}>
        <div className="mmh-admin-tabs">
          <button 
            className={`mmh-admin-tab ${activeTab === 'dispense' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispense')}
          >
            <span>💊</span> Dispense
          </button>
          <button 
            className={`mmh-admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span>📦</span> Inventory
          </button>
        </div>
      </div>

      {activeTab === 'dispense' ? (
        <div className="mmh-tab-content">
          <div className="mmh-form-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '24px', alignItems: 'start' }}>
            
            {/* Dispense Controls */}
            <div className="mmh-card">
              <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-sky)' }} />
              <div className="mmh-card-header">
                <div className="mmh-card-title">Dispense Information</div>
              </div>
              <div className="mmh-card-body">
                <div className="mmh-field">
                  <label className="mmh-label">Select Patient</label>
                  <select 
                    className="mmh-input-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Choose Patient (MR Number / Name) --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.mrNumber} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mmh-divider" style={{ margin: '20px 0' }} />

                <div className="mmh-field">
                  <label className="mmh-label">Add Medicine to Cart</label>
                  <select 
                    className="mmh-input-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        addToCart(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">-- Search Medicines --</option>
                    {medicines.filter(m => m.quantity > 0).map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.quantity} available) - PKR {m.price}</option>
                    ))}
                  </select>
                </div>

                <div className="mmh-table-scroll" style={{ marginTop: '20px' }}>
                  <table className="mmh-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th style={{ width: '80px' }}>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="mmh-empty">Cart is empty</td>
                        </tr>
                      ) : (
                        cart.map((item, index) => (
                          <tr key={item.medicineId}>
                            <td className="mmh-td-name">{item.name}</td>
                            <td>
                              <input 
                                type="number" 
                                className="mmh-input-sm" 
                                value={item.qty} 
                                onChange={(e) => updateCartQty(index, parseInt(e.target.value) || 0)}
                                style={{ width: '60px', textAlign: 'center' }}
                              />
                            </td>
                            <td>{item.price}</td>
                            <td style={{ fontWeight: 700 }}>{item.total}</td>
                            <td>
                              <button 
                                className="mmh-btn mmh-btn-danger mmh-btn-xs"
                                onClick={() => removeFromCart(index)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Receipt Summary */}
            <div className="mmh-card">
              <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-green)' }} />
              <div className="mmh-card-header">
                <div className="mmh-card-title">Dispense Summary</div>
              </div>
              <div className="mmh-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--mmh-muted)' }}>Subtotal</span>
                  <span style={{ color: 'white' }}>PKR {runningTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--mmh-muted)' }}>Taxes</span>
                  <span style={{ color: 'white' }}>PKR 0</span>
                </div>
                <div className="mmh-divider" style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>Total Payable</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--mmh-green)' }}>PKR {runningTotal}</span>
                </div>

                <button 
                  className="mmh-btn mmh-btn-primary" 
                  style={{ width: '100%', marginTop: '24px', height: '50px', fontSize: '16px' }}
                  disabled={loading || cart.length === 0 || !selectedPatientId}
                  onClick={handleDispense}
                >
                  {loading ? 'Processing...' : 'Confirm Dispense'}
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="mmh-card" style={{ marginTop: '30px' }}>
            <div className="mmh-card-header">
              <div className="mmh-card-title">Latest Dispense Records</div>
            </div>
            <div className="mmh-card-body">
              <div className="mmh-table-scroll">
                <table className="mmh-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Medicines</th>
                      <th>Total Amount</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispenseHistory.map(h => (
                      <tr key={h.id}>
                        <td className="mmh-td-name">{h.patient}</td>
                        <td style={{ fontSize: '13px' }}>{h.medicines}</td>
                        <td style={{ fontWeight: 700 }}>PKR {h.total}</td>
                        <td>{h.time}</td>
                        <td><span className="mmh-badge mmh-badge-green">{h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mmh-tab-content">
          {/* Inventory Stats */}
          <div className="mmh-stats-grid">
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-sky-gradient)' }} />
              <span className="mmh-stat-icon">💊</span>
              <span className="mmh-stat-value">{inventoryStats.total}</span>
              <span className="mmh-stat-label">Total Medicines</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-green-gradient)' }} />
              <span className="mmh-stat-icon">✅</span>
              <span className="mmh-stat-value">{inventoryStats.inStock}</span>
              <span className="mmh-stat-label">In Stock</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-amber-gradient)' }} />
              <span className="mmh-stat-icon">⚠️</span>
              <span className="mmh-stat-value">{inventoryStats.lowStock}</span>
              <span className="mmh-stat-label">Low Stock</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-rose-gradient)' }} />
              <span className="mmh-stat-icon">❌</span>
              <span className="mmh-stat-value">{inventoryStats.outOfStock}</span>
              <span className="mmh-stat-label">Out of Stock</span>
            </div>
          </div>

          {inventoryStats.lowStock > 0 && (
            <div className="mmh-alert mmh-alert-warning" style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <strong>Low Stock Alert:</strong> {inventoryStats.lowStock} medicines are below their minimum threshold. Please restock soon.
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mmh-card" style={{ marginBottom: '24px' }}>
            <div className="mmh-card-body">
              <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 200px 200px auto', gap: '16px', alignItems: 'end' }}>
                <div className="mmh-field">
                  <label className="mmh-label">Search Medicine Name / Generic</label>
                  <input 
                    type="text" 
                    className="mmh-input" 
                    placeholder="E.g Panadol, Paracetamol..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Category</label>
                  <select className="mmh-input-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mmh-field">
                  <label className="mmh-label">Stock Status</label>
                  <select className="mmh-input-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
                <button 
                  className="mmh-btn mmh-btn-primary" 
                  style={{ height: '46px' }}
                  onClick={() => setShowAddModal(true)}
                >
                  + Add New Medicine
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="mmh-card">
            <div className="mmh-card-body">
              <div className="mmh-table-scroll">
                <table className="mmh-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Generic Name</th>
                      <th>Category</th>
                      <th>Stock Level</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr><td colSpan={8} className="mmh-empty">No medicines found matching criteria</td></tr>
                    ) : (
                      filteredInventory.map((m, idx) => {
                        const minQty = m.minQty || 1; // Prevent division by zero
                        const stockPct = (m.quantity / (minQty * 3)) * 100;
                        const progressColor = m.quantity === 0 ? 'var(--mmh-rose)' : m.quantity <= (m.minQty || 0) ? 'var(--mmh-amber)' : 'var(--mmh-green)';
                        
                        return (
                          <tr key={m._id}>
                            <td>{idx + 1}</td>
                            <td className="mmh-td-name">{m.name}</td>
                            <td>{m.generic}</td>
                            <td><span className="mmh-badge mmh-badge-gray">{m.category}</span></td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontWeight: 700 }}>{m.quantity} Units (Min: {m.minQty || 0})</div>
                                <div className="mmh-ward-bar-wrap" style={{ height: '6px', width: '120px' }}>
                                  <div 
                                    className="mmh-ward-bar-fill" 
                                    style={{ width: `${Math.min(100, stockPct)}%`, background: progressColor }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{m.price}</td>
                            <td>
                              <span className={`mmh-badge ${m.quantity === 0 ? 'mmh-badge-rose' : m.quantity <= m.minQty ? 'mmh-badge-amber' : 'mmh-badge-green'}`}>
                                {m.quantity === 0 ? 'No Stock' : m.quantity <= m.minQty ? 'Low stock' : 'Adequate'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" title="Edit">✏️</button>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" title="Restock">➕</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="mmh-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">📦 Add New Medicine</h2>
              <button className="mmh-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddMedicine}>
              <div className="mmh-modal-body">
                <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="mmh-field">
                    <label className="mmh-label">Medicine Name</label>
                    <input 
                      type="text" 
                      className="mmh-input" 
                      placeholder="e.g. Panadol 500mg" 
                      required
                      value={newMed.name}
                      onChange={e => setNewMed({...newMed, name: e.target.value})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Generic Name</label>
                    <input 
                      type="text" 
                      className="mmh-input" 
                      placeholder="e.g. Paracetamol" 
                      value={newMed.generic}
                      onChange={e => setNewMed({...newMed, generic: e.target.value})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Category</label>
                    <input 
                      type="text" 
                      className="mmh-input" 
                      placeholder="e.g. Antibiotic" 
                      required
                      value={newMed.category}
                      onChange={e => setNewMed({...newMed, category: e.target.value})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Unit</label>
                    <select 
                      className="mmh-input-select"
                      value={newMed.unit}
                      onChange={e => setNewMed({...newMed, unit: e.target.value})}
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                    </select>
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Opening Stock (Qty)</label>
                    <input 
                      type="number" 
                      className="mmh-input" 
                      required
                      min="0"
                      value={newMed.quantity}
                      onChange={e => setNewMed({...newMed, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Min. Stock Alert</label>
                    <input 
                      type="number" 
                      className="mmh-input" 
                      required
                      min="1"
                      value={newMed.minQuantity}
                      onChange={e => setNewMed({...newMed, minQuantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Price Per Unit (PKR)</label>
                    <input 
                      type="number" 
                      className="mmh-input" 
                      required
                      min="0"
                      value={newMed.pricePerUnit}
                      onChange={e => setNewMed({...newMed, pricePerUnit: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
              <div className="mmh-modal-footer">
                <button type="button" className="mmh-btn mmh-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="mmh-btn mmh-btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyPage;
