import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import MyLeaveTab from '../components/MyLeaveTab';
import PatientHistoryModal from '../components/PatientHistoryModal';
import { opdAPI, pharmacyAPI, prescriptionAPI, patientAPI } from '../api';
import '../styles/mmh.css';

interface DoctorProps {
  user: any;
}

const Doctor: React.FC<DoctorProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'assigned';

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // History Modal State
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<{ id: string, mr: string } | null>(null);

  // Examine Modal State
  const [examiningVisit, setExaminingVisit] = useState<any>(null);

  // Filters for Records & History
  const [filters, setFilters] = useState({
    search: '',
    from: '',
    to: ''
  });

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'assigned') {
        res = await opdAPI.getToday();
      } else {
        // records or history - both use getDoctorAllVisits with filters
        res = await opdAPI.getDoctorAllVisits({
          ...filters,
          tab // backend can refine if needed, or we filter client-side
        });
      }
      if (res.data.success) {
        setVisits(res.data.data);
      }
    } catch (err) {
      console.error('Fetch visits error:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleStatusUpdate = async (visitId: string, newStatus: string) => {
    setUpdatingStatus(visitId);
    try {
      await opdAPI.updateStatus(visitId, newStatus);
      // Optimistic update
      setVisits(prev => prev.map(v => v._id === visitId ? { ...v, status: newStatus } : v));
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Waiting': return 'mmh-badge-amber';
      case 'Examining': return 'mmh-badge-sky';
      case 'Examined': return 'mmh-badge-green';
      case 'Done': return 'mmh-badge-zinc';
      default: return 'mmh-badge-zinc';
    }
  };

  return (
    <MainLayout user={user} title={`Welcome,   ${user.name}`} subtitle={`${user.department || 'General Medicine'} Practitioner`}>
      {/* Tab Navigation */}
      <div className="mmh-page-tabs" style={{ marginBottom: '24px', padding: '0' }}>
        <button className={`mmh-page-tab ${tab === 'assigned' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'assigned' })}>
          📅 Assigned Patients
        </button>
        <button className={`mmh-page-tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'records' })}>
          📁 Patient Records
        </button>
        <button className={`mmh-page-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'history' })}>
          📜 Clinical History
        </button>
        <button className={`mmh-page-tab ${tab === 'my-leave' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'my-leave' })}>
          🏖️ My Leave
        </button>
      </div>

      {tab === 'my-leave' && <MyLeaveTab userRole={user.role} />}

      {(tab === 'assigned' || tab === 'records' || tab === 'history') && (
        <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
          {/* Header & Local Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
            <div className="mmh-card-title">
              {tab === 'assigned' ? 'Today\'s Patient Queue' : tab === 'records' ? 'Past Consultations' : 'Medical Case History'}
            </div>

            {(tab === 'records' || tab === 'history') && (
              <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '600px' }}>
                <input
                  type="text"
                  className="mmh-input"
                  style={{ height: '36px', fontSize: '13px' }}
                  placeholder="Filter name or MR#..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />
                <input
                  type="date"
                  className="mmh-input"
                  style={{ height: '36px', fontSize: '13px', width: '130px' }}
                  value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                />
                <input
                  type="date"
                  className="mmh-input"
                  style={{ height: '36px', fontSize: '13px', width: '130px' }}
                  value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                />
              </div>
            )}

            <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchVisits} disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Sync Queue'}
            </button>
          </div>

          <div className="mmh-table-card">
            <div className="mmh-table-card-top" style={{ background: 'var(--mmh-accent)' }} />
            <div className="mmh-table-scroll">
              <table className="mmh-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient Detail</th>
                    <th>MR Number</th>
                    <th>Status</th>
                    {tab === 'assigned' && <th>Consultation</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}><div className="mmh-spinner" style={{ margin: 'auto' }} /></td></tr>
                  ) : visits.length === 0 ? (
                    <tr><td colSpan={6} className="mmh-empty">No patients found.</td></tr>
                  ) : visits.map(v => (
                    <tr key={v._id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: '900', color: 'var(--mmh-accent)' }}>
                          #{v.tokenNumber?.padStart(4, '0') || '0000'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mmh-bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: 'var(--mmh-accent)', border: '1px solid var(--mmh-border)' }}>
                            {v.patient?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="mmh-td-name">{v.patient?.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--mmh-text3)' }}>{v.patient?.age}y • {v.patient?.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button className="mmh-mr-link" onClick={() => setSelectedPatientHistory({ id: v.patient?._id, mr: v.patient?.mrNumber })}>
                          {v.patient?.mrNumber}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`mmh-badge ${getStatusBadgeClass(v.status)}`}>{v.status}</span>
                          {updatingStatus === v._id && <div className="mmh-spinner-sm" />}
                        </div>
                      </td>
                      {tab === 'assigned' && (
                        <td>
                          <select
                            className="mmh-status-select"
                            value={v.status}
                            onChange={(e) => handleStatusUpdate(v._id, e.target.value)}
                            disabled={updatingStatus === v._id}
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="Examining">In Consult</option>
                            <option value="Examined">Examined</option>
                            <option value="Done">Completed</option>
                          </select>
                        </td>
                      )}
                      <td>
                        <button
                          className={`mmh-btn mmh-btn-sm ${v.status === 'Examined' || v.status === 'Done' ? 'mmh-btn-ghost' : 'mmh-btn-primary'}`}
                          onClick={() => setExaminingVisit(v)}
                        >
                          {v.status === 'Examined' || v.status === 'Done' ? 'View Details' : 'Examine'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Examine / Prescription Modal */}
      {examiningVisit && (
        <ExamineModal
          visit={examiningVisit}
          onClose={() => setExaminingVisit(null)}
          onSuccess={() => { setExaminingVisit(null); fetchVisits(); }}
          onHistoryClick={(p) => setSelectedPatientHistory(p)}
        />
      )}

      {/* Patient History Modal */}
      {selectedPatientHistory && (
        <PatientHistoryModal
          patientId={selectedPatientHistory.id}
          mrNumber={selectedPatientHistory.mr}
          onClose={() => setSelectedPatientHistory(null)}
        />
      )}
    </MainLayout>
  );
};

