import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import PatientSearch, { PatientResult as PSPatientResult } from '../../components/PatientSearch';

// ─── Types ──────────────────────────────────────────────────────────
interface PatientResult {
  _id: string; name: string; mrNumber: string;
  age?: number; gender?: string; phone?: string; cnic?: string;
}
interface Doctor { _id: string; name: string; department?: string; doctorInfo?: { department: string } }
interface Ward { _id: string; name: string; capacity: number }
interface Bed { _id: string; wardId: string; number: string; status: string }

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const PAYMENT_TYPES = ['Cash', 'Card', 'Insurance', 'JazzCash', 'EasyPaisa'];
const PAYMENT_METHODS = [
  { id: 'Cash', icon: '💵', label: 'Cash' },
  { id: 'Card', icon: '💳', label: 'Card' },
  { id: 'Insurance', icon: '🏥', label: 'Insurance' },
  { id: 'JazzCash', icon: '📱', label: 'JazzCash' },
  { id: 'EasyPaisa', icon: '📱', label: 'EasyPaisa' },
  { id: 'BankTransfer', icon: '🏦', label: 'Bank Transfer' },
];
const RELATIONS = [
  'Father', 'Mother', 'Son', 'Daughter', 'Husband', 'Wife',
  'Brother', 'Sister', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Friend', 'Other', 'Self', 'Cousin', 'Niece', 'Nephew'
];

// ─── Phone & CNIC formatters ─────────────────────────────────────────
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 11);
  if (limited.length > 4) return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  return limited;
};

const validatePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!phone) return 'Phone number is required';
  if (digits.length !== 11) return 'Phone number must be 11 digits';
  if (!digits.startsWith('0')) return 'Phone must start with 0';
  return '';
};

