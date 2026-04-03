import React, { useState, useEffect, useMemo, useRef } from 'react';
import api, { prescriptionAPI, dispensaryAPI, medicineAPI } from '../../api';
import { getMedicineRoute, RoutingResult } from '../../utils/medicineRouting';
import '../../styles/mmh.css';
import DispensingSlip, { printSlip } from '../../components/DispensingSlip';
import MyLeaveTab from '../../components/MyLeaveTab';
import PaymentsGrid from '../admin/PaymentsGrid';
import { useSearchParams } from 'react-router-dom';

interface Medicine {
  _id: string;
  name: string;
  generic: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  stockStatus?: string;
  daysToExpiry?: number | null;
  expiryStatus?: string;
  restockHistory?: any[];
}

interface Patient {
  _id: string;
  name: string;
  mrNumber: string;
  age?: number;
  gender?: string;
  phone?: string;
  patientType?: string;
}

interface CartItem {
  medicineId: string;
  name: string;
  qty: number;
  pricePerUnit: number;
  total: number;
}

interface PharmacyProps {
  user: any;
}

const PharmacyPage: React.FC<PharmacyProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dispense';
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dispenseHistory, setDispenseHistory] = useState<any[]>([]);

  // Dispense State — patient live search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const patientTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const patientWrapRef = useRef<HTMLDivElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [dispenseRecord, setDispenseRecord] = useState<any>(null);

  // Routing State
  const [prescription, setPrescription] = useState<any>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [pharmacyRoute, setPharmacyRoute] = useState<'pharmacy' | 'dispensary'>('pharmacy');
  const [adminOverride, setAdminOverride] = useState(false);

  // Add Medicine Form State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ total: 0, revenue: 0 });

  // Inventory State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [inventoryStats, setInventoryStats] = useState({ total: 0, low: 0, out: 0, expiringSoon: 0, ok: 0 });

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockModal, setRestockModal] = useState<any>(null);
  const [historyModal, setHistoryModal] = useState<any>(null);
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

  // Close patient dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientWrapRef.current && !patientWrapRef.current.contains(e.target as Node)) {
        setPatientResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const medsRes = await medicineAPI.getAll();
      setMedicines(medsRes.data?.data || []);
      setInventoryStats({
        ...medsRes.data?.summary,
        ok: (medsRes.data?.summary?.total || 0) - (medsRes.data?.summary?.low || 0) - (medsRes.data?.summary?.out || 0)
      });
      setDispenseHistory([
        { id: '1', patient: 'Ali Khan', medicines: 'Panadol (2), Amoxil (1)', total: 450, time: '10:30 AM', status: 'Completed' },
        { id: '2', patient: 'Sara Bibi', medicines: 'Brufen (1)', total: 120, time: '11:15 AM', status: 'Completed' }
      ]);
    } catch (error) {
      console.error('Pharmacy Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = (q: string) => {
    setPatientSearch(q);
    setSelectedPatient(null);
    clearTimeout(patientTimerRef.current);
    if (q.length < 2) { setPatientResults([]); return; }
    patientTimerRef.current = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const r = await api.get(`/patients/search?q=${encodeURIComponent(q)}`);
        const data = r.data?.data ?? r.data ?? [];
        setPatientResults(Array.isArray(data) ? data : []);
      } catch { setPatientResults([]); }
      finally { setPatientLoading(false); }
    }, 300);
  };

  const selectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch('');
    setPatientResults([]);
    
    // Fetch prescription and routing info
    try {
      const res = await prescriptionAPI.getForPatient(p._id);
      const activeRx = res.data?.data?.[0]; // Usually latest is at 0
      setPrescription(activeRx);
      
      const routeRes = getMedicineRoute(
        p.patientType || 'Regular',
        activeRx?.dispensingRoute,
        user.role
      );
      setRouting(routeRes);
      // Pharmacy is completely separate, ignore routing logic and keep it paid pharmacy checkout
      setPharmacyRoute('pharmacy');
      setAdminOverride(false);
    } catch (err) {
      console.error('Failed to fetch prescription:', err);
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setPrescription(null);
    setRouting(null);
    setPharmacyRoute('pharmacy');
    setAdminOverride(false);
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
      setCart(cart.map(c => c.medicineId === selectedMedId ? { ...c, qty: c.qty + selectedQty, total: (c.qty + selectedQty) * c.pricePerUnit } : c));
    } else {
      setCart([...cart, {
        medicineId: selectedMedId,
        name: med.name,
        qty: selectedQty,
        pricePerUnit: med.pricePerUnit,
        total: med.pricePerUnit * selectedQty
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
    if (!selectedPatient) return alert('Please select a patient');
    if (cart.length === 0) return alert('Cart is empty');

    setLoading(true);
    setStockErrors([]);
    try {
      let res;
      if (pharmacyRoute === 'dispensary') {
        res = await dispensaryAPI.dispense({
          patient: selectedPatient._id,
          items: cart.map(c => ({ medicine: c.medicineId, quantity: c.qty })),
          prescription: prescription?._id,
          notes: dispenseNotes,
          isEmergencyOverride: adminOverride,
          overrideReason: adminOverride ? 'Admin override — after hours' : undefined,
        });
        if (prescription?._id) {
          await prescriptionAPI.updateRoutingStatus(prescription._id, 'Complete');
        }
      } else {
        res = await api.post('/dispense', {
          patient: selectedPatient._id,
          items: cart.map(c => ({ medicine: c.medicineId, quantity: c.qty })),
          totalAmount: runningTotal,
          notes: dispenseNotes,
          paymentMethod: paymentMethod
        });
        if (prescription?._id) {
          await prescriptionAPI.updateRoutingStatus(prescription._id, 'PartialPaid');
        }
      }

      setDispenseRecord(res.data.data);
      setCart([]);
      clearPatient();
      setDispenseNotes('');
      setPaymentMethod('Cash');
      setRefreshKey(prev => prev + 1);
      fetchData();
    } catch (error: any) {
      console.error('Dispense error:', error);
      if (error.response?.data?.errors) {
        setStockErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.message || 'Failed to dispense medicines.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedMedicine = medicines.find(m => m._id === selectedMedId);

  const filteredInventory = useMemo(() => {
    return medicines.filter(m => {
      const name = m.name || '';
      const generic = m.generic || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        generic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;

      const minQty = m.minQuantity || 0;
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
      await medicineAPI.add(newMed);
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

  const handleRestock = async () => {
    if (!restockModal || restockModal.quantity <= 0) return;
    setLoading(true);
    try {
      await medicineAPI.restock(restockModal.medicine._id, {
        quantity: restockModal.quantity,
        price: restockModal.price,
        supplier: restockModal.supplier,
        notes: restockModal.notes
      });
      alert(`Restocked ${restockModal.quantity} units successfully!`);
      setRestockModal(null);
      fetchData();
    } catch (error) {
      console.error("Restock Error:", error);
      alert("Failed to restock medicine.");
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
            onClick={() => setSearchParams({ tab: 'dispense' })}
          >
            <span>💊</span> Dispense
          </button>
          <button
            className={`mmh-admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'inventory' })}
          >
            <span>📦</span> Inventory
          </button>
          <button
            className={`mmh-admin-tab ${activeTab === 'my-leave' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'my-leave' })}
          >
            <span>🏖️</span> My Leave
          </button>
          <button
            className={`mmh-admin-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'payments' })}
          >
            <span>💰</span> Payments History
          </button>
        </div>
      </div>

      {activeTab === 'my-leave' && <MyLeaveTab userRole={user.role} />}

      {activeTab === 'payments' && (
        <div style={{ animation: 'mmh-slide-up 0.4s ease' }}>
          <div className="mmh-card">
            <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-green)' }} />
            <div className="mmh-card-header">
                <div className="mmh-card-title">Pharmacy Collection History</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--mmh-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collection (Filtered)</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--mmh-green)', fontFamily: 'JetBrains Mono' }}>
                    PKR {stats.revenue.toLocaleString()}
                  </div>
                </div>
            </div>
            <div className="mmh-card-body" style={{ padding: '0 0 20px 0' }}>
               <PaymentsGrid 
                 key={refreshKey}
                 forceSource="pharmacy" 
                 forceCollectorId={user._id || user.id}
                 hideHeader={true} 
                 onStatsUpdate={setStats}
               />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dispense' && (
        <div className="mmh-tab-content">
          {stockErrors.length > 0 && (
            <div className="mmh-alert mmh-alert-warning" style={{ background: 'var(--mmh-danger-soft)', borderColor: 'var(--mmh-danger-soft)', color: 'var(--mmh-danger)', marginBottom: '24px' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>⚠️ Stock Problem:</div>
              {stockErrors.map((err, i) => (
                <div key={i} style={{ fontSize: '13px', padding: '5px 0', borderBottom: '1px solid var(--mmh-danger-soft)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❌</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mmh-form-grid mmh-stack-mobile" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '24px', alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Patient Selection Card — live search */}
              <div className="mmh-card" style={{ overflow: 'visible' }}>
                <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-violet)' }} />
                <div className="mmh-card-header">
                  <div className="mmh-card-title">STEP 1 — Select Patient</div>
                </div>
                <div className="mmh-card-body">
                  <div className="mmh-field">
                    <label className="mmh-label">Search Patient <span className="mmh-required">*</span></label>

                    {!selectedPatient ? (
                      <div className="mmh-patient-search-wrap" ref={patientWrapRef}>
                        <input
                          className="mmh-input"
                          placeholder="Search by name or MR number e.g. MMH-2026-00157"
                          value={patientSearch}
                          onChange={e => handlePatientSearch(e.target.value)}
                          autoComplete="off"
                        />
                        {(patientResults.length > 0 || patientLoading) ? (
                          <div className="mmh-patient-dropdown" style={{ zIndex: 99999 }}>
                            {patientLoading
                              ? <div style={{ padding: '12px 16px', color: 'var(--mmh-text3)', fontSize: 12 }}>Searching…</div>
                              : patientResults.map(p => (
                                <div
                                  key={p._id}
                                  className="mmh-patient-dropdown-item"
                                  onMouseDown={e => { e.preventDefault(); selectPatient(p); }}
                                >
                                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--mmh-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                                    {p.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="mmh-dropdown-mr">{p.mrNumber}</span>
                                  <span className="mmh-dropdown-name">{p.name}</span>
                                  <span className="mmh-dropdown-meta">{p.age}y | {p.gender}</span>
                                </div>
                              ))
                            }
                          </div>
                        ) : (patientSearch.length >= 2 && !patientLoading && (
                          <div className="mmh-patient-dropdown" style={{ zIndex: 99999, padding: '18px', textAlign: 'center', color: 'var(--mmh-text3)', fontSize: '13px' }}>
                            No patient found for "{patientSearch}"
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mmh-selected-patient-card">
                        <div className="mmh-selected-patient-avatar">{selectedPatient.name.charAt(0)}</div>
                        <div>
                          <div className="mmh-selected-patient-name">{selectedPatient.name}</div>
                          <div className="mmh-selected-patient-mr">{selectedPatient.mrNumber}</div>
                          <div className="mmh-selected-patient-meta">
                            {selectedPatient.age}y | {selectedPatient.gender}
                            {selectedPatient.phone && ` | ${selectedPatient.phone}`}
                            {selectedPatient.patientType && ` | ${selectedPatient.patientType}`}
                          </div>
                        </div>
                        <button className="mmh-selected-patient-clear" type="button" onClick={clearPatient} title="Change patient">×</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Routing UI for Selected Patient (Removed per business logic request - Pharmacy remains separate) */}
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
                        <option key={m._id} value={m._id}>{m.name} ({m.quantity} available)  {m.pricePerUnit}</option>
                      ))}
                    </select>
                    {selectedMedicine && (
                      <div style={{ fontSize: '12px', color: 'var(--mmh-text3)', marginTop: '6px' }}>
                        Stock: <strong style={{ color: 'var(--mmh-text)' }}>{selectedMedicine.quantity} {selectedMedicine.unit}s</strong> available
                      </div>
                    )}
                  </div>

                  {selectedMedicine && (
                    <>
                      <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                        <div className="mmh-field">
                          <label className="mmh-label">
                            Quantity
                            <span style={{ color: 'var(--mmh-text3)', marginLeft: 8, fontWeight: 400, textTransform: 'none' }}>
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
                              borderColor: selectedQty > selectedMedicine.quantity ? 'var(--mmh-danger)' : undefined,
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '16px',
                            }}
                          />
                          <div className="mmh-stock-usage-bar">
                            <div className="mmh-stock-usage-fill" style={{
                              width: `${Math.min(100, (selectedQty / Math.max(1, selectedMedicine.quantity)) * 100)}%`,
                              background: selectedQty > selectedMedicine.quantity
                                ? 'var(--mmh-danger)'
                                : selectedQty > selectedMedicine.quantity * 0.8
                                  ? 'var(--mmh-warning)' : 'var(--mmh-accent)'
                            }} />
                          </div>
                          {selectedQty > selectedMedicine.quantity && (
                            <span className="mmh-field-error" style={{ color: 'var(--mmh-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                              ⚠️ Max available: {selectedMedicine.quantity} {selectedMedicine.unit}s
                            </span>
                          )}
                        </div>
                        <div className="mmh-field">
                          <label className="mmh-label">Subtotal Estimate</label>
                          <div style={{ padding: '12px 16px', background: 'var(--mmh-bg2)', borderRadius: '12px', border: '1px solid var(--mmh-border)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--mmh-text3)' }}>PKR {selectedMedicine.pricePerUnit} / {selectedMedicine.unit}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mmh-success)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                              PKR {selectedMedicine.pricePerUnit * (selectedQty || 0)}
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
                    <div style={{ fontSize: '12px', color: 'var(--mmh-text3)', marginTop: '4px' }}>Add medicines to proceed</div>
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
                                {item.qty} {unit}s × PKR {item.pricePerUnit}
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

                    {pharmacyRoute === 'pharmacy' ? (
                      <>
                        <div className="mmh-field" style={{ marginBottom: '20px' }}>
                          <label className="mmh-label">Payment Method <span className="mmh-required">*</span></label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[
                              { id: 'Cash', icon: '💵', label: 'Cash' },
                              { id: 'Card', icon: '💳', label: 'Card' },
                              { id: 'Insurance', icon: '🏥', label: 'Insurance' },
                              { id: 'JazzCash', icon: '📱', label: 'JazzCash' },
                              { id: 'EasyPaisa', icon: '📱', label: 'EasyPaisa' },
                              { id: 'Bank Transfer', icon: '🏦', label: 'Bank' }
                            ].map(m => (
                              <div 
                                key={m.id}
                                className={`mmh-payment-method-card ${paymentMethod === m.id ? 'active' : ''}`}
                                onClick={() => setPaymentMethod(m.id)}
                                style={{
                                  padding: '12px 8px',
                                  borderRadius: '12px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  background: paymentMethod === m.id ? 'var(--mmh-bg4)' : 'var(--mmh-bg3)',
                                  border: `1px solid ${paymentMethod === m.id ? 'var(--mmh-sky)' : 'var(--mmh-border)'}`,
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{m.icon}</div>
                                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{m.label}</div>
                              </div>
                            ))}
                          </div>
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
                          <span className="mmh-cart-total-label">TOTAL PAID</span>
                          <span className="mmh-cart-total-amount">PKR {runningTotal}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mmh-field" style={{ marginBottom: '16px' }}>
                          <label className="mmh-label">Notes</label>
                          <input
                            className="mmh-input"
                            placeholder="Optional notes..."
                            value={dispenseNotes}
                            onChange={e => setDispenseNotes(e.target.value)}
                          />
                        </div>
                        <div className="mmh-cart-total" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
                          <span className="mmh-cart-total-label" style={{ color: '#34d399' }}>AMOUNT TO PAY</span>
                          <span className="mmh-cart-total-amount" style={{ color: '#34d399' }}>FREE</span>
                        </div>
                      </>
                    )}

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
                        disabled={loading || !selectedPatient}
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
      )}

      {activeTab === 'inventory' && (
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
              <span className="mmh-stat-value">{inventoryStats.ok}</span>
              <span className="mmh-stat-label">In Stock</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-amber-gradient)' }} />
              <span className="mmh-stat-icon">⚠️</span>
              <span className="mmh-stat-value">{inventoryStats.low}</span>
              <span className="mmh-stat-label">Low Stock</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-rose-gradient)' }} />
              <span className="mmh-stat-icon">❌</span>
              <span className="mmh-stat-value">{inventoryStats.out}</span>
              <span className="mmh-stat-label">Out of Stock</span>
            </div>
            <div className="mmh-stat-card">
              <div className="mmh-stat-accent" style={{ background: 'var(--mmh-slate-gradient)' }} />
              <span className="mmh-stat-icon">⏳</span>
              <span className="mmh-stat-value">{inventoryStats.expiringSoon}</span>
              <span className="mmh-stat-label">Expiring Soon</span>
            </div>
          </div>

          {inventoryStats.low > 0 && (
            <div className="mmh-alert mmh-alert-warning" style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <strong>Low Stock Alert:</strong> {inventoryStats.low} medicines are below their minimum threshold. Please restock soon.
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
                      <th>Expiry</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr><td colSpan={8} className="mmh-empty">No medicines found matching criteria</td></tr>
                    ) : (
                      filteredInventory.map((m, idx) => {
                        const minQty = m.minQuantity || 1; // Prevent division by zero
                        const stockPct = (m.quantity / (minQty * 3)) * 100;
                        const progressColor = m.quantity === 0 ? 'var(--mmh-danger)' : m.quantity <= (m.minQuantity || 0) ? 'var(--mmh-warning)' : 'var(--mmh-success)';

                        return (
                          <tr key={m._id}>
                            <td>{idx + 1}</td>
                            <td className="mmh-td-name">{m.name}</td>
                            <td>{m.generic}</td>
                            <td><span className="mmh-badge mmh-badge-gray">{m.category}</span></td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                  <span style={{
                                    fontFamily: 'monospace', fontWeight: '700',
                                    color: (m.stockStatus || m.quantity === 0 ? 'out' : m.quantity <= m.minQuantity ? 'low' : 'ok') === 'out' ? '#fb7185' : (m.stockStatus || m.quantity === 0 ? 'out' : m.quantity <= m.minQuantity ? 'low' : 'ok') === 'low' ? '#fbbf24' : '#34d399'
                                  }}>
                                    {m.quantity} {m.unit}
                                  </span>
                                  <span style={{ color: 'var(--mmh-text4)' }}>
                                    min: {m.minQuantity}
                                  </span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--mmh-card2)', borderRadius: '3px', overflow: 'hidden', width: '120px' }}>
                                  <div style={{
                                    height: '100%', borderRadius: '3px',
                                    width: `${Math.min(100, Math.round(m.quantity / Math.max(m.minQuantity * 3, 1) * 100))}%`,
                                    background: (m.stockStatus || m.quantity === 0 ? 'out' : m.quantity <= m.minQuantity ? 'low' : 'ok') === 'out' ? '#f43f5e' : (m.stockStatus || m.quantity === 0 ? 'out' : m.quantity <= m.minQuantity ? 'low' : 'ok') === 'low' ? '#f59e0b' : '#10b981',
                                    transition: 'width 0.4s ease'
                                  }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{m.pricePerUnit}</td>
                            <td>
                              {m.stockStatus === 'out' ? <span className="mmh-badge" style={{ background: '#f43f5e', color: 'white' }}>OUT OF STOCK</span>
                                : m.stockStatus === 'low' ? <span className="mmh-badge mmh-badge-amber">LOW STOCK ⚠️</span>
                                : <span className="mmh-badge mmh-badge-green">In Stock ✓</span>}
                            </td>
                            <td>
                              {m.expiryStatus === 'expired' ? <span style={{ color: '#f43f5e' }}>EXPIRED</span>
                               : m.expiryStatus === 'critical' ? <span style={{ color: '#f43f5e' }}>{m.daysToExpiry} days</span>
                               : m.expiryStatus === 'warning' ? <span style={{ color: '#f59e0b' }}>{m.daysToExpiry && m.daysToExpiry > 30 ? Math.floor(m.daysToExpiry / 30) + ' months' : m.daysToExpiry + ' days'}</span>
                               : m.daysToExpiry !== null && m.daysToExpiry !== undefined ? <span style={{ color: 'var(--mmh-text3)' }}>{m.daysToExpiry > 30 ? Math.floor(m.daysToExpiry / 30) + 'm' : m.daysToExpiry + 'd'}</span>
                               : <span style={{ color: 'var(--mmh-text3)' }}>—</span>}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" title="Edit">✏️</button>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" title="Restock" onClick={() => setRestockModal({ medicine: m, quantity: 1, price: m.pricePerUnit, supplier: '', notes: '' })}>➕</button>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" title="History" onClick={() => setHistoryModal(m)}>📜</button>
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
            <div style={{ padding: '20px', background: 'var(--mmh-success)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '22px 22px 0 0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>✅ Dispensed Successfully!</h2>
              <button
                className="mmh-modal-close"
                style={{ color: 'white', opacity: 0.8, fontSize: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setDispenseRecord(null)}
              >×</button>
            </div>
            <div style={{ background: 'var(--mmh-bg)', padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <DispensingSlip dispense={dispenseRecord} />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--mmh-border)', background: 'var(--mmh-card)' }}>
              <button type="button" className="mmh-btn mmh-btn-ghost" style={{ color: 'var(--mmh-text3)', borderColor: 'var(--mmh-border)' }} onClick={() => setDispenseRecord(null)}>Close</button>
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
                      onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Generic Name</label>
                    <input
                      type="text"
                      className="mmh-input"
                      placeholder="e.g. Paracetamol"
                      value={newMed.generic}
                      onChange={e => setNewMed({ ...newMed, generic: e.target.value })}
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
                      onChange={e => setNewMed({ ...newMed, category: e.target.value })}
                    />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Unit</label>
                    <select
                      className="mmh-input-select"
                      value={newMed.unit}
                      onChange={e => setNewMed({ ...newMed, unit: e.target.value })}
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
                      onChange={e => setNewMed({ ...newMed, quantity: parseInt(e.target.value) || 0 })}
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
                      onChange={e => setNewMed({ ...newMed, minQuantity: parseInt(e.target.value) || 0 })}
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
                      onChange={e => setNewMed({ ...newMed, pricePerUnit: parseFloat(e.target.value) || 0 })}
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

      {/* Restock Modal */}
      {restockModal && (
        <div className="mmh-overlay" onClick={() => setRestockModal(null)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">Restock — {restockModal.medicine.name}</h2>
              <button className="mmh-modal-close" onClick={() => setRestockModal(null)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div style={{ border: '1px solid var(--mmh-border)', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px' }}>Current: <strong>{restockModal.medicine.quantity} {restockModal.medicine.unit}s</strong></div>
                <div style={{ fontSize: '13px' }}>Min Stock: <strong>{restockModal.medicine.minQuantity}</strong></div>
                <div style={{ fontSize: '13px', marginTop: '6px' }}>
                  Status: {restockModal.medicine.stockStatus === 'out' ? '🚫 OUT OF STOCK' : restockModal.medicine.stockStatus === 'low' ? '⚠️ LOW STOCK' : '✅ OK'}
                </div>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Add Quantity <span className="mmh-required">*</span></label>
                <input type="number" className="mmh-input" value={restockModal.quantity} onChange={e => setRestockModal({ ...restockModal, quantity: parseInt(e.target.value) || 0 })} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Purchase Price per unit (PKR)</label>
                <input type="number" className="mmh-input" value={restockModal.price} onChange={e => setRestockModal({ ...restockModal, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Supplier Name</label>
                <input type="text" className="mmh-input" value={restockModal.supplier} onChange={e => setRestockModal({ ...restockModal, supplier: e.target.value })} />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Notes</label>
                <input type="text" className="mmh-input" value={restockModal.notes} onChange={e => setRestockModal({ ...restockModal, notes: e.target.value })} />
              </div>
              {restockModal.quantity > 0 && (
                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  New total will be: {restockModal.medicine.quantity} + {restockModal.quantity} = {restockModal.medicine.quantity + restockModal.quantity} {restockModal.medicine.unit}s ✅
                </div>
              )}
            </div>
            <div className="mmh-modal-footer">
              <button type="button" className="mmh-btn mmh-btn-ghost" onClick={() => setRestockModal(null)}>Cancel</button>
              <button type="button" className="mmh-btn mmh-btn-primary" disabled={loading || restockModal.quantity <= 0} onClick={handleRestock}>
                {loading ? 'Restocking...' : 'Save Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="mmh-overlay" onClick={() => setHistoryModal(null)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">Restock History — {historyModal.name}</h2>
              <button className="mmh-modal-close" onClick={() => setHistoryModal(null)}>×</button>
            </div>
            <div className="mmh-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="mmh-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Added Qty</th>
                    <th>Price</th>
                    <th>Supplier</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(!historyModal.restockHistory || historyModal.restockHistory.length === 0) ? (
                    <tr><td colSpan={5} className="mmh-empty">No history found</td></tr>
                  ) : (
                    [...historyModal.restockHistory].reverse().map((h: any, i: number) => (
                      <tr key={i}>
                        <td>{new Date(h.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 700, color: 'var(--mmh-green)' }}>+{h.quantity}</td>
                        <td>{h.price}</td>
                        <td>{h.supplier}</td>
                        <td style={{ fontSize: '11px', color: 'var(--mmh-text3)' }}>{h.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyPage;
