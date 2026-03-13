import React, { useState, useEffect } from 'react';
import api from '../api';
import MainLayout from '../components/MainLayout';
import '../styles/mmh.css';

const Pharmacist: React.FC = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{"name":"Pharmacist","role":"pharmacist"}');
    const [tab, setTab] = useState('dispense');
    const [medicines, setMedicines] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [selPatientId, setSelPatientId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, pRes] = await Promise.all([api.get('/medicines'), api.get('/patients')]);
            setMedicines(mRes.data);
            setPatients(pRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const addToCart = () => setCart([...cart, { medicineId: '', qty: 1, price: 0, total: 0 }]);

    const updateCart = (index: number, field: string, value: any) => {
        const newCart = [...cart];
        newCart[index][field] = value;
        if (field === 'medicineId') {
            const med = medicines.find(m => m._id === value);
            newCart[index].price = med?.price || 0;
            newCart[index].total = newCart[index].qty * newCart[index].price;
        }
        if (field === 'qty') {
            newCart[index].total = value * newCart[index].price;
        }
        setCart(newCart);
    };

    const handleDispense = async () => {
        if (!selPatientId || cart.length === 0) return alert("Select patient and add medicines");
        try {
            setLoading(true);
            for (const item of cart) {
                const med = medicines.find(m => m._id === item.medicineId);
                await api.put(`/medicines/${item.medicineId}`, { stock: med.stock - item.qty });
            }
            alert('Medicine Dispensed Successfully!');
            setCart([]);
            setSelPatientId('');
            fetchData();
        } catch (err) { alert('Dispensing failed'); }
        setLoading(false);
    };

    return (
        <MainLayout user={user} title="Pharmacy & Dispensary" subtitle="Inventory management & prescription fulfillment">
            <div className="mmh-admin-tabs" style={{ marginBottom: '24px' }}>
                <button className={`mmh-admin-tab ${tab === 'dispense' ? 'active' : ''}`} onClick={() => setTab('dispense')}>Prescription Dispensing</button>
                <button className={`mmh-admin-tab ${tab === 'inv' ? 'active' : ''}`} onClick={() => setTab('inv')}>Live Inventory Status</button>
            </div>

            {tab === 'dispense' && (
                <div style={{ animation: 'mmh-slide-up 0.3s ease' }}>
                    <div className="mmh-card" style={{ marginBottom: '24px' }}>
                        <div className="mmh-card-accent-top" style={{ background: 'var(--mmh-amber)' }} />
                        <div className="mmh-card-header">
                            <div className="mmh-card-title">Dispense Medicines</div>
                        </div>
                        <div className="mmh-card-body">
                            <div className="mmh-field" style={{ maxWidth: '400px', marginBottom: '24px' }}>
                                <label className="mmh-label">Patient Profile</label>
                                <select className="mmh-input-select" value={selPatientId} onChange={e => setSelPatientId(e.target.value)}>
                                    <option value="">Search Patient MR# / Name</option>
                                    {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.mr})</option>)}
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {cart.map((item, i) => (
                                    <div key={i} className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 120px 150px 50px', alignItems: 'flex-end', background: 'var(--mmh-bg3)', padding: '12px', borderRadius: '12px', border: '1px solid var(--mmh-border)' }}>
                                        <div className="mmh-field">
                                            <label className="mmh-label">Select Medicine</label>
                                            <select className="mmh-input-select" value={item.medicineId} onChange={e => updateCart(i, 'medicineId', e.target.value)}>
                                                <option value="">Select SKU</option>
                                                {medicines.map(m => <option key={m._id} value={m._id}>{m.name} (Stock: {m.stock})</option>)}
                                            </select>
                                        </div>
                                        <div className="mmh-field">
                                            <label className="mmh-label">Quantity</label>
                                            <input type="number" className="mmh-input" value={item.qty} onChange={e => updateCart(i, 'qty', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div className="mmh-field">
                                            <label className="mmh-label">Line Total (PKR)</label>
                                            <div style={{ height: '46px', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--mmh-green)' }}>
                                                {item.total.toFixed(2)}
                                            </div>
                                        </div>
                                        <button className="mmh-btn mmh-btn-danger mmh-btn-xs" onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>🗑️</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={addToCart}>+ Add Item Line</button>
                            </div>

                            {cart.length > 0 && (
                                <div style={{ marginTop: '32px', borderTop: '1px solid var(--mmh-border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--mmh-muted)' }}>Payable Amount</div>
                                        <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', fontFamily: 'JetBrains Mono' }}>
                                            RS {cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <button className="mmh-btn mmh-btn-primary" onClick={handleDispense} disabled={loading}>
                                        {loading ? <div className="mmh-spinner" /> : 'Confirm & Print Invoice'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'inv' && (
                <div className="mmh-table-card" style={{ animation: 'mmh-fade-in 0.3s ease' }}>
                    <div className="mmh-table-card-top" style={{ background: 'var(--mmh-green)' }} />
                    <div className="mmh-table-card-header">
                        <div className="mmh-card-title">Pharmacy Stock Register</div>
                        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchData}>Refresh Stock</button>
                    </div>
                    <div className="mmh-table-scroll">
                        <table className="mmh-table">
                            <thead>
                                <tr><th>Medicine SKU</th><th>Category</th><th>Available Stock</th><th>Unit Price</th><th>Inventory Status</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="mmh-empty">Syncing inventory...</td></tr>
                                ) : medicines.length === 0 ? (
                                    <tr><td colSpan={5} className="mmh-empty">Zero stock records found</td></tr>
                                ) : medicines.map(m => (
                                    <tr key={m._id}>
                                        <td className="mmh-td-name">{m.name}</td>
                                        <td><span className="mmh-badge mmh-badge-gray">{m.category}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 800 }}>{m.stock} <span style={{ fontSize: '10px', color: 'var(--mmh-muted)' }}>{m.unit}</span></div>
                                            <div style={{ height: '3px', background: 'var(--mmh-bg3)', width: '100px', marginTop: '5px', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: m.stock <= 20 ? 'var(--mmh-rose)' : 'var(--mmh-green)', width: `${Math.min(100, (m.stock/100)*100)}%` }} />
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{m.price?.toFixed(2)}</td>
                                        <td>
                                            <span className={`mmh-badge mmh-badge-${m.stock <= 20 ? 'rose' : 'green'}`}>
                                                {m.stock <= 20 ? 'Reorder Required' : 'Optimized'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Pharmacist;