const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 13);
  if (limited.length > 12) return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`;
  if (limited.length > 5) return `${limited.slice(0, 5)}-${limited.slice(5)}`;
  return limited;
};

// ─── OPD Slip print function ──────────────────────────────────────────
const SLIP_FONTS = `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap`;

const printOpdSlip = (visitData: any) => {
  const pw = window.open('', 'Print', 'width=420,height=700');
  if (!pw) return;
  pw.document.write(`<!DOCTYPE html><html><head>
    <title>OPD Slip</title>
    <link href="${SLIP_FONTS}" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:white;display:flex;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}
      .w{width:320px;background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;}
      .hd{background:#0c3b6b;color:white;padding:16px 20px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .hd-h{font-size:17px;font-weight:900;font-style:italic;}
      .hd-s{font-size:10px;opacity:.8;margin-top:3px;}
      .hd-t{font-size:9px;letter-spacing:.15em;text-transform:uppercase;opacity:.7;margin-top:4px;}
      .mr{background:#f0f6ff;padding:16px;text-align:center;border-bottom:1px dashed #cbd5e1;}
      .mr-l{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;}
      .mr-n{font-size:24px;font-weight:900;color:#0c3b6b;font-family:'JetBrains Mono',monospace;border:2px dashed #0c3b6b;display:inline-block;padding:5px 16px;border-radius:8px;background:white;letter-spacing:.05em;}
      .bd{padding:14px 18px;background:white;}
      .st{font-size:9px;font-weight:800;color:#0c3b6b;text-transform:uppercase;letter-spacing:.1em;margin:10px 0 5px;padding-bottom:3px;border-bottom:1.5px solid #dbeafe;}
      .row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dotted #f1f5f9;color:#0f172a;}
      .lbl{color:#64748b;min-width:65px;}
      .val{font-weight:700;text-align:right;}
      .ft{background:#f8fafc;padding:10px 14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;}
      @media print{body{padding:0;}}
    </style>
  </head><body><div class="w">
    <div class="hd"><div class="hd-h">🏥 Majida Memorial Hospital</div><div class="hd-s">Chiniot, Punjab</div><div class="hd-t">— OPD Registration Slip —</div></div>
    <div class="mr"><div class="mr-l">MR Number / Token</div><div class="mr-n">${visitData.mrNumber}</div></div>
    <div class="bd">
      <div class="st">Patient Information</div>
      <div class="row"><span class="lbl">Name</span><span class="val">${visitData.name}</span></div>
      <div class="row"><span class="lbl">Age/Sex</span><span class="val">${visitData.age} Yrs / ${visitData.gender}</span></div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${visitData.phone}</span></div>
      ${visitData.cnic ? `<div class="row"><span class="lbl">CNIC</span><span class="val">${visitData.cnic}</span></div>` : ''}
      <div class="st">Consultation Details</div>
      <div class="row"><span class="lbl">Doctor</span><span class="val">${visitData.doctorName}</span></div>
      ${visitData.department ? `<div class="row"><span class="lbl">Dept.</span><span class="val">${visitData.department}</span></div>` : ''}
      <div class="row"><span class="lbl">Date</span><span class="val">${visitData.date}</span></div>
      <div class="row"><span class="lbl">Time</span><span class="val">${visitData.time}</span></div>
    </div>
    <div class="ft">⚠️ Please keep this slip safe — Show at doctor's counter<br/>MMH Chiniot | Majida Memorial Hospital</div>
  </div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
  </body></html>`);
  pw.document.close();
};

// ─── Admission Slip print function ──────────────────────────────────────
const printAdmissionSlip = (ad: any) => {
  const pw = window.open('', 'Print', 'width=420,height=780');
  if (!pw) return;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  pw.document.write(`<!DOCTYPE html><html><head>
    <title>Admission Slip</title>
    <link href="${SLIP_FONTS}" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:white;display:flex;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}
      .w{width:340px;background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;}
      .hd{background:#064e3b;color:white;padding:16px 20px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .hd-h{font-size:17px;font-weight:900;font-style:italic;}
      .hd-s{font-size:10px;opacity:.8;margin-top:3px;}
      .hd-t{font-size:9px;letter-spacing:.15em;text-transform:uppercase;opacity:.7;margin-top:4px;}
      .mr{background:#f0fdf4;padding:14px;text-align:center;border-bottom:1px dashed #a7f3d0;}
      .mr-l{font-size:9px;color:#064e3b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;}
      .mr-n{font-size:22px;font-weight:900;color:#064e3b;font-family:'JetBrains Mono',monospace;border:2px dashed #064e3b;display:inline-block;padding:4px 14px;border-radius:8px;background:white;}
      .mr-d{font-size:10px;color:#064e3b;margin-top:5px;font-weight:700;}
      .bd{padding:14px 18px;background:white;}
      .st{font-size:9px;font-weight:800;color:#064e3b;text-transform:uppercase;letter-spacing:.1em;margin:10px 0 5px;padding-bottom:3px;border-bottom:1.5px solid #d1fae5;}
      .row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dotted #f1f5f9;}
      .lbl{color:#64748b;min-width:80px;}
      .val{font-weight:700;text-align:right;color:#0f172a;}
      .em{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin:10px 0;}
      .em-t{font-size:10px;font-weight:800;color:#dc2626;margin-bottom:5px;text-transform:uppercase;letter-spacing:.08em;}
      .ft{background:#f8fafc;padding:10px 14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;}
      @media print{body{padding:0;}.em{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style>
  </head><body><div class="w">
    <div class="hd"><div class="hd-h">🏥 Majida Memorial Hospital</div><div class="hd-s">Chiniot, Punjab</div><div class="hd-t">— Patient Admission Slip —</div></div>
    <div class="mr"><div class="mr-l">MR Number</div><div class="mr-n">${ad.mrNumber}</div><div class="mr-d">ADMITTED — ${dateStr}</div></div>
    <div class="bd">
      <div class="st">Patient Information</div>
      <div class="row"><span class="lbl">Name</span><span class="val">${ad.patientName}</span></div>
      <div class="row"><span class="lbl">Age/Sex</span><span class="val">${ad.age} Yrs / ${ad.gender}</span></div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${ad.phone}</span></div>
      <div class="st">Admission Details</div>
      <div class="row"><span class="lbl">Doctor</span><span class="val">${ad.doctorName}</span></div>
      ${ad.department ? `<div class="row"><span class="lbl">Dept.</span><span class="val">${ad.department}</span></div>` : ''}
      ${ad.wardName ? `<div class="row"><span class="lbl">Ward</span><span class="val">${ad.wardName}</span></div>` : ''}
      ${ad.bedNumber ? `<div class="row"><span class="lbl">Bed</span><span class="val">${ad.bedNumber}</span></div>` : ''}
      <div class="row"><span class="lbl">Date</span><span class="val">${dateStr}</span></div>
      <div class="row"><span class="lbl">Time</span><span class="val">${timeStr}</span></div>
      ${ad.symptoms ? `<div class="st">Presenting Complaint</div><div style="font-size:11px;color:#0f172a;padding:5px 0;line-height:1.5;">${ad.symptoms}</div>` : ''}
      <div class="em"><div class="em-t">🚨 Emergency Contact (Waris)</div>
        <div class="row"><span class="lbl">Name</span><span class="val">${ad.warisName}</span></div>
        <div class="row"><span class="lbl">Phone</span><span class="val">${ad.warisPhone}</span></div>
        <div class="row"><span class="lbl">Relation</span><span class="val">${ad.warisRelation}</span></div>
      </div>
    </div>
    <div class="ft">Please show this slip to ward staff<br/>MMH Chiniot | Majida Memorial Hospital<br/>Keep this slip safe during stay</div>
  </div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
  </body></html>`);
  pw.document.close();
};

// ─── Patient Search Hook ─────────────────────────────────────────────
const usePatientSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [selected, setSelected] = useState<PatientResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = (q: string) => {
    setQuery(q);
    setSelected(null);
    clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/patients/search?q=${encodeURIComponent(q)}`);
        const data = r.data?.data ?? r.data ?? [];
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  const select = (p: PatientResult) => {
    setSelected(p);
    setQuery('');
    setResults([]);
  };

  const clear = () => { setSelected(null); setQuery(''); setResults([]); };

  return { query, results, selected, loading, search, select, clear };
};

// ─── Patient Search UI (reusable) ────────────────────────────────────
interface PatientSearchProps {
  label?: string;
  placeholder?: string;
  onSelect: (p: PatientResult) => void;
  selectedPatient: PatientResult | null;
  onClear: () => void;
}
const PatientSearchField: React.FC<PatientSearchProps> = ({
  label = 'Select Patient',
  placeholder = 'Search by name or MR number e.g. MMH-2026-00157',
  onSelect, selectedPatient, onClear,
}) => {
  const { query, results, loading, search, select, clear } = usePatientSearch();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        if (!selectedPatient) clear();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  });

  const handleSelect = (p: PatientResult) => {
    select(p);
    onSelect(p);
  };

  const handleClear = () => { clear(); onClear(); };

  return (
    <div className="mmh-field">
      <label className="mmh-label">{label} <span className="mmh-required">*</span></label>

      {!selectedPatient ? (
        <div className="mmh-patient-search-wrap" ref={wrapRef}>
          <input
            className="mmh-input"
            placeholder={placeholder}
            value={query}
            onChange={e => search(e.target.value)}
            autoComplete="off"
          />
          {(results.length > 0 || loading) && (
            <div className="mmh-search-dropdown">
              {loading
                ? <div style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>Searching…</div>
                : results.map(p => (
                  <div key={p._id} className="mmh-search-result-item" onClick={() => handleSelect(p)}>
                    <span className="mmh-search-result-mr">{p.mrNumber}</span>
                    <span className="mmh-search-result-name">{p.name}</span>
                    <span className="mmh-search-result-meta">{p.age}y | {p.gender}</span>
                  </div>
                ))
              }
            </div>
          )}
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
            </div>
          </div>
          <button className="mmh-selected-patient-clear" type="button" onClick={handleClear} title="Change patient">×</button>
        </div>
      )}
    </div>
  );
};


// ─── Main Page (tab shell) ────────────────────────────────────────────
const OpdPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'OPD Registration', icon: '📝' },
    { label: 'Admission', icon: '🏥' },
    { label: 'Lab Request', icon: '🔬' },
    { label: 'Payment', icon: '💳' },
    { label: "Today's List", icon: '📋' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
      <div className="mmh-page-tabs">
        {tabs.map((t, i) => (
          <button key={i} className={`mmh-page-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
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


// ─── TAB 1 — OPD REGISTRATION ────────────────────────────────────────
const RegisterTab: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [slip, setSlip] = useState<any>(null);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', cnic: '', phone: '',
    bloodGroup: 'Unknown', address: '', doctorId: '',
  });

  useEffect(() => {
    api.get('/users').then(r => {
      setDoctors(r.data.filter((u: any) => u.role === 'doctor'));
    }).catch(() => { });
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setForm(f => ({ ...f, phone: formatted }));
    setPhoneError(validatePhone(formatted));
  };

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, cnic: formatCNIC(e.target.value) }));
  };

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name || !form.age || !form.gender) { setError('Patient name, age and gender are required.'); return; }
    if (!form.doctorId) { setError('Please assign a doctor.'); return; }

    const phoneErr = validatePhone(form.phone);
    if (phoneErr) { setPhoneError(phoneErr); setError(phoneErr); return; }

    setLoading(true); setError(''); setPhoneError('');

    try {
      const res = await api.post('/patients', {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone,
        cnic: form.cnic || undefined,
        bloodGroup: form.bloodGroup,
        address: form.address || undefined,
        doctorId: form.doctorId,
        status: 'Waiting',
      });

      const patient = res.data?.data ?? res.data;
      const mrNumber = patient?.mrNumber;
      const doctor = doctors.find(d => d._id === form.doctorId);
      const now = new Date();

      setSlip({
        mrNumber,
        name: form.name,
        age: form.age,
        gender: form.gender,
        phone: form.phone,
        cnic: form.cnic,
        doctorName: doctor?.name || 'Walk-in',
        department: doctor?.department || doctor?.doctorInfo?.department || '',
        date: now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      });

      setForm({ name: '', age: '', gender: 'Male', cnic: '', phone: '', bloodGroup: 'Unknown', address: '', doctorId: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
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
            {/* Personal Info */}
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
                  {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Blood Group</label>
                <select className="mmh-input-select" value={form.bloodGroup} onChange={s('bloodGroup')}>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div className="mmh-section-divider">
              <span className="mmh-section-text">📞 Contact & ID Details</span>
              <div className="mmh-section-line" />
            </div>
            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Phone Number <span className="mmh-required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📞</span>
                  <input
                    className="mmh-input"
                    style={{ paddingLeft: 40, borderColor: phoneError ? '#f43f5e' : undefined }}
                    placeholder="0312-4422004"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
                {phoneError
                  ? <span className="mmh-field-error">⚠️ {phoneError}</span>
                  : <span className="mmh-input-hint">Format: 0312-4422004 (11 digits)</span>
                }
              </div>
              <div className="mmh-field">
                <label className="mmh-label">CNIC <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <input
                  className="mmh-input"
                  placeholder="42101-1234567-1"
                  value={form.cnic}
                  onChange={handleCNICChange}
                />
                <span className="mmh-input-hint">Auto-formats as you type</span>
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Permanent Address</label>
                <textarea className="mmh-textarea" placeholder="Enter full address" value={form.address} onChange={s('address')} />
              </div>
            </div>

            {/* Doctor */}
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
                      {d.name}{d.department ? ` — ${d.department}` : d.doctorInfo?.department ? ` — ${d.doctorInfo.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mmh-btn mmh-btn-primary" type="submit" disabled={loading}>
                {loading
                  ? <span className="mmh-spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'mmh-spin 0.8s linear infinite' }} />
                  : '🖨️ Register & Generate OPD Slip'}
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
            <div className="mmh-modal-body" style={{ overflowY: 'auto' }}>
              {/* Slip — this div is captured for printing */}
              <div id="opd-slip-print">
                <div className="mmh-opd-slip-header">
                  <div className="mmh-opd-slip-hospital">🏥 Majida Memorial Hospital</div>
                  <div className="mmh-opd-slip-city">Chiniot, Punjab</div>
                  <div className="mmh-opd-slip-divider-text">── OPD Registration Slip ──</div>
                </div>
                <div className="mmh-opd-slip-mr-box">
                  <div className="mmh-opd-slip-mr-label">MR Number / Token</div>
                  <div className="mmh-opd-slip-mr-number">{slip.mrNumber || '—'}</div>
                </div>
                <div className="mmh-opd-slip-body">
                  <div className="mmh-opd-slip-section">
                    {[
                      ['Patient', slip.name],
                      ['Age/Sex', `${slip.age} Years / ${slip.gender}`],
                      ['Phone', slip.phone],
                      ...(slip.cnic ? [['CNIC', slip.cnic]] as [string, string][] : []),
                    ].map(([k, v]) => (
                      <div className="mmh-opd-slip-row" key={k}>
                        <span className="mmh-opd-slip-label">{k}</span>
                        <span className="mmh-opd-slip-value">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mmh-opd-slip-section">
                    {[
                      ['Doctor', slip.doctorName],
                      ...(slip.department ? [['Dept.', slip.department]] as [string, string][] : []),
                      ['Date', slip.date],
                      ['Time', slip.time],
                    ].map(([k, v]) => (
                      <div className="mmh-opd-slip-row" key={k}>
                        <span className="mmh-opd-slip-label">{k}</span>
                        <span className="mmh-opd-slip-value">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mmh-opd-slip-footer">
                  ⚠️ Please keep this slip safe — Show at doctor's counter<br />
                  MMH Chiniot | Majida Memorial Hospital
                </div>
              </div>
              {/* Wrap above content in the outer slip div for modal display */}
            </div>
            <div className="mmh-modal-footer">
              <button className="mmh-btn mmh-btn-ghost" onClick={() => setSlip(null)}>Close</button>
              <button className="mmh-btn mmh-btn-primary" onClick={() => printOpdSlip(slip)}>🖨️ Print Slip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── TAB 2 — ADMISSION ────────────────────────────────────────────────
const AdmissionTab: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admissionSlip, setAdmissionSlip] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [form, setForm] = useState({
    doctorId: '', wardId: '', bedId: '',
    history: '', symptoms: '',
    warisName: '', warisPhone: '', warisRelation: '',
    paymentType: 'Cash', policyNumber: '',
  });

  useEffect(() => {
    Promise.allSettled([
      api.get('/users'),
      api.get('/wards'),
    ]).then(([ur, wr]) => {
      if (ur.status === 'fulfilled') setDoctors(ur.value.data.filter((u: any) => u.role === 'doctor'));
      if (wr.status === 'fulfilled') setWards(wr.value.data);
    });
  }, []);

  const handleWardChange = async (wardId: string) => {
    setForm(f => ({ ...f, wardId, bedId: '' }));
    if (!wardId) { setBeds([]); return; }
    try {
      const r = await api.get(`/wards/${wardId}/beds`);
      setBeds(r.data.filter((b: Bed) => b.status === 'Available'));
    } catch { setBeds([]); }
  };

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setError('Please search and select a patient.'); return; }
    if (!form.doctorId) { setError('Please select an admitting doctor.'); return; }
    if (!form.warisName.trim()) { setError('Waris (Guardian) Name is required.'); return; }
    if (!form.warisPhone.trim()) { setError('Waris (Guardian) Phone is required.'); return; }
    if (!form.warisRelation.trim()) { setError('Please select the relation with patient.'); return; }

    setLoading(true); setError('');
    try {
      const doctor = doctors.find(d => d._id === form.doctorId);
      const ward = wards.find(w => w._id === form.wardId);
      const bed = beds.find(b => b._id === form.bedId);

      await api.post('/admissions', {
        patient: selectedPatient._id,
        doctor: form.doctorId,
        ward: form.wardId || undefined,
        bed: form.bedId || undefined,
        history: form.history || undefined,
        symptoms: form.symptoms || undefined,
        warisName: form.warisName,
        warisPhone: form.warisPhone,
        warisRelation: form.warisRelation,
        paymentType: form.paymentType,
        policyNumber: form.policyNumber || undefined,
      });

      // Build admission slip data
      setAdmissionSlip({
        mrNumber: selectedPatient.mrNumber,
        patientName: selectedPatient.name,
        age: selectedPatient.age || '—',
        gender: selectedPatient.gender || '—',
        phone: selectedPatient.phone || '—',
        doctorName: doctor?.name || '—',
        department: doctor?.department || doctor?.doctorInfo?.department || '',
        wardName: ward?.name || '',
        bedNumber: (bed as any)?.bedNumber || bed?.number || '',
        symptoms: form.symptoms,
        warisName: form.warisName,
        warisPhone: form.warisPhone,
        warisRelation: form.warisRelation,
      });

      setSelectedPatient(null);
      setForm({ doctorId: '', wardId: '', bedId: '', history: '', symptoms: '', warisName: '', warisPhone: '', warisRelation: '', paymentType: 'Cash', policyNumber: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admission failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Patient Admission</h1>
          <p className="mmh-page-subtitle">Waris (Guardian) details are required for all admissions</p>
        </div>
      </div>
      {error && <div className="mmh-banner-error">⚠️ {error}</div>}

      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#10b981,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">🏥 Admission Form</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>

            {/* Patient Selection */}
            <div className="mmh-section-divider">
              <span className="mmh-section-text">🔍 Patient Selection</span>
              <div className="mmh-section-line" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <PatientSearchField
                label="Select Patient"
                placeholder="Search by name or MR number e.g. MMH-2026-00157"
                selectedPatient={selectedPatient}
                onSelect={setSelectedPatient}
                onClear={() => setSelectedPatient(null)}
              />
            </div>

            {/* Admission Details */}
            <div className="mmh-section-divider">
              <span className="mmh-section-text">🏥 Admission Details</span>
              <div className="mmh-section-line" />
            </div>
            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Admitting Doctor <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.doctorId} onChange={s('doctorId')} required>
                  <option value="">— Select Doctor —</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Ward <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <select className="mmh-input-select" value={form.wardId} onChange={e => handleWardChange(e.target.value)}>
                  <option value="">— Select Ward (Optional) —</option>
                  {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Bed <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <select className="mmh-input-select" value={form.bedId} onChange={s('bedId')} disabled={!form.wardId}>
                  <option value="">— Select Available Bed —</option>
                  {beds.map(b => <option key={b._id} value={b._id}>{(b as any).bedNumber || b.number}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Payment Type <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <select className="mmh-input-select" value={form.paymentType} onChange={s('paymentType')}>
                  {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Presenting Complaint / Symptoms <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <textarea className="mmh-textarea" placeholder="Reason for admission…" value={form.symptoms} onChange={s('symptoms')} />
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Clinical History <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span></label>
                <textarea className="mmh-textarea" placeholder="Previous medical history…" value={form.history} onChange={s('history')} />
              </div>
            </div>

            {/* Waris — ALL REQUIRED */}
            <div className="mmh-section-divider">
              <span className="mmh-section-text">🚨 Waris / Guardian Details <span style={{ color: '#fb7185', fontWeight: 700 }}>*Required</span></span>
              <div className="mmh-section-line" />
            </div>
            <div className="mmh-form-grid" style={{ marginBottom: 20 }}>
              <div className="mmh-field">
                <label className="mmh-label">Waris Name <span className="mmh-required">*</span></label>
                <input className="mmh-input" placeholder="Guardian full name" value={form.warisName} onChange={s('warisName')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Waris Phone <span className="mmh-required">*</span></label>
                <input className="mmh-input" placeholder="03XX-XXXXXXX" value={form.warisPhone} onChange={s('warisPhone')} required />
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Relation with Patient <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.warisRelation} onChange={s('warisRelation')} required>
                  <option value="">— Select Relation —</option>
                  {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.paymentType === 'Insurance' && (
                <div className="mmh-field">
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

      {/* Admission Slip Modal */}
      {admissionSlip && (
        <div className="mmh-overlay" onClick={e => { if (e.target === e.currentTarget) setAdmissionSlip(null); }}>
          <div className="mmh-modal mmh-modal-sm">
            <div className="mmh-modal-header">
              <div>
                <div className="mmh-modal-title">Patient Admitted ✅</div>
                <div className="mmh-modal-subtitle">Print or save the admission slip</div>
              </div>
              <button className="mmh-modal-close" onClick={() => setAdmissionSlip(null)}>×</button>
            </div>
            <div className="mmh-modal-body" style={{ background: 'white', padding: 20 }}>
              {/* Preview slip */}
              <div style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', maxWidth: 340, margin: '0 auto' }}>
                <div style={{ background: '#064e3b', color: 'white', padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>🏥 Majida Memorial Hospital</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Chiniot, Punjab</div>
                  <div style={{ fontSize: 9, opacity: 0.7, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.15em' }}>— Patient Admission Slip —</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, textAlign: 'center', borderBottom: '1px dashed #a7f3d0' }}>
                  <div style={{ fontSize: 9, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>MR Number</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', fontFamily: 'JetBrains Mono, monospace', border: '2px dashed #064e3b', display: 'inline-block', padding: '4px 14px', borderRadius: 8 }}>{admissionSlip.mrNumber}</div>
                  <div style={{ fontSize: 10, color: '#064e3b', marginTop: 5, fontWeight: 700 }}>ADMITTED — {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ padding: '14px 18px', background: 'white' }}>
                  {[['Patient', admissionSlip.patientName], ['Age/Sex', `${admissionSlip.age} / ${admissionSlip.gender}`], ['Phone', admissionSlip.phone], ['Doctor', admissionSlip.doctorName]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px dotted #f1f5f9', color: '#0f172a' }}>
                      <span style={{ color: '#64748b', minWidth: 80 }}>{l}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', marginBottom: 5, textTransform: 'uppercase' }}>🚨 Emergency Contact</div>
                    {[['Name', admissionSlip.warisName], ['Phone', admissionSlip.warisPhone], ['Relation', admissionSlip.warisRelation]].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', color: '#0f172a' }}>
                        <span style={{ color: '#64748b', minWidth: 65 }}>{l}</span>
                        <span style={{ fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', textAlign: 'center', fontSize: 9, color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
                  Please show to ward staff — MMH Chiniot
                </div>
              </div>
            </div>
            <div className="mmh-modal-footer">
              <button className="mmh-btn mmh-btn-ghost" onClick={() => setAdmissionSlip(null)}>Close</button>
              <button className="mmh-btn mmh-btn-green" onClick={() => printAdmissionSlip(admissionSlip)}>🖨️ Print Slip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// ─── LAB SLIP PRINT FUNCTION ──────────────────────────────────────────
const SLIP_FONTS_LAB = `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap`;

const printLabSlip = (labData: any) => {
  const pw = window.open('', 'Print', 'width=420,height=700');
  if (!pw) return;

  const testsHTML = (labData.tests || []).map((test: any) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:12px;">
      <span style="color:#0f172a;font-weight:600;">${test.name}</span>
      <span style="color:#312e81;font-weight:700;font-family:'JetBrains Mono',monospace;">PKR ${test.price}</span>
    </div>
  `).join('');

  pw.document.write(`<!DOCTYPE html><html><head>
    <title>Lab Request Slip</title>
    <link href="${SLIP_FONTS_LAB}" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:white;display:flex;justify-content:center;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}
      .w{width:340px;background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;}
      .hd{background:#312e81;color:white;padding:16px 20px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .hd-h{font-size:17px;font-weight:900;font-style:italic;}
      .hd-s{font-size:10px;opacity:.8;margin-top:3px;}
      .hd-t{font-size:9px;text-transform:uppercase;letter-spacing:.15em;opacity:.7;margin-top:4px;}
      .lid{background:#eef2ff;padding:13px;text-align:center;border-bottom:1px dashed #c7d2fe;}
      .lid-l{font-size:9px;color:#312e81;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;}
      .lid-n{font-size:18px;font-weight:900;color:#312e81;font-family:'JetBrains Mono',monospace;border:2px dashed #312e81;display:inline-block;padding:4px 14px;border-radius:8px;background:white;}
      .urg{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:5px 12px;margin-top:8px;font-size:11px;font-weight:800;color:#dc2626;display:inline-block;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .bd{padding:14px 18px;background:white;}
      .st{font-size:9px;font-weight:800;color:#312e81;text-transform:uppercase;letter-spacing:.1em;margin:10px 0 6px;padding-bottom:3px;border-bottom:1.5px solid #e0e7ff;}
      .row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dotted #f1f5f9;}
      .lbl{color:#64748b;min-width:70px;}
      .val{font-weight:700;}
      .tot{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#eef2ff;border:2px solid #312e81;border-radius:10px;margin-top:12px;}
      .ft{background:#f8fafc;padding:10px 14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;}
      @media print{body{padding:0;}.urg,.hd,.tot{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style>
  </head><body><div class="w">
    <div class="hd"><div class="hd-h">🏥 Majida Memorial Hospital</div><div class="hd-s">Chiniot, Punjab</div><div class="hd-t">— Laboratory Request Slip —</div></div>
    <div class="lid">
      <div class="lid-l">Lab Request ID</div>
      <div class="lid-n">${labData.labId}</div>
      ${labData.isUrgent ? '<div class="urg">🚨 URGENT — Priority Processing</div>' : ''}
    </div>
    <div class="bd">
      <div class="st">Patient Information</div>
      <div class="row"><span class="lbl">Name</span><span class="val">${labData.patientName}</span></div>
      <div class="row"><span class="lbl">MR Number</span><span class="val" style="font-family:'JetBrains Mono',monospace;color:#312e81;">${labData.mrNumber}</span></div>
      <div class="row"><span class="lbl">Date/Time</span><span class="val">${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="st">Tests Requested</div>
      ${testsHTML}
      <div class="tot">
        <span style="font-size:13px;font-weight:700;color:#312e81;">TOTAL AMOUNT</span>
        <span style="font-size:20px;font-weight:900;color:#312e81;font-family:'JetBrains Mono',monospace;">PKR ${labData.totalAmount.toLocaleString()}</span>
      </div>
    </div>
    <div class="ft">Please bring this slip to the lab counter<br/>MMH Laboratory | Majida Memorial Hospital Chiniot</div>
  </div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
  </body></html>`);
  pw.document.close();
};

// ─── TAB 3 — LAB REQUEST ─────────────────────────────────────────────
const LAB_TESTS = [
  { id: 'cbc',         name: 'CBC',               price: 350  },
  { id: 'blood_sugar', name: 'Blood Sugar',        price: 200  },
  { id: 'urine_re',    name: 'Urine R/E',          price: 250  },
  { id: 'lfts',        name: 'LFTs',               price: 800  },
  { id: 'renal',       name: 'Renal Profile',      price: 900  },
  { id: 'lipid',       name: 'Lipid Profile',      price: 1200 },
  { id: 'thyroid',     name: 'Thyroid Profile',    price: 1500 },
  { id: 'malaria',     name: 'Malaria MP',         price: 400  },
  { id: 'typhoid',     name: 'Typhoid Test',       price: 500  },
  { id: 'hcv',         name: 'HCV',                price: 1000 },
  { id: 'hbsag',       name: 'HBsAg',              price: 800  },
  { id: 'hiv',         name: 'HIV',                price: 1000 },
  { id: 'dengue',      name: 'Dengue NS1',         price: 1500 },
  { id: 'blood_group', name: 'Blood Group',        price: 300  },
  { id: 'serum_elec',  name: 'Serum Electrolytes', price: 1100 },
  { id: 'calcium',     name: 'Calcium',            price: 600  },
  { id: 'crp',         name: 'CRP',                price: 700  },
  { id: 'esr',         name: 'ESR',                price: 250  },
  { id: 'xray',        name: 'X-Ray Chest',        price: 800  },
  { id: 'ecg',         name: 'ECG',                price: 500  },
];

type LabTest = typeof LAB_TESTS[number];

const LabRequestTab: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<PSPatientResult | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labSlip, setLabSlip] = useState<any>(null);

  const toggleTest = (test: LabTest) => {
    setSelectedTests(prev =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const totalAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setError('Please search and select a patient.'); return; }
    if (selectedTests.length === 0) { setError('Please select at least one test.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/labs', {
        patient: selectedPatient._id,
        tests: selectedTests.map(t => t.name),
        testDetails: selectedTests.map(t => ({ name: t.name, price: t.price })),
        isUrgent: urgent,
      });
      const created = res.data?.data ?? res.data;
      setLabSlip({
        labId: created?.labId || `LAB-${Date.now()}`,
        patientName: selectedPatient.name,
        mrNumber: selectedPatient.mrNumber,
        tests: selectedTests,
        totalAmount,
        isUrgent: urgent,
      });
      setSelectedTests([]);
      setSelectedPatient(null);
      setUrgent(false);
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
      {error && <div className="mmh-banner-error">⚠️ {error}</div>}

      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#8b5cf6,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">🔬 Request Lab Tests</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            {/* Patient Search */}
            <div style={{ marginBottom: 20 }}>
              <PatientSearch
                label="Select Patient"
                placeholder="Search by name or MR number e.g. MMH-2026-00157"
                selectedPatient={selectedPatient}
                onSelect={setSelectedPatient}
                onClear={() => setSelectedPatient(null)}
              />
            </div>

            {/* Urgent toggle */}
            <div style={{ marginBottom: 18 }}>
              <div
                className={`mmh-checkbox-wrap${urgent ? ' checked' : ''}`}
                onClick={() => setUrgent(u => !u)}
                style={{ width: 'fit-content' }}
              >
                <div className="mmh-checkbox">{urgent ? '✓' : ''}</div>
                <span className="mmh-checkbox-label">Mark as URGENT 🚨</span>
              </div>
            </div>
            {urgent && <div className="mmh-urgent-bar">🚨 This request has been marked URGENT — will be prioritized in lab queue</div>}

            {/* Test Selection */}
            <div className="mmh-section-divider" style={{ margin: '16px 0 12px' }}>
              <span className="mmh-section-text">🔬 Select Tests ({selectedTests.length} selected)</span>
              <div className="mmh-section-line" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
              {LAB_TESTS.map(test => {
                const isSelected = selectedTests.some(t => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    className={`mmh-test-card${isSelected ? ' selected' : ''}`}
                    onClick={() => toggleTest(test)}
                  >
                    <div className="mmh-test-card-top">
                      <div className="mmh-test-card-check">{isSelected ? '✓' : ''}</div>
                      <div className="mmh-test-card-name">{test.name}</div>
                    </div>
                    <div className="mmh-test-card-price">PKR {test.price.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            {selectedTests.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12, marginBottom: 16,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                  {selectedTests.length} test(s) selected
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                  PKR {totalAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="mmh-btn mmh-btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Sending...' : `🔬 Send Lab Request (${selectedTests.length} tests)`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lab Slip Modal */}
      {labSlip && (
        <div className="mmh-overlay" onClick={e => { if (e.target === e.currentTarget) setLabSlip(null); }}>
          <div className="mmh-modal mmh-modal-sm">
            <div className="mmh-modal-header">
              <div>
                <div className="mmh-modal-title">Lab Request Created ✅</div>
                <div className="mmh-modal-subtitle">Print or save for patient</div>
              </div>
              <button className="mmh-modal-close" onClick={() => setLabSlip(null)}>×</button>
            </div>
            <div className="mmh-modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Preview */}
              <div style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', maxWidth: 340, margin: '0 auto' }}>
                <div style={{ background: '#312e81', color: 'white', padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>🏥 Majida Memorial Hospital</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Chiniot, Punjab</div>
                  <div style={{ fontSize: 9, opacity: 0.7, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.15em' }}>— Laboratory Request Slip —</div>
                </div>
                <div style={{ background: '#eef2ff', padding: 13, textAlign: 'center', borderBottom: '1px dashed #c7d2fe' }}>
                  <div style={{ fontSize: 9, color: '#312e81', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Lab Request ID</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#312e81', fontFamily: 'JetBrains Mono, monospace', border: '2px dashed #312e81', display: 'inline-block', padding: '4px 14px', borderRadius: 8, background: 'white' }}>{labSlip.labId}</div>
                  {labSlip.isUrgent && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 12px', marginTop: 8, fontSize: 11, fontWeight: 800, color: '#dc2626', display: 'inline-block' }}>🚨 URGENT</div>}
                </div>
                <div style={{ padding: '12px 16px', background: 'white' }}>
                  {[['Patient', labSlip.patientName], ['MR Number', labSlip.mrNumber]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px dotted #f1f5f9', color: '#0f172a' }}>
                      <span style={{ color: '#64748b', minWidth: 70 }}>{l}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#312e81', textTransform: 'uppercase', margin: '10px 0 6px', paddingBottom: 3, borderBottom: '1.5px solid #e0e7ff' }}>Tests Requested</div>
                  {labSlip.tests.map((t: LabTest) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 12 }}>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{t.name}</span>
                      <span style={{ color: '#312e81', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>PKR {t.price}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#eef2ff', border: '2px solid #312e81', borderRadius: 10, marginTop: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#312e81' }}>TOTAL</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#312e81', fontFamily: 'JetBrains Mono, monospace' }}>PKR {labSlip.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mmh-modal-footer">
              <button className="mmh-btn mmh-btn-ghost" onClick={() => setLabSlip(null)}>Close</button>
              <button className="mmh-btn mmh-btn-primary" onClick={() => printLabSlip(labSlip)}>🖨️ Print Slip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── TAB 4 — PAYMENT ─────────────────────────────────────────────────
const PaymentTab: React.FC = () => {
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    patientId: '', purpose: 'OPD', amount: '', refNo: '', notes: ''
  });

  useEffect(() => { api.get('/patients').then(r => setPatients(r.data)).catch(() => { }); }, []);

  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) { setError('Please select a patient.'); return; }
    if (!form.amount) { setError('Please enter an amount.'); return; }
    if (!method) { setError('Please select a payment method.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const patient = patients.find(p => p._id === form.patientId);
      await api.post('/payments', {
        ...form, patientName: patient?.name,
        method, amount: Number(form.amount), paidAt: new Date().toISOString(),
      });
      setSuccess(`Payment of PKR ${Number(form.amount).toLocaleString()} recorded!`);
      setForm({ patientId: '', purpose: 'OPD', amount: '', refNo: '', notes: '' });
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
      {error && <div className="mmh-banner-error">⚠️ {error}</div>}
      {success && <div className="mmh-banner-success">✅ {success}</div>}
      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg,#10b981,#0ea5e9)' }} />
        <div className="mmh-card-header"><div className="mmh-card-title">💳 Payment Entry</div></div>
        <div className="mmh-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mmh-form-grid">
              <div className="mmh-field">
                <label className="mmh-label">Select Patient <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.patientId} onChange={s('patientId')} required>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.mrNumber} — {p.name}</option>)}
                </select>
              </div>
              <div className="mmh-field">
                <label className="mmh-label">Purpose <span className="mmh-required">*</span></label>
                <select className="mmh-input-select" value={form.purpose} onChange={s('purpose')}>
                  {['OPD', 'Admission', 'Lab', 'Pharmacy', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mmh-field mmh-form-full">
                <label className="mmh-label">Amount (PKR) <span className="mmh-required">*</span></label>
                <input type="number" className="mmh-input" placeholder="0.00" min={0} value={form.amount} onChange={s('amount')} required />
              </div>
            </div>
            <label className="mmh-label" style={{ display: 'block', margin: '16px 0 8px' }}>
              Payment Method <span className="mmh-required">*</span>
            </label>
            <div className="mmh-payment-grid">
              {PAYMENT_METHODS.map(pm => (
                <div key={pm.id} className={`mmh-payment-card${method === pm.id ? ' selected' : ''}`} onClick={() => setMethod(pm.id)}>
                  <span className="mmh-payment-card-icon">{pm.icon}</span>
                  {pm.label}
                </div>
              ))}
            </div>
            {method && method !== 'Cash' && (
              <div className="mmh-field" style={{ marginTop: 12 }}>
                <label className="mmh-label">Reference Number</label>
                <input className="mmh-input" placeholder="Transaction / reference no." value={form.refNo} onChange={s('refNo')} />
              </div>
            )}
            <div className="mmh-field" style={{ marginTop: 14 }}>
              <label className="mmh-label">Notes (optional)</label>
              <textarea className="mmh-textarea" placeholder="Additional notes..." value={form.notes} onChange={s('notes')} style={{ minHeight: 70 }} />
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
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
      const filtered = r.data.filter((v: any) => v.createdAt && new Date(v.createdAt).toDateString() === today);
      setRecords(filtered);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const waiting = records.filter(r => r.status === 'Waiting').length;
  const done = records.filter(r => r.status === 'Done').length;

  const statusBadge = (s: string) => {
    if (s === 'Done') return <span className="mmh-badge mmh-badge-green"><span className="mmh-badge-dot" />Done</span>;
    if (s === 'Processing') return <span className="mmh-badge mmh-badge-sky"><span className="mmh-badge-dot" />In Consult</span>;
    return <span className="mmh-badge mmh-badge-amber"><span className="mmh-badge-dot" />Waiting</span>;
  };

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s both' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Today's OPD List</h1>
          <p className="mmh-page-subtitle">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={() => window.location.reload()}>🔄 Refresh</button>
      </div>
      <div className="mmh-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Today', value: records.length, accent: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
          { label: 'Waiting', value: waiting, accent: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
          { label: 'Done', value: done, accent: 'linear-gradient(90deg,#10b981,#34d399)' },
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
                <tr><td colSpan={7} className="mmh-empty" style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
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
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#0ea5e9', fontWeight: 800 }}>
                    {r.tokenNumber || r.token || (i + 1).toString().padStart(3, '0')}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{r.patient?.mrNumber || r.patient?.mrNo || '—'}</td>
                  <td className="mmh-td-name">{r.patient?.name || r.name}</td>
                  <td style={{ color: '#94a3b8' }}>{r.patient?.age || r.age || '—'} / {r.patient?.gender || r.gender || '—'}</td>
                  <td style={{ color: '#94a3b8' }}>{r.doctor?.name || r.doctorName || '—'}</td>
                  <td>{statusBadge(r.status || 'Waiting')}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
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
