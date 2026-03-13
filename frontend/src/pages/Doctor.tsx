import React, { useState, useEffect } from 'react';
import api from '../api';
import MainLayout from '../components/MainLayout';
import PatientRecords from '../components/PatientRecords';
import '../styles/mmh.css';

interface DoctorProps {
    user: any;
}

const Doctor: React.FC<DoctorProps> = ({ user }) => {
    const [tab, setTab] = useState('patients');
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/patients');
            // Filter by doctor name if needed
            setPatients(res.data); 
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <MainLayout user={user} title={`Welcome, ${user.name}`} subtitle="Medical Practitioner Portal">
            <div className="mmh-admin-tabs" style={{ marginBottom: '24px' }}>
                <button className={`mmh-admin-tab ${tab === 'patients' ? 'active' : ''}`} onClick={() => setTab('patients')}>Assigned Patients</button>
                <button className={`mmh-admin-tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Patient Records</button>
                <button className={`mmh-admin-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Clinical History</button>
            </div>

            {tab === 'records' && <PatientRecords />}

            {tab === 'patients' && (
                <div className="mmh-table-card" style={{ animation: 'mmh-fade-in 0.3s ease' }}>
                    <div className="mmh-table-card-top" style={{ background: 'var(--mmh-violet)' }} />
                    <div className="mmh-table-card-header">
                        <div className="mmh-card-title">Active OPD / In-Patient List</div>
                        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchPatients}>Refresh</button>
                    </div>
                    <div className="mmh-table-scroll">
                        <table className="mmh-table">
                            <thead>
                                <tr><th>Token</th><th>MR#</th><th>Patient Name</th><th>Age/Sex</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="mmh-empty">Consulting records...</td></tr>
                                ) : patients.length === 0 ? (
                                    <tr><td colSpan={6} className="mmh-empty">No patients currently in queue</td></tr>
                                ) : patients.map(p => (
                                    <tr key={p._id}>
                                        <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--mmh-violet)', fontWeight: 800 }}>{p.token}</td>
                                        <td style={{ fontWeight: 700 }}>{p.mr}</td>
                                        <td className="mmh-td-name">{p.name}</td>
                                        <td>{p.age} / {p.gender}</td>
                                        <td><span className={`mmh-badge mmh-badge-${p.status === 'Admitted' ? 'rose' : 'green'}`}>{p.status}</span></td>
                                        <td>
                                            <button className="mmh-btn mmh-btn-ghost mmh-btn-xs">Examine</button>
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

export default Doctor;
