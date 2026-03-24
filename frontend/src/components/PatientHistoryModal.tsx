import React, { useState, useEffect } from 'react';
import { patientAPI, opdAPI, labAPI, prescriptionAPI, admissionAPI } from '../api';
import '../styles/mmh.css';

interface PatientHistoryModalProps {
  patientId: string;
  mrNumber: string;
  onClose: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patientId, mrNumber, onClose }) => {
  const [patient, setPatient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'opd' | 'lab' | 'rx' | 'adm'>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [pRes, opdRes, labRes, rxRes, admRes] = await Promise.allSettled([
          patientAPI.getOne(patientId),
          opdAPI.getPatientOPD(patientId),
          labAPI.getAll({ patientId }),
          prescriptionAPI.getForPatient(patientId),
          admissionAPI.getAll() // Admission API might need a patient filter, but we'll manually filter if needed
        ]);

        if (pRes.status === 'fulfilled') setPatient(pRes.value.data);

        let items: any[] = [];
        
        if (opdRes.status === 'fulfilled' && opdRes.value.data.success) {
          items = [...items, ...opdRes.value.data.data.map((v: any) => ({ ...v, type: 'opd', time: new Date(v.createdAt) }))];
        }
        
        if (labRes.status === 'fulfilled') {
          items = [...items, ...labRes.value.data.map((l: any) => ({ ...l, type: 'lab', time: new Date(l.createdAt) }))];
        }

        if (rxRes.status === 'fulfilled' && rxRes.value.data.success) {
          items = [...items, ...rxRes.value.data.data.map((r: any) => ({ ...r, type: 'rx', time: new Date(r.createdAt) }))];
        }

        if (admRes.status === 'fulfilled') {
          const patientAdmissions = admRes.value.data.filter((a: any) => a.patient?._id === patientId || a.patient === patientId);
          items = [...items, ...patientAdmissions.map((a: any) => ({ ...a, type: 'adm', time: new Date(a.createdAt) }))];
        }

        // Sort by newest first
        items.sort((a, b) => b.time.getTime() - a.time.getTime());
        setTimeline(items);

      } catch (err) {
        console.error('Failed to fetch patient history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  const filteredTimeline = timeline.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const getStats = () => {
    return {
      visits: timeline.filter(t => t.type === 'opd').length,
      labs: timeline.filter(t => t.type === 'lab').length,
      prescriptions: timeline.filter(t => t.type === 'rx').length,
      admissions: timeline.filter(t => t.type === 'adm').length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="mmh-overlay" onClick={onClose}>
        <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mmh-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="mmh-overlay" onClick={onClose}>
      <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="mmh-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: 'white' }}>
              {patient?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="mmh-modal-title" style={{ fontSize: '18px' }}>{patient?.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {mrNumber} • {patient?.age}y • {patient?.gender} • {patient?.phone}
              </div>
            </div>
          </div>
          <button className="mmh-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="mmh-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Visits', value: stats.visits, color: '#0ea5e9', icon: '👨‍⚕️' },
              { label: 'Labs', value: stats.labs, color: '#8b5cf6', icon: '🔬' },
              { label: 'Prescriptions', value: stats.prescriptions, color: '#10b981', icon: '💊' },
              { label: 'Admissions', value: stats.admissions, color: '#f43f5e', icon: '🏥' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0f1e38', border: '1px solid #1e3050', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All History' },
              { id: 'opd', label: 'OPD Visits' },
              { id: 'lab', label: 'Lab Tests' },
              { id: 'rx', label: 'Prescriptions' },
              { id: 'adm', label: 'Admissions' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: activeFilter === f.id ? 'rgba(14,165,233,0.1)' : 'transparent',
                  border: `1px solid ${activeFilter === f.id ? '#0ea5e9' : '#1e3050'}`,
                  color: activeFilter === f.id ? '#38bdf8' : '#64748b',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTimeline.length === 0 ? (
              <div className="mmh-empty" style={{ padding: '40px' }}>
                <div className="mmh-empty-text">No records found for this category</div>
              </div>
            ) : (
              filteredTimeline.map((item, idx) => (
                <div key={idx} className={`mmh-hist-item mmh-hist-${item.type}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="mmh-hist-title">
                        {item.type === 'opd' && `OPD Visit — ${item.doctor?.name || 'Doctor'}`}
                        {item.type === 'lab' && `Lab Request — ${item.labId}`}
                        {item.type === 'rx' && `Prescription — ${item.diagnosis || 'Diagnosis'}`}
                        {item.type === 'adm' && `Admission — ${item.wardId?.name || 'Ward'}`}
                      </div>
                      <div className="mmh-hist-sub">
                        {item.time.toLocaleDateString()} {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {item.status && <span className="mmh-badge mmh-badge-sky" style={{ marginLeft: '10px', fontSize: '10px', padding: '1px 6px' }}>{item.status}</span>}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        {item.type === 'opd' && item.chiefComplaint && (
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Complaint: {item.chiefComplaint}</div>
                        )}
                        {item.type === 'lab' && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {item.tests?.map((t: string) => <span key={t} className="mmh-test-tag">{t}</span>)}
                          </div>
                        )}
                        {item.type === 'rx' && (
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                            {item.items?.length} medicines prescribed
                          </div>
                        )}
                      </div>
                    </div>
                    {item.type === 'opd' && item.tokenNumber && (
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: '900', color: '#0ea5e9' }}>
                        #{String(item.tokenNumber).padStart(4, '0')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mmh-modal-footer">
          <button className="mmh-btn mmh-btn-ghost" onClick={onClose}>Close History</button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;
