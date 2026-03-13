import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface DoctorInfo {
  department: string;
  fee: number;
  timing: string;
  days: string[];
  roomNo: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  doctorInfo?: DoctorInfo;
}

type FormData = {
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
  doctorInfo: DoctorInfo;
};

const ROLE_BADGES: Record<string, string> = {
  admin:        'mmh-badge-rose',
  doctor:       'mmh-badge-green',
  receptionist: 'mmh-badge-sky',
  lab:          'mmh-badge-violet',
  pharmacist:   'mmh-badge-cyan',
  manager:      'mmh-badge-amber',
  patient:      'mmh-badge-gray',
};

const ROLE_FILTERS = [
  { id: 'all',          label: 'All Users'  },
  { id: 'admin',        label: 'Admins'     },
  { id: 'doctor',       label: 'Doctors'    },
  { id: 'receptionist', label: 'Reception'  },
  { id: 'lab',          label: 'Laboratory' },
  { id: 'pharmacist',   label: 'Pharmacy'   },
  { id: 'patient',      label: 'Patients'   },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyForm = (): FormData => ({
  name: '',
  email: '',
  password: '',
  role: 'receptionist',
  active: true,
  doctorInfo: { department: '', fee: 0, timing: '', days: [], roomNo: '' },
});

const ManageUsers: React.FC = () => {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData]     = useState<FormData>(emptyForm());
  const [showPass, setShowPass]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const pass =
      Math.random().toString(36).slice(-6).toUpperCase() +
      'MMH' +
      Math.floor(Math.random() * 100);
    setFormData(f => ({ ...f, password: pass }));
  };

  const toggleDay = (day: string) => {
    setFormData(f => {
      const days = f.doctorInfo.days.includes(day)
        ? f.doctorInfo.days.filter(d => d !== day)
        : [...f.doctorInfo.days, day];
      return { ...f, doctorInfo: { ...f.doctorInfo, days } };
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData(emptyForm());
    setSaveError('');
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      active: u.active,
      doctorInfo: u.doctorInfo || { department: '', fee: 0, timing: '', days: [], roomNo: '' },
    });
    setSaveError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
      } else {
        await api.post('/users/register', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Error saving user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: User) => {
    try {
      await api.put(`/users/${u._id}`, { active: !u.active });
      fetchUsers();
    } catch {
      alert('Error updating status');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const countOf = (role: string) =>
    role === 'all' ? users.length : users.filter(u => u.role === role).length;

  return (
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      {/* Page header */}
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">User Directory</h1>
          <p className="mmh-page-subtitle">Manage system access, roles and staff profiles</p>
        </div>
        <button className="mmh-btn mmh-btn-primary" onClick={openCreate}>
          ＋ Register New Member
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="mmh-role-tabs">
        {ROLE_FILTERS.map(r => (
          <button
            key={r.id}
            className={`mmh-role-tab${roleFilter === r.id ? ' active' : ''}`}
            onClick={() => setRoleFilter(r.id)}
          >
            {r.label}
            <span className="mmh-role-tab-count">{countOf(r.id)}</span>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="mmh-table-card">
        <div className="mmh-table-card-top" />
        <div className="mmh-table-card-header">
          <div className="mmh-search-wrap" style={{ maxWidth: '400px' }}>
            <span className="mmh-search-icon">🔍</span>
            <input
              className="mmh-search-input"
              placeholder="Filter by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="mmh-btn mmh-btn-ghost mmh-btn-sm"
            onClick={fetchUsers}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="mmh-table-scroll">
          <table className="mmh-table">
            <thead>
              <tr>
                <th>Member Profile</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="mmh-empty">
                    <div className="mmh-spinner mmh-spinner-dark" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="mmh-empty">
                    <div className="mmh-empty-icon">🔍</div>
                    <div className="mmh-empty-text">No users match your criteria</div>
                    <div className="mmh-empty-sub">Try adjusting your filters</div>
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="mmh-user-cell">
                      <div
                        className="mmh-user-avatar"
                        style={{ background: 'var(--mmh-bg3)', border: '1px solid var(--mmh-border2)' }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="mmh-td-name">{u.name}</div>
                        <div className="mmh-td-sub">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`mmh-badge ${ROLE_BADGES[u.role] || 'mmh-badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.role === 'doctor' ? (
                      <div>
                        <div style={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>
                          {u.doctorInfo?.department || '—'}
                        </div>
                        <div style={{ color: 'var(--mmh-muted)', fontSize: '10px' }}>
                          Room {u.doctorInfo?.roomNo || '—'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--mmh-muted)' }}>Staff</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`mmh-toggle-inline ${u.active ? 'on' : 'off'}`}
                      onClick={() => toggleStatus(u)}
                      title={u.active ? 'Deactivate account' : 'Activate account'}
                    >
                      <div className="mmh-toggle-dot-sm" />
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="mmh-btn mmh-btn-ghost mmh-btn-xs"
                      onClick={() => openEdit(u)}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="mmh-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <form className="mmh-modal" onSubmit={handleSave}>
            {/* Modal header */}
            <div className="mmh-modal-header">
              <div>
                <div className="mmh-modal-title">
                  {editingUser ? 'Update Member Profile' : 'Register New Member'}
                </div>
                <div className="mmh-modal-subtitle">
                  Configure system access and department settings
                </div>
              </div>
              {/* Close button — always visible, flex item in header row */}
              <button
                type="button"
                className="mmh-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="mmh-modal-body">
              {saveError && (
                <div className="mmh-banner-error">⚠️ {saveError}</div>
              )}

              <div className="mmh-form-grid">
                {/* Full name */}
                <div className="mmh-field">
                  <label className="mmh-label">
                    Full Name <span className="mmh-required">*</span>
                  </label>
                  <input
                    className="mmh-input"
                    required
                    placeholder="e.g. Dr. Ayesha Khan"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div className="mmh-field">
                  <label className="mmh-label">
                    Institutional Email <span className="mmh-required">*</span>
                  </label>
                  <input
                    type="email"
                    className="mmh-input"
                    required
                    placeholder="e.g. doctor@mmh.pk"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                {/* Role */}
                <div className="mmh-field">
                  <label className="mmh-label">
                    System Role <span className="mmh-required">*</span>
                  </label>
                  <select
                    className="mmh-input-select"
                    value={formData.role}
                    onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="admin">Administrator</option>
                    <option value="doctor">Medical Doctor</option>
                    <option value="receptionist">Reception Staff</option>
                    <option value="lab">Lab Technician</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="manager">Manager</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>

                {/* Active status (for edit) */}
                {editingUser && (
                  <div className="mmh-field">
                    <label className="mmh-label">Account Status</label>
                    <select
                      className="mmh-input-select"
                      value={formData.active ? 'active' : 'inactive'}
                      onChange={e =>
                        setFormData(f => ({ ...f, active: e.target.value === 'active' }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                {/* Password (create only) */}
                {!editingUser && (
                  <div className="mmh-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="mmh-label">
                      Security Password <span className="mmh-required">*</span>
                    </label>
                    <div className="mmh-pass-row">
                      <input
                        className="mmh-input"
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="mmh-btn-icon-sm"
                        onClick={() => setShowPass(v => !v)}
                        title={showPass ? 'Hide' : 'Show'}
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                      <button
                        type="button"
                        className="mmh-btn-auto"
                        onClick={generatePassword}
                      >
                        AUTO
                      </button>
                    </div>
                  </div>
                )}

                {/* Doctor-specific fields */}
                {formData.role === 'doctor' && (
                  <>
                    <div className="mmh-section-divider">
                      <div className="mmh-section-line" />
                      <div className="mmh-section-text">Medical Department Info</div>
                      <div className="mmh-section-line" />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">Department</label>
                      <input
                        className="mmh-input"
                        placeholder="e.g. Cardiology"
                        value={formData.doctorInfo.department}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: { ...f.doctorInfo, department: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">Consultation Fee (PKR)</label>
                      <input
                        type="number"
                        className="mmh-input"
                        min={0}
                        value={formData.doctorInfo.fee}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: {
                              ...f.doctorInfo,
                              fee: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">OPD Timing</label>
                      <input
                        className="mmh-input"
                        placeholder="e.g. 09:00 – 14:00"
                        value={formData.doctorInfo.timing}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: { ...f.doctorInfo, timing: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">OPD Room No.</label>
                      <input
                        className="mmh-input"
                        placeholder="e.g. 12A"
                        value={formData.doctorInfo.roomNo}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: { ...f.doctorInfo, roomNo: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="mmh-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="mmh-label">Available Days</label>
                      <div className="mmh-days-wrap">
                        {WEEK_DAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            className={`mmh-day-btn${formData.doctorInfo.days.includes(day) ? ' selected' : ''}`}
                            onClick={() => toggleDay(day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="mmh-modal-footer">
              <button
                type="button"
                className="mmh-btn mmh-btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mmh-btn mmh-btn-primary"
                disabled={saving}
              >
                {saving
                  ? <><div className="mmh-spinner" /> Saving…</>
                  : editingUser ? '✓ Update Account' : '＋ Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
