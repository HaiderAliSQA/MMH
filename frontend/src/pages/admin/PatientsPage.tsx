import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface OPDRecord {
    _id: string;
    token: string;
    patientName: string;
    mrNumber: string;
    age: number;
    gender: string;
    cnic: string;
    doctorName: string;
    department: string;
    status: 'Waiting' | 'In Progress' | 'Done';
    isUrgent: boolean;
    createdBy: string;
    createdAt: string;
}

const PatientsPage: React.FC = () => {
    const [records, setRecords] = useState<OPDRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState({ today: 0, total: 0, admitted: 0, discharged: 0 });

    useEffect(() => {
        fetchRecords();
    }, [date]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            // Mocking for now as we don't have separate OPD endpoint yet
            const res = await api.get(`/patients?date=${date}`);
            const data = (res.data || []).map((p: any) => ({
                _id: p._id,
                token: p.token || `#${Math.floor(Math.random() * 100).toString().padStart(4, '0')}`,
                patientName: p.name,
                mrNumber: p.mrNumber || `MMH-2025-${Math.floor(Math.random() * 90000) + 10000}`,
                age: p.age || 25,
                gender: p.gender || 'Male',
                cnic: p.cnic || '42101-XXXXXXX-X',
                doctorName: p.assignedDoctor?.name || 'Dr. Hamid Raza',
                department: p.assignedDoctor?.department || 'General Medicine',
                status: p.status === 'OPD' ? 'Waiting' : 'Done',
                isUrgent: p.priority === 'High',
                createdBy: 'Zara (Receptionist)',
                createdAt: p.createdAt
            }));
            setRecords(data);
            setStats({
                today: data.length,
                total: data.length * 12,
                admitted: Math.floor(data.length * 0.2),
                discharged: Math.floor(data.length * 0.15)
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const printSlip = (visit: OPDRecord) => {
        const w = window.open('', '', 'width=400,height=600');
        if (!w) return;
        
        const slipHTML = `
            <html>
            <head>
                <title>OPD Slip - ${visit.token}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; color: #000; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .hospital { font-size: 20px; font-weight: bold; }
                    .title { font-size: 14px; text-transform: uppercase; margin-top: 5px; }
                    .token-box { border: 2px solid #000; width: 100px; margin: 20px auto; padding: 10px; text-align: center; }
                    .token-num { font-size: 40px; font-weight: bold; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
                    .label { font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="hospital">MAJIDA MEMORIAL HOSPITAL</div>
                    <div>MMH · CHINIOT</div>
                    <div class="title">--- OPD Registration ---</div>
                </div>
                <div class="token-box">
                    <div style="font-size: 10px">TOKEN NUMBER</div>
                    <div class="token-num">${visit.token.replace('#', '')}</div>
                </div>
                <div class="row"><span class="label">Patient:</span> <span>${visit.patientName}</span></div>
                <div class="row"><span class="label">MR#:</span> <span>${visit.mrNumber}</span></div>
                <div class="row"><span class="label">Age/Gender:</span> <span>${visit.age} / ${visit.gender}</span></div>
                <div class="row"><span class="label">CNIC:</span> <span>${visit.cnic}</span></div>
                <div class="row"><span class="label">Doctor:</span> <span>${visit.doctorName}</span></div>
                <div class="row"><span class="label">Dept:</span> <span>${visit.department}</span></div>
                <div class="row"><span class="label">Date:</span> <span>${new Date(visit.createdAt).toLocaleDateString()}</span></div>
                <div class="row"><span class="label">Time:</span> <span>${new Date(visit.createdAt).toLocaleTimeString()}</span></div>
                <div class="footer">
                    Please show this slip at the assigned doctor's counter.<br>
                    Generated by MMH System Core v2.5
                </div>
                <script>window.print(); window.close();</script>
            </body>
            </html>
        `;
        w.document.write(slipHTML);
        w.document.close();
    };

    const filtered = records.filter(r => 
        r.patientName.toLowerCase().includes(search.toLowerCase()) || 
        r.mrNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="mmh-page-header">
                <div>
                    <h1 className="mmh-page-title">👥 Patients & OPD Records</h1>
                    <p className="mmh-page-sub">View all patient visits and OPD slips</p>
                </div>
            </div>

            <div className="mmh-filter-row">
                <div className="mmh-search-wrap">
                    <div className="mmh-search-icon">🔍</div>
                    <input 
                        className="mmh-search-input" 
                        placeholder="Search by patient name or MR number..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <input 
                    type="date" 
                    className="mmh-select" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                />
                <select className="mmh-select">
                    <option>All Staff</option>
                    <option>Zara (Receptionist)</option>
                    <option>Ali (Manager)</option>
                </select>
                <select className="mmh-select">
                    <option>All Roles</option>
                    <option>Receptionist</option>
                    <option>Doctor</option>
                </select>
            </div>

            <div className="mmh-stat-grid">
                <div className="mmh-stat-card">
                    <div className="mmh-stat-card-bar" style={{ background: 'var(--sky)' }} />
                    <div className="mmh-stat-emoji">🎫</div>
                    <div className="mmh-stat-value">{stats.today}</div>
                    <div className="mmh-stat-label">OPD Today</div>
                </div>
                <div className="mmh-stat-card">
                    <div className="mmh-stat-card-bar" style={{ background: 'var(--violet)' }} />
                    <div className="mmh-stat-emoji">📊</div>
                    <div className="mmh-stat-value">{stats.total}</div>
                    <div className="mmh-stat-label">Total Patients</div>
                </div>
                <div className="mmh-stat-card">
                    <div className="mmh-stat-card-bar" style={{ background: 'var(--amber)' }} />
                    <div className="mmh-stat-emoji">🏥</div>
                    <div className="mmh-stat-value">{stats.admitted}</div>
                    <div className="mmh-stat-label">Admitted</div>
                </div>
                <div className="mmh-stat-card">
                    <div className="mmh-stat-card-bar" style={{ background: 'var(--green)' }} />
                    <div className="mmh-stat-emoji">✅</div>
                    <div className="mmh-stat-value">{stats.discharged}</div>
                    <div className="mmh-stat-label">Discharged Today</div>
                </div>
            </div>

            {loading ? (
                <div className="mmh-empty"><div className="mmh-spinner" style={{ width:'40px', height:'40px', margin:'0 auto' }} /></div>
            ) : filtered.length === 0 ? (
                <div className="mmh-empty">
                    <div className="mmh-empty-icon">📭</div>
                    <div className="mmh-empty-text">No records found for the selected date or search</div>
                </div>
            ) : (
                <div className="mmh-opd-grid">
                    {filtered.map(rec => (
                        <div key={rec._id} className="mmh-opd-card">
                            <div className={`mmh-opd-card-bar ${
                                rec.status === 'Waiting' ? 'mmh-opd-card-bar-waiting' : 
                                rec.status === 'In Progress' ? 'mmh-opd-card-bar-progress' : 'mmh-opd-card-bar-done'
                            }`} />
                            <div className="mmh-opd-card-body">
                                <div className="mmh-opd-token">
                                    <span>{rec.token}</span>
                                    {rec.isUrgent && <span className="mmh-badge mmh-badge-rose">URGENT</span>}
                                </div>
                                <div className="mmh-opd-patient-name">{rec.patientName}</div>
                                <div className="mmh-opd-mr">MR: {rec.mrNumber}</div>
                                <div className="mmh-opd-detail">{rec.age} yrs | {rec.gender}</div>
                                <div className="mmh-opd-divider" />
                                <div className="mmh-opd-doctor">👨‍⚕️ {rec.doctorName}</div>
                                <div className="mmh-opd-detail">Dept: {rec.department}</div>
                                <div className="mmh-opd-divider" />
                                <div className="mmh-opd-created-by">Created by: {rec.createdBy}</div>
                                <div className="mmh-opd-detail">🕒 {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div className="mmh-opd-card-footer">
                                <span className={`mmh-badge ${
                                    rec.status === 'Waiting' ? 'mmh-badge-amber' : 
                                    rec.status === 'In Progress' ? 'mmh-badge-sky' : 'mmh-badge-green'
                                }`}>
                                    {rec.status}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="mmh-btn mmh-btn-ghost mmh-btn-sm">View</button>
                                    <button className="mmh-btn mmh-btn-primary mmh-btn-sm" onClick={() => printSlip(rec)}>Print</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