/* ═══ SUB-COMPONENT: EXAMINE MODAL ════════════════════════ */
const ExamineModal = ({ visit, onClose, onSuccess, onHistoryClick }: { visit: any, onClose: () => void, onSuccess: () => void, onHistoryClick: (p: any) => void }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescribedItems, setPrescribedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Medicine Search
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState<any[]>([]);
  const [searchingMed, setSearchingMed] = useState(false);

  useEffect(() => {
    if (medQuery.length > 1) {
      const delay = setTimeout(async () => {
        setSearchingMed(true);
        try {
          const res = await pharmacyAPI.getMedicines({ search: medQuery });
          // Note: getMedicines returns array directly as per existing controller
          setMedResults(Array.isArray(res.data) ? res.data : []);
        } finally {
          setSearchingMed(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setMedResults([]);
    }
  }, [medQuery]);

  const addMedicine = (med: any) => {
    setPrescribedItems([...prescribedItems, {
      medicineName: med.name,
      dosage: '1-0-1',
      frequency: 'Daily',
      duration: '5 Days',
      quantity: 1,
      notes: ''
    }]);
    setMedQuery('');
    setMedResults([]);
  };

  const removeMedicine = (idx: number) => {
    setPrescribedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setPrescribedItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    if (!diagnosis) return alert('Diagnosis is required');
    if (prescribedItems.length === 0) return alert('Add at least one medicine');

    setLoading(true);
    try {
      await prescriptionAPI.create({
        opdVisit: visit._id,
        patient: visit.patient?._id,
        diagnosis,
        items: prescribedItems,
        notes
      });
      onSuccess();
    } catch (err) {
      console.error('Save prescription error:', err);
      alert('Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mmh-overlay" onClick={onClose}>
      <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', height: '95vh', display: 'flex', flexDirection: 'column' }}>
        <div className="mmh-modal-header" style={{ padding: '16px 24px', background: 'var(--mmh-bg3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="mmh-modal-title" style={{ fontSize: '18px' }}>Examine Patient: {visit.patient?.name}</div>
              <span className="mmh-badge mmh-badge-sky">Token #{visit.tokenNumber}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mmh-text3)', marginTop: '4px' }}>
              Complaints: {visit.chiefComplaint || 'No recorded complaint'}
            </div>
          </div>
          <button className="mmh-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="mmh-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div className="mmh-examine-2col">
            {/* Left: Patient Info & Quick History Link */}
            <div>
              <div style={{ background: 'var(--mmh-bg2)', border: '1px solid var(--mmh-border)', borderRadius: '15px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--mmh-text)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  Patient Bio Data
                  <button className="mmh-mr-link" onClick={() => onHistoryClick({ id: visit.patient?._id, mr: visit.patient?.mrNumber })}>View Full History →</button>
                </div>
                <div className="mmh-info-list">
                  <div className="mmh-info-row"><span className="mmh-info-key">MR Number</span><span className="mmh-info-val" style={{ color: 'var(--mmh-accent)' }}>{visit.patient?.mrNumber}</span></div>
                  <div className="mmh-info-row"><span className="mmh-info-key">Age / Sex</span><span className="mmh-info-val">{visit.patient?.age}y / {visit.patient?.gender}</span></div>
                  <div className="mmh-info-row"><span className="mmh-info-key">Blood Group</span><span className="mmh-info-val">{visit.patient?.bloodGroup || 'Not Known'}</span></div>
                  <div className="mmh-info-row"><span className="mmh-info-key">Weight / BP</span><span className="mmh-info-val">{visit.weight || '--'} kg / {visit.bp || '--'}</span></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="mmh-label">Final Diagnosis <span style={{ color: 'var(--mmh-danger)' }}>*</span></label>
                <textarea
                  className="mmh-textarea"
                  placeholder="Clinical assessment and diagnosis..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div>
                <label className="mmh-label">Consultation Notes (Optional)</label>
                <textarea
                  className="mmh-textarea"
                  placeholder="Internal notes or additional advice..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
            </div>

            {/* Right: Prescription Cart */}
            <div style={{ borderLeft: '1px solid var(--mmh-border)', paddingLeft: '20px' }}>
              <label className="mmh-label">💊 Prescription Cart</label>

              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="mmh-input"
                  placeholder="Search medicine name..."
                  value={medQuery}
                  onChange={e => setMedQuery(e.target.value)}
                />
                {searchingMed && <div className="mmh-spinner-sm" style={{ position: 'absolute', right: '14px', top: '14px' }} />}

                {medResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '50px', left: 0, right: 0, background: 'var(--mmh-bg2)', border: '1px solid var(--mmh-border)', borderRadius: '12px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {medResults.map(m => (
                      <div key={m._id} className="mmh-select-item" onClick={() => addMedicine(m)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--mmh-border)', fontSize: '13px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--mmh-text)' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--mmh-text3)' }}>{m.unit} • In Stock: {m.quantity}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prescribedItems.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'var(--mmh-bg3)', borderRadius: '12px', border: '1px dashed var(--mmh-border)', color: 'var(--mmh-text3)', fontSize: '13px' }}>
                    No medicines added yet.
                  </div>
                ) : (
                  prescribedItems.map((item, idx) => (
                    <div key={idx} className="mmh-rx-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="mmh-rx-name">{item.medicineName}</div>
                        <button className="mmh-rx-remove" onClick={() => removeMedicine(idx)}>×</button>
                      </div>
                      <div className="mmh-form-grid-3" style={{ gap: '8px' }}>
                        <div>
                          <input
                            className="mmh-input"
                            style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
                            placeholder="Dosage (1-0-1)"
                            value={item.dosage}
                            onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            className="mmh-input"
                            style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
                            placeholder="Freq (Daily)"
                            value={item.frequency}
                            onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            className="mmh-input"
                            style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
                            placeholder="Dur (5 days)"
                            value={item.duration}
                            onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mmh-modal-footer">
          <button className="mmh-btn mmh-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="mmh-btn mmh-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : '📝 Save Prescription & Mark Examined'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Doctor;
