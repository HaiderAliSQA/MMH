import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import DispensingSlip, { printSlip } from '../../components/DispensingSlip';

interface Medicine {
  _id: string;
  name: string;
  generic: string;
  category: string;
  unit: string;
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
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [dispenseRecord, setDispenseRecord] = useState<any>(null);
  
  // Add Medicine Form State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [dispenseNotes, setDispenseNotes] = useState('');
  
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
  const addToCart = () => {
    if (!selectedMedId) return;
    const med = medicines.find(m => m._id === selectedMedId);
    if (!med) return;

    if (selectedQty < 1 || selectedQty > med.quantity) {
      alert("Invalid quantity. Max available: " + med.quantity);
      return;
    }

    const existing = cart.find(c => c.medicineId === selectedMedId);
    if (existing) {
      if (existing.qty + selectedQty > med.quantity) {
        alert("Cannot exceed available stock. Max available: " + med.quantity);
        return;
      }
      setCart(cart.map(c => c.medicineId === selectedMedId ? { ...c, qty: c.qty + selectedQty, total: (c.qty + selectedQty) * c.price } : c));
    } else {
      setCart([...cart, { 
        medicineId: selectedMedId, 
        name: med.name, 
        qty: selectedQty, 
        price: med.price, 
        total: med.price * selectedQty 
      }]);
    }

    setSelectedMedId('');
    setSelectedQty(1);
    setStockErrors([]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    setStockErrors([]);
  };

  const runningTotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);

