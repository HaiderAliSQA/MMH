import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dispensaryAPI, patientAPI, prescriptionAPI } from '../../api';
import { getMedicineRoute } from '../../utils/medicineRouting';
import MyLeaveTab from '../../components/MyLeaveTab';
import '../../styles/mmh.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DispensaryStatus { isOpen: boolean; message: string; opensAt?: string; }
interface Medicine { _id: string; name: string; generic?: string; category: string; quantity: number; minQuantity: number; unit: string; source: string; donorName?: string; expiryDate?: string; isActive: boolean; }
interface CartItem { medicine: string; medicineName: string; quantity: number; unit: string; available: number; }
interface Patient { _id: string; name: string; mrNumber: string; patientType?: string; age?: number; gender?: string; phone?: string; }
interface DispenseRecord { _id: string; patient: Patient; items: CartItem[]; dispensedBy: { name: string }; dispenseTime: string; notes?: string; }
interface Stats { totalDispensedToday: number; totalPatientsToday: number; lowStockCount: number; outOfStockCount: number; isOpen: boolean; }

const CATEGORIES = ['All','Antibiotic','Analgesic','Antidiabetic','Antihypertensive','Antiparasitic','Vitamin','Antacid','Antiallergic','Cough & Cold','IV Fluid','Other'];
const UNITS = ['Tablets','Capsules','ml','Sachet','Sachets','Vial','Bottles'];
const SOURCES = ['Donated','Government','Trust Funded'];

const getTypeBadge = (type?: string) => {
  if (type === 'Trust') return { bg: '#052e16', color: '#34d399', border: '#065f46', label: 'TRUST BENEFICIARY ✓' };
  if (type === 'BPL')   return { bg: '#0c1a2e', color: '#38bdf8', border: '#0369a1', label: 'BPL PATIENT ✓' };
  if (type === 'Staff') return { bg: '#1e1b4b', color: '#a78bfa', border: '#5b21b6', label: 'STAFF' };
  return { bg: '#1c1917', color: '#a8a29e', border: '#57534e', label: 'REGULAR' };
};

const getStockColor = (qty: number, min: number) => {
  if (qty === 0) return '#ef4444';
  if (qty <= min) return '#f59e0b';
  if (qty <= min * 2) return '#f59e0b';
  return '#34d399';
};

const getSourceBadge = (source: string) => {
  if (source === 'Donated')      return 'mmh-badge-violet';
  if (source === 'Government')   return 'mmh-badge-sky';
  return 'mmh-badge-green';
};

