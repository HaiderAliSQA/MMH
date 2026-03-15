import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

// ─── Types ──────────────────────────────────────────────────────────
interface Patient { _id: string; name: string; mrNo?: string; age?: number; }
interface Doctor  { _id: string; name: string; doctorInfo?: { department: string } }
interface Ward    { _id: string; name: string; capacity: number }
interface Bed     { _id: string; wardId: string; number: string; status: string }
interface OpdRecord {
  _id: string; name: string; mrNo: string; age: number; gender: string;
  doctor: string; status: string; token: number; createdAt: string;
}

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];
const PAYMENT_TYPES = ['Cash','Card','Insurance','JazzCash','EasyPaisa'];
const PAYMENT_METHODS = [
  { id:'Cash',         icon:'💵', label:'Cash' },
  { id:'Card',         icon:'💳', label:'Card' },
  { id:'Insurance',    icon:'🏥', label:'Insurance' },
  { id:'JazzCash',     icon:'📱', label:'JazzCash' },
  { id:'EasyPaisa',    icon:'📱', label:'EasyPaisa' },
  { id:'BankTransfer', icon:'🏦', label:'Bank Transfer' },
];

const OpdPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'OPD Registration', icon: '📝' },
    { label: 'Admission',        icon: '🏥' },
    { label: 'Lab Request',      icon: '🔬' },
    { label: 'Payment',          icon: '💳' },
    { label: "Today's List",     icon: '📋' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
      {/* Page Tabs */}
      <div className="mmh-page-tabs">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={`mmh-page-tab${tab === i ? ' active' : ''}`}
            onClick={() => setTab(i)}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
        {tab === 0 && <RegisterTab />}
        {tab === 1 && <AdmissionTab />}
        {tab === 2 && <LabRequestTab />}
        {tab === 3 && <PaymentTab />}
        {tab === 4 && <TodaysListTab />}
      </div>
    </div>
  );
};