  const handleDispense = async () => {
    if (!selectedPatientId) return alert("Please select a patient");
    if (cart.length === 0) return alert("Cart is empty");

    setLoading(true);
    setStockErrors([]);
    try {
      const res = await api.post('/dispense', {
        patient: selectedPatientId,
        items: cart.map(c => ({ medicine: c.medicineId, quantity: c.qty })),
        totalAmount: runningTotal,
        notes: dispenseNotes
      });
      
      setDispenseRecord(res.data.data);
      setCart([]);
      setSelectedPatientId('');
      setDispenseNotes('');
      fetchData(); // Refresh stock
    } catch (error: any) {
      console.error("Dispense error:", error);
      if (error.response?.data?.errors) {
        setStockErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.message || "Failed to dispense medicines.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === selectedPatientId);
  const selectedMedicine = medicines.find(m => m._id === selectedMedId);

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
          {stockErrors.length > 0 && (
            <div className="mmh-alert mmh-alert-warning" style={{ background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)', color: '#fb7185', marginBottom: '24px' }}>
              <div style={{fontWeight:800, marginBottom:8}}>⚠️ Stock Problem:</div>
              {stockErrors.map((err, i) => (
                <div key={i} style={{ fontSize:'13px', padding:'5px 0', borderBottom:'1px solid rgba(244,63,94,0.15)', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>❌</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mmh-form-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '24px', alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Patient Selection Card */}
              <div className="mmh-card">
                <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-violet)' }} />
                <div className="mmh-card-header">
                  <div className="mmh-card-title">STEP 1 — Select Patient</div>
                </div>
                <div className="mmh-card-body">
                  <div className="mmh-field">
                    <div className="mmh-search-wrap">
                      <span className="mmh-search-icon">🔍</span>
                      <select 
                        className="mmh-input-select"
                        style={{ paddingLeft: '42px' }}
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                      >
                        <option value="">-- Choose Patient (MR Number / Name) --</option>
                        {patients.map(p => (
                          <option key={p._id} value={p._id}>{p.mrNumber} - {p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {selectedPatient && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#111d35', borderRadius: '12px', border: '1px solid #1e3050', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div className="mmh-sidebar-avatar" style={{ background: 'var(--mmh-violet)' }}>
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>{selectedPatient.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          <span style={{ color: '#0ea5e9', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{selectedPatient.mrNumber}</span>
                          {' • '}
                          <span>Patient</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Medicine Card */}
              <div className="mmh-card">
                <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-sky)' }} />
                <div className="mmh-card-header">
                  <div className="mmh-card-title">STEP 2 — Add Medicines</div>
                </div>
                <div className="mmh-card-body">
                  <div className="mmh-field">
                    <label className="mmh-label">Select Medicine</label>
                    <select 
                      className="mmh-input-select"
                      value={selectedMedId}
                      onChange={(e) => {
                        setSelectedMedId(e.target.value);
                        setSelectedQty(1);
                      }}
                    >
                      <option value="">-- Search Medicines --</option>
                      {medicines.filter(m => m.quantity > 0).map(m => (
                        <option key={m._id} value={m._id}>{m.name} ({m.quantity} available) - PKR {m.price}</option>
                      ))}
                    </select>
                    {selectedMedicine && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                        Stock: <strong style={{ color: 'white' }}>{selectedMedicine.quantity} {selectedMedicine.unit}s</strong> available
                      </div>
                    )}
                  </div>

                  {selectedMedicine && (
                    <>
                      <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                        <div className="mmh-field">
                          <label className="mmh-label">
                            Quantity
                            <span style={{color:'#64748b', marginLeft:8, fontWeight:400, textTransform:'none'}}>
                              (Max: {selectedMedicine.quantity})
                            </span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedMedicine.quantity}
                            className="mmh-input"
                            value={selectedQty}
                            onChange={(e) => setSelectedQty(parseInt(e.target.value) || 0)}
                            style={{
                              borderColor: selectedQty > selectedMedicine.quantity ? '#f43f5e' : undefined,
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '16px',
                            }}
                          />
                          <div className="mmh-stock-usage-bar">
                            <div className="mmh-stock-usage-fill" style={{
                              width: `${Math.min(100, (selectedQty / Math.max(1, selectedMedicine.quantity)) * 100)}%`,
                              background: selectedQty > selectedMedicine.quantity
                                ? '#f43f5e'
                                : selectedQty > selectedMedicine.quantity * 0.8
                                  ? '#f59e0b' : '#0ea5e9'
                            }}/>
                          </div>
                          {selectedQty > selectedMedicine.quantity && (
                            <span className="mmh-field-error" style={{ color: '#fb7185', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                              ⚠️ Max available: {selectedMedicine.quantity} {selectedMedicine.unit}s
                            </span>
                          )}
                        </div>
                        <div className="mmh-field">
                          <label className="mmh-label">Subtotal Estimate</label>
                          <div style={{ padding: '12px 16px', background: '#111d35', borderRadius: '12px', border: '1px solid #1e3050' }}>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>PKR {selectedMedicine.price} / {selectedMedicine.unit}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mmh-green)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                              PKR {selectedMedicine.price * (selectedQty || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        className="mmh-btn mmh-btn-primary" 
                        style={{ width: '100%', marginTop: '20px' }}
                        disabled={!selectedQty || selectedQty < 1 || selectedQty > selectedMedicine.quantity}
                        onClick={addToCart}
                      >
                        + Add to Cart
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Receipt Summary / Cart */}
            <div className="mmh-card">
              <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-green)' }} />
              <div className="mmh-card-header">
                <div className="mmh-card-title">🛒 Medicines Cart</div>
              </div>
              <div className="mmh-card-body">
                {cart.length === 0 ? (
                  <div className="mmh-empty" style={{ padding: '40px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>🛒</div>
                    <div>Cart is empty</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Add medicines to proceed</div>
                  </div>
                ) : (
                  <>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', margin: '0 -4px 16px', padding: '0 4px' }}>
                      {cart.map((item, index) => {
                        const med = medicines.find(m => m._id === item.medicineId);
                        const unit = med?.unit || 'Item';
                        return (
                          <div key={item.medicineId} className="mmh-cart-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="mmh-cart-item-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                              <div className="mmh-cart-item-detail">
                                {item.qty} {unit}s × PKR {item.price}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div className="mmh-cart-item-price">PKR {item.total}</div>
                              <button 
                                className="mmh-cart-remove"
                                onClick={() => removeFromCart(index)}
                                title="Remove"
                              >✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mmh-field" style={{ marginBottom: '16px' }}>
                      <label className="mmh-label">Additional Notes (Optional)</label>
                      <input 
                        className="mmh-input" 
                        placeholder="e.g. Take after meal..."
                        value={dispenseNotes}
                        onChange={e => setDispenseNotes(e.target.value)}
                      />
                    </div>

                    <div className="mmh-cart-total">
                      <span className="mmh-cart-total-label">TOTAL</span>
                      <span className="mmh-cart-total-amount">PKR {runningTotal}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button 
                        className="mmh-btn mmh-btn-ghost" 
                        style={{ flex: 1 }}
                        disabled={loading}
                        onClick={() => setCart([])}
                      >
                        Clear Cart
                      </button>
                      <button 
                        className="mmh-btn mmh-btn-green" 
                        style={{ flex: 2 }}
                        disabled={loading || !selectedPatientId}
                        onClick={handleDispense}
                      >
                        {loading ? 'Processing...' : '✅ Confirm Dispense'}
                      </button>
                    </div>
                  </>
                )}
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

      {/* Dispense Slip Modal */}
      {dispenseRecord && (
        <div className="mmh-overlay">
          <div className="mmh-modal mmh-modal-sm" style={{ padding: '0', animation: 'mmh-scale-in 0.3s ease' }}>
            <div style={{ padding: '20px', background: 'var(--mmh-green)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '22px 22px 0 0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>✅ Dispensed Successfully!</h2>
              <button 
                className="mmh-modal-close" 
                style={{ color: 'white', opacity: 0.8, fontSize: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }} 
                onClick={() => setDispenseRecord(null)}
              >×</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <DispensingSlip dispense={dispenseRecord} />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
              <button type="button" className="mmh-btn mmh-btn-ghost" style={{ color: '#64748b', borderColor: '#cbd5e1' }} onClick={() => setDispenseRecord(null)}>Close</button>
              <button type="button" className="mmh-btn mmh-btn-primary" onClick={printSlip}>🖨️ Print Slip</button>
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