// ─── Print Slip ───────────────────────────────────────────────────────────────
const printDispensarySlip = (dispense: any) => {
  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Dispensary Slip</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    :root {
      --mmh-accent: #065f46;
      --mmh-border: #bbf7d0;
    }
    body { margin: 0; padding: 16px; background: white; font-family: 'Plus Jakarta Sans', sans-serif; }
    
    .mmh-slip {
      background: white;
      color: #0f172a;
      padding: 24px;
      width: 350px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      background: var(--mmh-accent);
      color: white;
      padding: 16px;
      border-radius: 10px 10px 0 0;
      margin: -24px -24px 18px;
    }
    .hospital { font-size: 17px; font-weight: 900; font-style: italic; }
    .sub { font-size: 11px; opacity: 0.75; margin-top: 3px; }
    .badge { display: inline-block; margin-top: 8px; padding: 4px 16px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; }
    
    .sec { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mmh-accent); margin: 14px 0 8px; padding-bottom: 4px; border-bottom: 1.5px solid var(--mmh-border); }
    .row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
    .label { color: #64748b; min-width: 80px; }
    .value { font-weight: 700; color: #0f172a; text-align: right; }
    
    .med { padding: 8px 0; border-bottom: 1px dashed var(--mmh-border); }
    .med-name { font-size: 13px; font-weight: 700; color: #0f172a; }
    .med-detail { font-size: 11px; color: #64748b; margin-top: 3px; display: flex; justify-content: space-between; }
    
    .total-box { background: #f0fdf4; border: 2px solid var(--mmh-accent); border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin: 14px 0; }
    .total-label { font-size: 13px; font-weight: 700; color: var(--mmh-accent); }
    .total-amount { font-size: 20px; font-weight: 900; color: var(--mmh-accent); font-family: 'JetBrains Mono', monospace; }
    
    .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--mmh-border); }
    
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
      .header, .total-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style></head><body>
  <div class="mmh-slip">
    <div class="header">
      <div class="hospital">Majida Memorial Hospital</div>
      <div class="sub">MMH · Chiniot</div>
      <div class="badge">FREE TRUST DISPENSARY</div>
    </div>
    
    <div class="row">
      <span class="label">Date:</span>
      <span class="value">${new Date().toLocaleString('en-PK')}</span>
    </div>
    
    <div class="sec">Patient Information</div>
    <div class="row">
      <span class="label">Name:</span>
      <span class="value">${dispense.patient?.name || 'Walk-in'}</span>
    </div>
    <div class="row">
      <span class="label">MR#:</span>
      <span class="value">${dispense.patient?.mrNumber || 'N/A'}</span>
    </div>

    <div class="sec">Medicines Dispensed</div>
    ${(dispense.items || []).map((item: any) => `
      <div class="med">
        <div class="med-name">${item.medicineName}</div>
        <div class="med-detail">
          <span>Qty: ${item.quantity} ${item.unit || 'units'}</span>
          <span style="font-weight:700;color:var(--mmh-accent)">FREE</span>
        </div>
      </div>
    `).join('')}

    <div class="total-box">
      <span class="total-label">AMOUNT:</span>
      <span class="total-amount">FREE</span>
    </div>
    
    ${dispense.notes ? `<div class="row"><span class="label">Notes:</span><span class="value">${dispense.notes}</span></div>` : ''}
    <div class="row" style="margin-top:12px">
      <span class="label">Dispensed by:</span>
      <span class="value">${dispense.dispensedBy?.name || 'Staff'}</span>
    </div>
    
    <div class="footer">
      Please keep this slip safe<br />
      MMH Trust Dispensary · Chiniot
    </div>
  </div>
  
  <div class="no-print" style="text-align:center;margin-top:20px;padding-bottom:30px">
    <button onclick="window.print()" style="padding:10px 28px;background:#065f46;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;box-shadow:0 4px 6px rgba(6,13,26,0.1)">🖨️ Print Slip</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600">Close</button>
  </div>
  </body></html>`);
  w.document.close();
};

// ─── Status Banner ────────────────────────────────────────────────────────────
const StatusBanner: React.FC<{ status: DispensaryStatus | null }> = ({ status }) => {
  if (!status) return null;
  return (
    <div style={{
      padding: '12px 20px', borderRadius: '12px', marginBottom: '20px',
      background: status.isOpen ? 'rgba(5,95,70,0.25)' : 'rgba(127,29,29,0.25)',
      border: `1px solid ${status.isOpen ? '#065f46' : '#7f1d1d'}`,
      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '20px' }}>{status.isOpen ? '🟢' : '🔴'}</span>
      <span style={{ fontWeight: 800, fontSize: '14px', color: status.isOpen ? '#34d399' : '#fb7185' }}>
        Dispensary {status.isOpen ? 'OPEN' : 'CLOSED'}
      </span>
      <span style={{ color: 'var(--mmh-text3)', fontSize: '13px' }}>|</span>
      <span style={{ fontSize: '13px', color: 'var(--mmh-text2)' }}>{status.message}</span>
      {status.opensAt && (
        <>
          <span style={{ color: 'var(--mmh-text3)', fontSize: '13px' }}>|</span>
          <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>{status.opensAt}</span>
        </>
      )}
      {!status.isOpen && (
        <span style={{ fontSize: '12px', color: 'var(--mmh-text3)', marginLeft: 'auto' }}>
          Emergency medicines → contact pharmacy
        </span>
      )}
    </div>
  );
};

// ─── Closed Overlay ───────────────────────────────────────────────────────────
const ClosedOverlay: React.FC<{ opensAt?: string }> = ({ opensAt }) => (
  <div style={{
    position: 'absolute', inset: 0, background: 'rgba(6,13,26,0.85)',
    borderRadius: '14px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  }}>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
    <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Dispensary is Closed</div>
    {opensAt && <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{opensAt}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const DispensaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dispense';
  const setTab = (tab: string) => setSearchParams({ tab });

  const [status, setStatus] = useState<DispensaryStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [history, setHistory] = useState<DispenseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  // Fetch status every 30 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const r = await dispensaryAPI.getStatus();
        setStatus(r.data.data);
      } catch { /* ignore */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMedicines = useCallback(async (params?: object) => {
    try {
      const r = await dispensaryAPI.getMedicines(params);
      setMedicines(r.data.data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async (params?: object) => {
    try {
      const r = await dispensaryAPI.getHistory(params);
      setHistory(r.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') fetchMedicines();
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'dispense') fetchMedicines();
  }, [activeTab]);

  const isOpen = status?.isOpen ?? true;

  return (
    <div style={{ animation: 'mmh-slide-up 0.4s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">🆓 Trust Dispensary</h1>
          <p className="mmh-page-subtitle">Free medicines for Trust & BPL patients — Mon–Sat 8AM–5PM</p>
        </div>
      </div>

      <StatusBanner status={status} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'dispense', label: '💊 Dispense' },
          { key: 'stock',    label: '📦 Stock' },
          { key: 'history',  label: '📋 History' },
          { key: 'my-leave', label: '🏖️ My Leave' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 22px', borderRadius: '10px', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeTab === t.key ? 'var(--mmh-accent)' : 'var(--mmh-card)',
              color: activeTab === t.key ? 'white' : 'var(--mmh-text3)',
              boxShadow: activeTab === t.key ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dispense' && (
        <DispenseTab status={status} medicines={medicines} isOpen={isOpen} />
      )}
      {activeTab === 'stock' && (
        <StockTab medicines={medicines} fetchMedicines={fetchMedicines} loading={loading} setLoading={setLoading} />
      )}
      {activeTab === 'history' && (
        <HistoryTab history={history} fetchHistory={fetchHistory} />
      )}
      {activeTab === 'my-leave' && (
        <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
          <MyLeaveTab userRole={user.role} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — DISPENSE
// ═══════════════════════════════════════════════════════════════════════════════
const DispenseTab: React.FC<{ status: DispensaryStatus | null; medicines: Medicine[]; isOpen: boolean }> = ({ status, medicines, isOpen }) => {
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [routing, setRouting] = useState<any>(null);
  const searchTimer = useRef<any>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('mmh_user') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePatientSearch = (val: string) => {
    setPatientQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length < 2) { setPatientResults([]); setShowDropdown(false); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await patientAPI.search(val);
        setPatientResults(r.data?.data ?? r.data ?? []);
        setShowDropdown(true);
      } catch { /* ignore */ }
    }, 350);
  };

  const selectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientQuery(p.name);
    setShowDropdown(false);
    setCart([]);
    
    try {
      const res = await prescriptionAPI.getForPatient(p._id);
      const activeRx = res.data?.data?.[0];
      setPrescription(activeRx);
      
      const routeRes = getMedicineRoute(
        p.patientType || 'Regular',
        activeRx?.dispensingRoute,
        user.role
      );
      setRouting(routeRes);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (med: Medicine) => {
    if (cart.find(c => c.medicine === med._id)) return;
    setCart(prev => [...prev, { medicine: med._id, medicineName: med.name, quantity: 1, unit: med.unit, available: med.quantity }]);
  };

  const updateQty = (id: string, qty: number) => {
    setCart(prev => prev.map(c => c.medicine === id ? { ...c, quantity: Math.max(1, Math.min(qty, c.available)) } : c));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.medicine !== id));

  const handleDispense = async () => {
    if (!selectedPatient || cart.length === 0) return;
    setSubmitting(true);
    try {
      const r = await dispensaryAPI.dispense({
        patient: selectedPatient._id,
        items: cart,
        prescription: prescription?._id,
        notes,
      });
      if (prescription?._id && routing?.route !== 'both') {
        await prescriptionAPI.updateRoutingStatus(prescription._id, 'Complete');
      }
      printDispensarySlip(r.data.data);
      setSelectedPatient(null);
      setPatientQuery('');
      setCart([]);
      setNotes('');
      // alert('✅ Medicines dispensed successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Dispense failed';
      const errors = err.response?.data?.errors;
      alert(errors ? `${msg}\n${errors.join('\n')}` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const typeBadge = selectedPatient ? getTypeBadge(selectedPatient.patientType) : null;
  const isRegular = false; // Business logic changed: All patients receive Free medicines at dispensary
  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()) || (m.generic || '').toLowerCase().includes(medSearch.toLowerCase()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      {/* Left: Patient + Medicine Selection */}
      <div>
        {/* Step 1: Patient Search */}
        <div className="mmh-card" style={{ marginBottom: '16px', zIndex: 10, position: 'relative', overflow: 'visible' }}>
          <div className="mmh-card-header">
            <div className="mmh-card-title">Step 1 — Search Patient</div>
          </div>
          <div className="mmh-card-body">
            <div style={{ position: 'relative' }} ref={dropRef}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mmh-text3)' }}>🔍</span>
                <input
                  className="mmh-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Type name or MR number..."
                  value={patientQuery}
                  onChange={e => handlePatientSearch(e.target.value)}
                />
              </div>
              {showDropdown && patientResults.length > 0 && (
                <div className="mmh-patient-dropdown" style={{ top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10000, position: 'absolute', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  {patientResults.map(p => (
                    <div key={p._id} className="mmh-patient-dropdown-item" onClick={() => selectPatient(p)}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--mmh-sky-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white' }}>
                        {p.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{p.mrNumber}</div>
                      </div>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: getTypeBadge(p.patientType).bg, color: getTypeBadge(p.patientType).color, fontWeight: 700 }}>
                          {p.patientType || 'Regular'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && typeBadge && (
              <div style={{ marginTop: 14 }}>
                {isRegular ? (
                  <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14, marginBottom: 6 }}>⚠️ Regular Patient</div>
                    <div style={{ color: 'var(--mmh-text2)', fontSize: 12, marginBottom: 12 }}>
                      This patient is not eligible for free dispensary. Please redirect to pharmacy.
                    </div>
                    <button className="mmh-btn mmh-btn-sm" style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                      Go to Pharmacy →
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: typeBadge.bg, border: `1px solid ${typeBadge.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 26, lineHeight: 1 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--mmh-text)', fontSize: 14 }}>{selectedPatient.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mmh-text3)', fontFamily: 'monospace' }}>{selectedPatient.mrNumber}</div>
                    </div>
                    <span style={{ padding: '4px 12px', background: typeBadge.bg, border: `1px solid ${typeBadge.border}`, borderRadius: 20, color: typeBadge.color, fontWeight: 800, fontSize: 11 }}>
                      {typeBadge.label}
                    </span>
                  </div>
                )}
                
                {routing && routing.route === 'pharmacy' && !isRegular && (
                  <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14, marginBottom: 6 }}>⚠️ Routing Conflict</div>
                    <div style={{ color: 'var(--mmh-text2)', fontSize: 12 }}>
                      {routing.reason}. Provide paid medicines at the Pharmacy instead.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Add Medicines */}
        {selectedPatient && (!isRegular && (!routing || routing.route !== 'pharmacy')) && (
          <div className="mmh-card" style={{ position: 'relative' }}>
            {!isOpen && <ClosedOverlay opensAt={status?.opensAt} />}
            <div className="mmh-card-header">
              <div className="mmh-card-title">Step 2 — Select Medicines</div>
            </div>
            <div className="mmh-card-body" style={{ paddingTop: 0 }}>
              <input
                className="mmh-input"
                placeholder="Search medicine..."
                value={medSearch}
                onChange={e => setMedSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredMeds.map(m => {
                  const inCart = cart.find(c => c.medicine === m._id);
                  const stockColor = getStockColor(m.quantity, m.minQuantity);
                  return (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--mmh-bg3)', borderRadius: 8, border: `1px solid ${inCart ? 'var(--mmh-accent)' : 'var(--mmh-border)'}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mmh-text)' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--mmh-text3)' }}>{m.generic || '—'} · {m.category}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: stockColor }}>{m.quantity}</div>
                        <div style={{ fontSize: 10, color: 'var(--mmh-text3)' }}>{m.unit}</div>
                      </div>
                      <button
                        onClick={() => addToCart(m)}
                        disabled={!!inCart || m.quantity === 0}
                        style={{ padding: '4px 12px', borderRadius: 8, border: 'none', cursor: inCart || m.quantity === 0 ? 'not-allowed' : 'pointer', background: inCart ? '#065f46' : 'var(--mmh-accent)', color: 'white', fontSize: 11, fontWeight: 700, opacity: m.quantity === 0 ? 0.4 : 1 }}
                      >
                        {inCart ? '✓ Added' : m.quantity === 0 ? 'Out' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="mmh-field" style={{ marginTop: 14 }}>
                <label className="mmh-label">Notes (optional)</label>
                <textarea className="mmh-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div style={{ position: 'sticky', top: 20 }}>
        <div className="mmh-card" style={{ position: 'relative' }}>
          {!isOpen && <ClosedOverlay opensAt={status?.opensAt} />}
          <div className="mmh-card-header" style={{ borderBottom: '2px solid #065f46' }}>
            <div className="mmh-card-title">🛒 Dispense Cart</div>
            <span className="mmh-badge mmh-badge-green" style={{ fontFamily: 'monospace' }}>{cart.length} items</span>
          </div>
          <div className="mmh-card-body" style={{ padding: 0 }}>
            {cart.length === 0 ? (
              <div className="mmh-empty" style={{ padding: 32 }}>
                <div className="mmh-empty-icon">💊</div>
                <div className="mmh-empty-text">Cart is empty</div>
                <div className="mmh-empty-sub">Select a patient and add medicines</div>
              </div>
            ) : (
              <>
                <div style={{ padding: '0 16px', maxHeight: 320, overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.medicine} style={{ padding: '10px 0', borderBottom: '1px solid var(--mmh-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mmh-text)' }}>{item.medicineName}</div>
                        <div style={{ fontSize: 10, color: getStockColor(item.available, 0) }}>Available: {item.available} {item.unit}</div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={item.available}
                        value={item.quantity}
                        onChange={e => updateQty(item.medicine, parseInt(e.target.value) || 1)}
                        style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--mmh-border)', background: 'var(--mmh-bg3)', color: 'var(--mmh-text)', textAlign: 'center', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--mmh-text3)' }}>{item.unit}</span>
                      <button onClick={() => removeFromCart(item.medicine)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 16px', background: 'rgba(6,95,70,0.15)', borderTop: '1px solid #065f46' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: 'var(--mmh-text3)' }}>Total Items</span>
                    <span style={{ fontWeight: 700 }}>{cart.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                    <span style={{ color: 'var(--mmh-text3)' }}>Total Units</span>
                    <span style={{ fontWeight: 700 }}>{cart.reduce((s, c) => s + c.quantity, 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '8px 12px', background: '#052e16', borderRadius: 8, border: '1px solid #065f46' }}>
                    <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>Amount</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#34d399' }}>FREE (Trust Dispensary)</span>
                  </div>
                  <button
                    onClick={handleDispense}
                    disabled={!selectedPatient || cart.length === 0 || submitting || !isOpen}
                    className="mmh-btn mmh-btn-primary"
                    style={{ width: '100%', background: '#065f46', borderColor: '#065f46', fontSize: 14, fontWeight: 800, opacity: (!selectedPatient || cart.length === 0 || !isOpen) ? 0.5 : 1 }}
                  >
                    {submitting ? '⏳ Dispensing...' : '🎁 Dispense FREE'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — STOCK
// ═══════════════════════════════════════════════════════════════════════════════
const StockTab: React.FC<{ medicines: Medicine[]; fetchMedicines: (p?: object) => void; loading: boolean; setLoading: (v: boolean) => void }> = ({ medicines, fetchMedicines, loading, setLoading }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ name: '', generic: '', category: 'Other', quantity: 0, minQuantity: 10, unit: 'Tablets', source: 'Trust Funded', donorName: '', expiryDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params: any = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;
    if (stockFilter !== 'all') params.stock = stockFilter;
    const timer = setTimeout(() => fetchMedicines(params), 300);
    return () => clearTimeout(timer);
  }, [search, category, stockFilter]);

  const filtered = medicines.filter(m => sourceFilter === 'All' || m.source === sourceFilter);

  const stats = {
    total: medicines.length,
    low: medicines.filter(m => m.quantity > 0 && m.quantity <= m.minQuantity).length,
    out: medicines.filter(m => m.quantity === 0).length,
    thisMonth: medicines.length,
  };

  const openAdd = () => {
    setForm({ name: '', generic: '', category: 'Other', quantity: 0, minQuantity: 10, unit: 'Tablets', source: 'Trust Funded', donorName: '', expiryDate: '' });
    setEditMedicine(null);
    setShowAddModal(true);
  };

  const openEdit = (m: Medicine) => {
    setForm({ name: m.name, generic: m.generic || '', category: m.category, quantity: m.quantity, minQuantity: m.minQuantity, unit: m.unit, source: m.source, donorName: m.donorName || '', expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : '' });
    setEditMedicine(m);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity) };
      if (editMedicine) {
        await dispensaryAPI.updateMedicine(editMedicine._id, payload);
      } else {
        await dispensaryAPI.addMedicine(payload);
      }
      setShowAddModal(false);
      fetchMedicines();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (m: Medicine) => {
    const qty = prompt(`Add units to ${m.name}\nCurrent: ${m.quantity} ${m.unit}\nEnter quantity to add:`);
    if (!qty || isNaN(Number(qty))) return;
    try {
      await dispensaryAPI.updateMedicine(m._id, { quantity: m.quantity + Number(qty) });
      fetchMedicines();
    } catch { alert('Failed to restock'); }
  };

  return (
    <div>
      {/* Stats */}
      <div className="mmh-stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Medicines', value: stats.total, icon: '💊', accent: 'var(--mmh-accent)' },
          { label: 'Low Stock', value: stats.low, icon: '⚠️', accent: '#f59e0b' },
          { label: 'Out of Stock', value: stats.out, icon: '🚫', accent: '#ef4444' },
          { label: 'Added This Month', value: stats.thisMonth, icon: '📅', accent: '#10b981' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{ background: c.accent }} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value">{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-body">
          <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 180px 180px 180px auto', gap: 12, alignItems: 'end' }}>
            <div className="mmh-field">
              <label className="mmh-label">Search</label>
              <input className="mmh-input" placeholder="Name or generic..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Category</label>
              <select className="mmh-input-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Stock Level</label>
              <select className="mmh-input-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Source</label>
              <select className="mmh-input-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                <option value="All">All Sources</option>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="mmh-btn mmh-btn-primary mmh-btn-sm" onClick={openAdd} style={{ height: 38 }}>
              + Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mmh-card">
        <div className="mmh-card-body" style={{ padding: 0 }}>
          <div className="mmh-table-scroll">
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>#</th><th>Medicine</th><th>Generic</th><th>Category</th>
                  <th>Stock</th><th>Min</th><th>Source</th><th>Expiry</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="mmh-empty">No medicines found</td></tr>
                ) : filtered.map((m, i) => {
                  const isOut = m.quantity === 0;
                  const isLow = !isOut && m.quantity <= m.minQuantity;
                  const color = getStockColor(m.quantity, m.minQuantity);
                  return (
                    <tr key={m._id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--mmh-text)' }}>{m.name}</td>
                      <td style={{ color: 'var(--mmh-text3)', fontSize: 12 }}>{m.generic || '—'}</td>
                      <td><span className="mmh-badge mmh-badge-sky" style={{ fontSize: 10 }}>{m.category}</span></td>
                      <td>
                        <span style={{ fontWeight: 800, color, fontFamily: 'monospace', fontSize: 14 }}>{m.quantity}</span>
                        <span style={{ fontSize: 11, color: 'var(--mmh-text3)', marginLeft: 4 }}>{m.unit}</span>
                        {isLow && !isOut && <span style={{ marginLeft: 6, fontSize: 10, background: '#422006', color: '#f59e0b', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>LOW</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{m.minQuantity}</td>
                      <td><span className={`mmh-badge ${getSourceBadge(m.source)}`} style={{ fontSize: 10 }}>{m.source}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}</td>
                      <td>
                        {isOut ? (
                          <span className="mmh-badge mmh-badge-danger" style={{ fontSize: 10, fontWeight: 800 }}>OUT OF STOCK</span>
                        ) : isLow ? (
                          <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>⚠️ Low</span>
                        ) : (
                          <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>✓ OK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => openEdit(m)}>✏️ Edit</button>
                          <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => handleRestock(m)} style={{ color: '#34d399' }}>📦 Restock</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="mmh-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="mmh-modal-header">
              <h2 className="mmh-modal-title">{editMedicine ? '✏️ Edit Medicine' : '+ Add Dispensary Medicine'}</h2>
              <button className="mmh-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mmh-modal-body">
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Medicine Name *</label>
                    <input className="mmh-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Generic Name</label>
                    <input className="mmh-input" value={form.generic} onChange={e => setForm({ ...form, generic: e.target.value })} />
                  </div>
                </div>
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Category</label>
                    <select className="mmh-input-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Unit</label>
                    <select className="mmh-input-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Quantity</label>
                    <input className="mmh-input" type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Min Stock Alert Level</label>
                    <input className="mmh-input" type="number" min={1} value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mmh-form-grid">
                  <div className="mmh-field">
                    <label className="mmh-label">Source</label>
                    <select className="mmh-input-select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                      {SOURCES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="mmh-field">
                    <label className="mmh-label">Expiry Date</label>
                    <input className="mmh-input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                {form.source === 'Donated' && (
                  <div className="mmh-field">
                    <label className="mmh-label">Donor Name</label>
                    <input className="mmh-input" value={form.donorName} onChange={e => setForm({ ...form, donorName: e.target.value })} placeholder="e.g. Al-Khidmat Foundation" />
                  </div>
                )}
              </div>
              <div className="mmh-modal-footer">
                <button type="button" className="mmh-btn mmh-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="mmh-btn mmh-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editMedicine ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — HISTORY
// ═══════════════════════════════════════════════════════════════════════════════
const HistoryTab: React.FC<{ history: DispenseRecord[]; fetchHistory: (p?: object) => void }> = ({ history, fetchHistory }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setFrom(today);
    setTo(today);
    fetchHistory({ from: today, to: today });
  }, []);

  const applyFilter = () => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (patientSearch) params.patient = patientSearch;
    if (staffSearch) params.dispensedBy = staffSearch;
    fetchHistory(params);
  };

  const exportCSV = () => {
    const rows = [['Date', 'Patient', 'MR#', 'Type', 'Medicines', 'Dispensed By']];
    history.forEach(h => {
      rows.push([
        new Date(h.dispenseTime).toLocaleString(),
        h.patient?.name || '', h.patient?.mrNumber || '', h.patient?.patientType || '',
        h.items.map(i => `${i.medicineName} x${i.quantity}`).join('; '),
        h.dispensedBy?.name || '',
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dispensary-${from || 'report'}.csv`; a.click();
  };

  return (
    <div>
      <div className="mmh-card" style={{ marginBottom: 20 }}>
        <div className="mmh-card-body">
          <div className="mmh-form-grid" style={{ gridTemplateColumns: '160px 160px 1fr 1fr auto auto', gap: 12, alignItems: 'end' }}>
            <div className="mmh-field">
              <label className="mmh-label">From Date</label>
              <input type="date" className="mmh-input" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">To Date</label>
              <input type="date" className="mmh-input" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Search Patient</label>
              <input className="mmh-input" placeholder="Name or MR#..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            <div className="mmh-field">
              <label className="mmh-label">Dispensed By</label>
              <input className="mmh-input" placeholder="Staff name..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            </div>
            <button className="mmh-btn mmh-btn-primary mmh-btn-sm" style={{ height: 38 }} onClick={applyFilter}>🔍 Filter</button>
            <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" style={{ height: 38 }} onClick={exportCSV}>📥 Export</button>
          </div>
        </div>
      </div>

      <div className="mmh-card">
        <div className="mmh-card-body" style={{ padding: 0 }}>
          <div className="mmh-table-scroll">
            <table className="mmh-table">
              <thead>
                <tr>
                  <th>#</th><th>Date &amp; Time</th><th>Patient</th><th>MR#</th>
                  <th>Type</th><th>Medicines</th><th>Units</th><th>Dispensed By</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={8} className="mmh-empty">No history found</td></tr>
                ) : history.map((h, i) => {
                  const badge = getTypeBadge(h.patient?.patientType);
                  return (
                    <tr key={h._id}>
                      <td>{i + 1}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(h.dispenseTime).toLocaleString('en-PK')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--mmh-text)' }}>{h.patient?.name || '—'}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--mmh-accent)', fontWeight: 700, fontSize: 12 }}>{h.patient?.mrNumber || '—'}</td>
                      <td>
                        <span style={{ padding: '2px 10px', borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 10, fontWeight: 800 }}>
                          {h.patient?.patientType || 'Regular'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--mmh-text2)', maxWidth: 200 }}>
                        {h.items.map(it => `${it.medicineName} ×${it.quantity}`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                        {h.items.reduce((s, it) => s + it.quantity, 0)}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{h.dispensedBy?.name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispensaryPage;