// ─── TAB 1 — OPD REGISTRATION ───────────────────────────────────────
const RegisterTab: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [slip, setSlip]       = useState<any>(null);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    name:'', age:'', gender:'Male', cnic:'', phone:'',
    bloodGroup:'Unknown', address:'', doctorId:'',
  });

  useEffect(() => {
    api.get('/users').then(r => {
      setDoctors(r.data.filter((u: any) => u.role === 'doctor'));
    }).catch(() => {});
  }, []);

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender) { setError('Please fill all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const token   = Math.floor(Math.random() * 900) + 100;
      const mrNo    = 'MR-' + Date.now().toString().slice(-6);
      const doctor  = doctors.find(d => d._id === form.doctorId);
      const payload = { ...form, mrNo, token, status:'Waiting', doctorName: doctor?.name || 'Walk-in' };
      await api.post('/patients', payload);
      setSlip({ ...payload, time: new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' }) });
      setForm({ name:'', age:'', gender:'Male', cnic:'', phone:'', bloodGroup:'Unknown', address:'', doctorId:'' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animationName: 'mmh-slide-up', animationDuration: '0.3s', animationFillMode: 'both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">OPD Registration</h1>
          <p className="mmh-page-subtitle">Register a new patient and generate OPD slip</p>
        </div>
      </div>

      {error && <div className="mmh-banner-error">⚠️ {error}</div>}

      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
        <div className="mmh-card-header">
          <div className="mmh-card-title">📝 Register New Patient</div>
        </div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mmh-section-divider">
              <span className="mmh-section-text">👤 Personal Information</span>
              <div className="mmh-section-line" />
            </div>
            
            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Patient Name <span className="mmh-required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>👤</span>
                  <input className="mmh-input" style={{ paddingLeft: 40 }} placeholder="Full Name" value={form.name} onChange={s('name')} required />
                </div>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Age (Years) <span className="mmh-required">*</span></label>
                <input type="number" className="mmh-input" placeholder="Age" min={0} max={150} value={form.age} onChange={s('age')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Gender <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.gender} onChange={s('gender')}>
                  {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Blood Group</label>
                <select className="mmh-input-select" value={form.bloodGroup} onChange={s('bloodGroup')}>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <div className="mmh-section-divider">
              <span className="mmh-section-text">📞 Contact & ID Details</span>
              <div className="mmh-section-line" />
            </div>

            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📞</span>
                  <input className="mmh-input" style={{ paddingLeft: 40 }} placeholder="03XX-XXXXXXX" value={form.phone} onChange={s('phone')} />
                </div>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">CNIC (Optional)</label>
                <input className="mmh-input" placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={s('cnic')} />
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Permanent Address</label>
                <textarea className="mmh-textarea" placeholder="Enter full address" value={form.address} onChange={s('address')} />
              </div>
            </div>

            <div className="mmh-section-divider">
              <span className="mmh-section-text">👨‍⚕️ Assignment</span>
              <div className="mmh-section-line" />
            </div>

            <div className="mmh-form-grid">
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Assign Doctor for Consultation <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.doctorId} onChange={s('doctorId')} required>
                  <option value="">— Select Available Doctor —</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}{d.doctorInfo?.department ? ` — ${d.doctorInfo.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mmh-btn mmh-btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="mmh-spinner" style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'mmh-spin 0.8s linear infinite' }} /> : '🖨️ Register & Generate OPD Slip'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* OPD Slip Modal */}
      {slip && (
        <div className="mmh-overlay no-print" onClick={e => { if (e.target === e.currentTarget) setSlip(null); }}>
          <div className="mmh-modal mmh-modal-sm">
            <div className="mmh-modal-header">
              <div>
                <div className="mmh-modal-title">OPD Slip Generated ✅</div>
                <div className="mmh-modal-subtitle">Print or save for patient</div>
              </div>
              <button className="mmh-modal-close" onClick={() => setSlip(null)}>×</button>
            </div>
            <div className="mmh-modal-body">
              <div className="mmh-slip-wrap">
                <div className="mmh-slip-head">
                  <div className="mmh-slip-hospital-name">🏥 Majida Memorial Hospital</div>
                  <div className="mmh-slip-hospital-sub">OPD Registration Slip</div>
                </div>
                <div className="mmh-slip-token-box">
                  <div className="mmh-slip-token-num">{slip.token}</div>
                  <div className="mmh-slip-token-label">Queue Token</div>
                </div>
                {[
                  ['MR Number',   slip.mrNo],
                  ['Patient',     slip.name],
                  ['Age / Gender',`${slip.age} yrs / ${slip.gender}`],
                  ['Blood Group', slip.bloodGroup],
                  ['Doctor',      slip.doctorName],
                  ['Time',        slip.time],
                ].map(([k, v]) => (
                  <div className="mmh-slip-row" key={k}>
                    <span className="mmh-slip-row-label">{k}</span>
                    <span className="mmh-slip-row-value">{v}</span>
                  </div>
                ))}
                <div className="mmh-slip-footer">Please keep this slip. Present at doctor's room.</div>
              </div>
            </div>
            <div className="mmh-modal-footer">
              <button className="mmh-btn mmh-btn-ghost" onClick={() => setSlip(null)}>Close</button>
              <button className="mmh-btn mmh-btn-primary" onClick={() => window.print()}>🖨️ Print Slip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 2 — ADMISSION ──────────────────────────────────────────────
const AdmissionTab: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors,  setDoctors]  = useState<Doctor[]>([]);
  const [wards,    setWards]    = useState<Ward[]>([]);
  const [beds,     setBeds]     = useState<Bed[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [form, setForm] = useState({
    patientId:'', doctorId:'', wardId:'', bedId:'',
    history:'', symptoms:'',
    warisName:'', warisPhone:'', warisRelation:'',
    paymentType:'Cash', policyNumber:'',
  });

  useEffect(() => {
    Promise.allSettled([
      api.get('/patients'),
      api.get('/users'),
      api.get('/wards'),
    ]).then(([pr, ur, wr]) => {
      if (pr.status === 'fulfilled') setPatients(pr.value.data);
      if (ur.status === 'fulfilled') setDoctors(ur.value.data.filter((u: any) => u.role === 'doctor'));
      if (wr.status === 'fulfilled') setWards(wr.value.data);
    });
  }, []);

  const handleWardChange = async (wardId: string) => {
    setForm(f => ({ ...f, wardId, bedId:'' }));
    if (!wardId) { setBeds([]); return; }
    try {
      const r = await api.get(`/wards/${wardId}/beds`);
      setBeds(r.data.filter((b: Bed) => b.status === 'Available'));
    } catch { setBeds([]); }
  };

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/admissions', { ...form, status:'Admitted', admittedAt: new Date().toISOString() });
      setSuccess('Patient admitted successfully!');
      setForm({ patientId:'', doctorId:'', wardId:'', bedId:'', history:'', symptoms:'', warisName:'', warisPhone:'', warisRelation:'', paymentType:'Cash', policyNumber:'' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admission failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Patient Admission</h1>
          <p className="mmh-page-subtitle">Admit a patient to a ward and assign bed</p>
        </div>
      </div>
      {error   && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}
      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#10b981,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">🏥 Admission Form</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mmh-section-divider">
              <span className="mmh-section-text">🏥 Admission Details</span>
              <div className="mmh-section-line" />
            </div>

            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Select Patient <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.patientId} onChange={s('patientId')} required>
                  <option value="">— Select Registered Patient —</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name} {p.mrNo ? `(${p.mrNo})` : ''}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Admitting Doctor <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.doctorId} onChange={s('doctorId')} required>
                  <option value="">— Select Doctor —</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Assign Ward <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.wardId} onChange={e => handleWardChange(e.target.value)} required>
                  <option value="">— Select Ward —</option>
                  {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Assign Bed <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.bedId} onChange={s('bedId')} required disabled={!form.wardId}>
                  <option value="">— Select Available Bed —</option>
                  {beds.map(b => <option key={b._id} value={b._id}>{b.number}</option>)}
                </select>
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Clinical History <span className="mmh-required">*</span></label>
                <textarea className="mmh-textarea" placeholder="Enter patient's previous medical history..." value={form.history} onChange={s('history')} required />
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Presenting Complaint / Symptoms <span className="mmh-required">*</span></label>
                <textarea className="mmh-textarea" placeholder="Reason for admission and current symptoms..." value={form.symptoms} onChange={s('symptoms')} required />
              </div>

              {/* Waris info */}
              <div className="mmh-section-divider">
                <span className="mmh-section-text">👥 Next of Kin (Waris)</span>
                <div className="mmh-section-line" />
              </div>

              <div className="mmh-field">
                <label className="mmh-label">Waris Name <span className="mmh-required">*</span></label>
                <input className="mmh-input" placeholder="Guardian name" value={form.warisName} onChange={s('warisName')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Waris Phone <span className="mmh-required">*</span></label>
                <input className="mmh-input" placeholder="03XX-XXXXXXX" value={form.warisPhone} onChange={s('warisPhone')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Relation <span className="mmh-required">*</span></label>
                <input className="mmh-input" placeholder="e.g. Father, Son, Wife" value={form.warisRelation} onChange={s('warisRelation')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Payment Type <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.paymentType} onChange={s('paymentType')}>
                  {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {form.paymentType === 'Insurance' && (
                <div className="mmh-field mmh-form-full">
                  <label className="mmh-label">Policy Number</label>
                  <input className="mmh-input" placeholder="Insurance policy number" value={form.policyNumber} onChange={s('policyNumber')} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mmh-btn mmh-btn-green" type="submit" disabled={loading}>
                {loading ? '⏳ Processing...' : '🏥 Admit Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 3 — LAB REQUEST ─────────────────────────────────────────────
const ALL_TESTS = [
  'CBC','Blood Sugar','Urine R/E','LFTs','Renal Profile',
  'Lipid Profile','Thyroid Profile','Malaria MP','Typhoid Test',
  'HCV','HBsAg','HIV','Dengue NS1','Blood Group','Serum Electrolytes',
];

const LabRequestTab: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [patientId, setPatientId] = useState('');
  const [urgent, setUrgent]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error,   setError]       = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => { api.get('/patients').then(r => setPatients(r.data)).catch(()=>{}); }, []);

  const toggle = (t: string) =>
    setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Please select a patient.'); return; }
    if (selected.length === 0) { setError('Please select at least one test.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const patient = patients.find(p => p._id === patientId);
      await api.post('/labs', {
        patientId, patientName: patient?.name, tests: selected, urgent,
        status: 'Pending', createdAt: new Date().toISOString(),
      });
      setSuccess(`Lab request created for ${selected.length} test(s)!`);
      setSelected([]); setPatientId(''); setUrgent(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Lab Request</h1>
          <p className="mmh-page-subtitle">Order diagnostic tests for patients</p>
        </div>
      </div>
      {error   && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}
      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#8b5cf6,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">🔬 Request Lab Tests</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mmh-form-grid" style={{ marginBottom:18 }}>
              <div className="mmh-field">
                <label className="mmh-label">Select Patient <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mmh-field" style={{ justifyContent:'flex-end' }}>
                <label className="mmh-label">Urgent Test</label>
                <div
                  className={`mmh-checkbox-wrap${urgent ? ' checked' : ''}`}
                  onClick={() => setUrgent(u => !u)}
                >
                  <div className="mmh-checkbox">{urgent ? '✓' : ''}</div>
                  <span className="mmh-checkbox-label">Mark as URGENT 🚨</span>
                </div>
              </div>
            </div>

            {urgent && (
              <div className="mmh-urgent-bar">🚨 This test has been marked URGENT — will be prioritized in lab queue</div>
            )}

            <label className="mmh-label" style={{ display:'block', marginBottom:6 }}>
              Select Tests ({selected.length} selected) <span className="mmh-required">*</span>
            </label>
            <div className="mmh-test-grid">
              {ALL_TESTS.map(t => (
                <div
                  key={t}
                  className={`mmh-test-item${selected.includes(t) ? ' selected' : ''}`}
                  onClick={() => toggle(t)}
                >
                  <div className="mmh-test-check">{selected.includes(t) ? '✓' : ''}</div>
                  {t}
                </div>
              ))}
            </div>

            <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
              <button className="mmh-btn mmh-btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Sending...' : `🔬 Send Lab Request (${selected.length} tests)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 4 — PAYMENT ─────────────────────────────────────────────────
const PaymentTab: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [method,   setMethod]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [form, setForm] = useState({
    patientId:'', purpose:'OPD', amount:'', refNo:'', notes:''
  });

  useEffect(() => { api.get('/patients').then(r=>setPatients(r.data)).catch(()=>{}); }, []);

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) { setError('Please select a patient.'); return; }
    if (!form.amount)    { setError('Please enter an amount.'); return; }
    if (!method)         { setError('Please select a payment method.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const patient = patients.find(p => p._id === form.patientId);
      await api.post('/payments', {
        ...form,
        patientName: patient?.name,
        method, amount: Number(form.amount),
        paidAt: new Date().toISOString(),
      });
      setSuccess(`Payment of PKR ${Number(form.amount).toLocaleString()} recorded!`);
      setForm({ patientId:'', purpose:'OPD', amount:'', refNo:'', notes:'' });
      setMethod('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Collect Payment</h1>
          <p className="mmh-page-subtitle">Record patient payment transactions</p>
        </div>
      </div>
      {error   && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}
      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background:'linear-gradient(90deg,#10b981,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">💳 Payment Entry</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mmh-form-grid">
              <div className="mmh-field">
                <label className="mmh-label">Select Patient <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.patientId} onChange={s('patientId')} required>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Purpose <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.purpose} onChange={s('purpose')}>
                  {['OPD','Admission','Lab','Pharmacy','Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Amount (PKR) <span className="mmh-required">*</span></label>
                <input type="number" className="mmh-input" placeholder="0.00" min={0} value={form.amount} onChange={s('amount')} required />
              </div>
            </div>

            <label className="mmh-label" style={{ display:'block', margin:'16px 0 8px' }}>
              Payment Method <span className="mmh-required">*</span>
            </label>
            <div className="mmh-payment-grid">
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  className={`mmh-payment-card${method === pm.id ? ' selected' : ''}`}
                  onClick={() => setMethod(pm.id)}
                >
                  <span className="mmh-payment-card-icon">{pm.icon}</span>
                  {pm.label}
                </div>
              ))}
            </div>

            {method && method !== 'Cash' && (
              <div className="mmh-field" style={{ marginTop:12 }}>
                <label className="mmh-label">Reference Number</label>
                <input className="mmh-input" placeholder="Transaction / reference no." value={form.refNo} onChange={s('refNo')} />
              </div>
            )}
            <div className="mmh-field" style={{ marginTop:14 }}>
              <label className="mmh-label">Notes (optional)</label>
              <textarea className="mmh-textarea" placeholder="Additional notes..." value={form.notes} onChange={s('notes')} style={{ minHeight:70 }} />
            </div>

            <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
              <button className="mmh-btn mmh-btn-green" type="submit" disabled={loading}>
                {loading ? '⏳ Recording...' : '💳 Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 5 — TODAY'S LIST ────────────────────────────────────────────
const TodaysListTab: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/opd').then(r => {
      const today = new Date().toDateString();
      const filtered = r.data.filter((v: any) => {
        return v.createdAt && new Date(v.createdAt).toDateString() === today;
      });
      setRecords(filtered);
    }).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const waiting = records.filter(r => r.status === 'Waiting').length;
  const done    = records.filter(r => r.status === 'Done').length;

  const statusBadge = (s: string) => {
    if (s === 'Done')       return <span className="mmh-badge mmh-badge-green"><span className="mmh-badge-dot"/>Done</span>;
    if (s === 'Processing') return <span className="mmh-badge mmh-badge-sky"><span className="mmh-badge-dot"/>In Consult</span>;
    return <span className="mmh-badge mmh-badge-amber"><span className="mmh-badge-dot"/>Waiting</span>;
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Today's OPD List</h1>
          <p className="mmh-page-subtitle">{new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={() => window.location.reload()}>🔄 Refresh</button>
      </div>

      {/* Mini stats */}
      <div className="mmh-stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
        {[
          { label:'Total Today', value: records.length, accent:'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
          { label:'Waiting',     value: waiting,         accent:'linear-gradient(90deg,#f59e0b,#fbbf24)' },
          { label:'Done',        value: done,            accent:'linear-gradient(90deg,#10b981,#34d399)' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{ background: c.accent }} />
            <span className="mmh-stat-value">{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mmh-table-card">
        <div className="mmh-table-card-top" />
        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Token</th><th>MR #</th><th>Patient</th><th>Age/Gender</th>
                <th>Doctor</th><th>Status</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="mmh-empty" style={{ textAlign:'center', padding:40 }}>Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="mmh-empty">
                    <div className="mmh-empty-icon">📋</div>
                    <div className="mmh-empty-text">No OPD registrations today</div>
                    <div className="mmh-empty-sub">Patients registered today will appear here.</div>
                  </div>
                </td></tr>
              ) : records.map((r, i) => (
                <tr key={r._id}>
                  <td style={{ fontFamily:'JetBrains Mono', color:'#0ea5e9', fontWeight:800 }}>
                    {r.tokenNumber || r.token || (i + 1).toString().padStart(3,'0')}
                  </td>
                  <td style={{ fontFamily:'JetBrains Mono', fontSize:12 }}>{r.patient?.mrNumber || r.patient?.mrNo || '—'}</td>
                  <td className="mmh-td-name">{r.patient?.name || r.name}</td>
                  <td style={{ color:'#94a3b8' }}>{r.patient?.age || r.age || '—'} / {r.patient?.gender || r.gender || '—'}</td>
                  <td style={{ color:'#94a3b8' }}>{r.doctor?.name || r.doctorName || '—'}</td>
                  <td>{statusBadge(r.status || 'Waiting')}</td>
                  <td style={{ color:'#64748b', fontSize:12 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'}) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OpdPage;
