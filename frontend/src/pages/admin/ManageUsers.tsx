import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import '../../styles/mmh.css';
import { formatPhone, validatePhone } from '../../utils/validation';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  department?: string;
  specialization?: string;
  qualification?: string;
  fee?: number;
  opdTiming?: string;
  opdDays?: string[];
  createdAt?: string;
}

interface DoctorInfo {
  department: string;
  specialization: string;
  qualification: string;
  fee: number;
  opdTiming: string;
  opdDays: string[];
}

type FormData = {
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  joiningDate: string;
  basicSalary: number;
  houseAllowance: number;
  medicalAllowance: number;
  transportAllowance: number;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  emergencyLeaveBalance: number;
  maternityLeaveBalance: number;
  unpaidLeaveBalance: number;
  doctorInfo: DoctorInfo;
};

const ROLE_BADGES: Record<string, string> = {
  admin: 'mmh-badge-rose',
  doctor: 'mmh-badge-green',
  receptionist: 'mmh-badge-sky',
  lab: 'mmh-badge-violet',
  pharmacist: 'mmh-badge-cyan',
  manager: 'mmh-badge-amber',
  patient: 'mmh-badge-gray',
};

const ROLE_FILTERS = [
  { id: 'all', label: 'All Users' },
  { id: 'admin', label: 'Admins' },
  { id: 'doctor', label: 'Doctors' },
  { id: 'receptionist', label: 'Reception' },
  { id: 'lab', label: 'Laboratory' },
  { id: 'pharmacist', label: 'Pharmacy' },
  { id: 'manager', label: 'Manager' },
  { id: 'patient', label: 'Patients' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getDepartmentLabel = (user: UserRecord): string => {
  if (user.department) return user.department;
  const map: Record<string, string> = {
    admin: 'Administration',
    receptionist: 'Reception',
    lab: 'Laboratory',
    pharmacist: 'Pharmacy',
    manager: 'Management',
    patient: 'Patient',
    doctor: 'Medical',
  };
  return map[user.role] || 'General';
};

const emptyForm = (): FormData => ({
  name: '',
  email: '',
  role: 'receptionist',
  phone: '',
  isActive: true,
  joiningDate: new Date().toISOString().split('T')[0],
  basicSalary: 0,
  houseAllowance: 0,
  medicalAllowance: 0,
  transportAllowance: 0,
  annualLeaveBalance: 10,
  sickLeaveBalance: 6,
  emergencyLeaveBalance: 3,
  maternityLeaveBalance: 30,
  unpaidLeaveBalance: 15,
  doctorInfo: {
    department: '',
    specialization: '',
    qualification: '',
    fee: 500,
    opdTiming: '9:00 AM - 2:00 PM',
    opdDays: [],
  },
});

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [defaultPwd, setDefaultPwd] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      // Handle both old array response and new { data: [...] } format
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(f => {
      const days = f.doctorInfo.opdDays.includes(day)
        ? f.doctorInfo.opdDays.filter(d => d !== day)
        : [...f.doctorInfo.opdDays, day];
      return { ...f, doctorInfo: { ...f.doctorInfo, opdDays: days } };
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData(emptyForm());
    setSaveError('');
    setSuccessMsg('');
    setDefaultPwd('');
    setModalOpen(true);
    setPhoneError('');
  };

  const openEdit = async (u: UserRecord) => {
    setEditingUser(u);
    setSaveError('');
    setSuccessMsg('');
    setDefaultPwd('');

    // Fetch detailed employee info for editing if it's not a patient
    let empData = {
      basicSalary: 0,
      houseAllowance: 0,
      medicalAllowance: 0,
      transportAllowance: 0,
      annualLeaveBalance: 10,
      sickLeaveBalance: 6,
      emergencyLeaveBalance: 3,
      maternityLeaveBalance: 30,
      unpaidLeaveBalance: 15,
      joiningDate: new Date().toISOString().split('T')[0]
    };

    try {
      if (u.role !== 'patient') {
        const res = await api.get(`/hr/employees?userId=${u._id}`);
        const emp = res.data?.data?.[0] || res.data?.[0];
        if (emp) {
          empData = {
            basicSalary: emp.basicSalary || 0,
            houseAllowance: emp.houseAllowance || 0,
            medicalAllowance: emp.medicalAllowance || 0,
            transportAllowance: emp.transportAllowance || 0,
            annualLeaveBalance: emp.annualLeaveBalance || 10,
            sickLeaveBalance: emp.sickLeaveBalance || 6,
            emergencyLeaveBalance: emp.emergencyLeaveBalance || 3,
            maternityLeaveBalance: emp.maternityLeaveBalance || 30,
            unpaidLeaveBalance: emp.unpaidLeaveBalance || 15,
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : empData.joiningDate
          };
        }
      }
    } catch (e) {
      console.warn('Could not fetch employee details for edit', e);
    }

    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      isActive: u.isActive,
      ...empData,
      doctorInfo: {
        department: u.department || '',
        specialization: u.specialization || '',
        qualification: u.qualification || '',
        fee: u.fee || 0,
        opdTiming: u.opdTiming || '9:00 AM - 2:00 PM',
        opdDays: u.opdDays || [],
      },
    });
    setModalOpen(true);
    setPhoneError(validatePhone(u.phone || ''));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSuccessMsg('');
    setDefaultPwd('');

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setSaveError(phoneErr);
      setSaving(false);
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
          joiningDate: formData.joiningDate,
          basicSalary: formData.basicSalary,
          houseAllowance: formData.houseAllowance,
          medicalAllowance: formData.medicalAllowance,
          transportAllowance: formData.transportAllowance,
          annualLeaveBalance: formData.annualLeaveBalance,
          sickLeaveBalance: formData.sickLeaveBalance,
          emergencyLeaveBalance: formData.emergencyLeaveBalance,
          maternityLeaveBalance: formData.maternityLeaveBalance,
          unpaidLeaveBalance: formData.unpaidLeaveBalance,
          ...(formData.role === 'doctor' ? formData.doctorInfo : {}),
        });
        setModalOpen(false);
        fetchUsers();
      } else {
        const res = await api.post('/users/register', {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          joiningDate: formData.joiningDate,
          basicSalary: formData.basicSalary,
          houseAllowance: formData.houseAllowance,
          medicalAllowance: formData.medicalAllowance,
          transportAllowance: formData.transportAllowance,
          annualLeaveBalance: formData.annualLeaveBalance,
          sickLeaveBalance: formData.sickLeaveBalance,
          emergencyLeaveBalance: formData.emergencyLeaveBalance,
          maternityLeaveBalance: formData.maternityLeaveBalance,
          unpaidLeaveBalance: formData.unpaidLeaveBalance,
          ...(formData.role === 'doctor' ? formData.doctorInfo : {}),
        });
        setModalOpen(false);
        // Show success with default password after a moment
        setSuccessMsg(`User "${formData.name}" created successfully!`);
        setDefaultPwd(res.data?.defaultPassword || 'mmh1234');
        fetchUsers();
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Error saving user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Optimistic toggle
  const handleToggle = async (userId: string, currentStatus: boolean) => {
    if (toggling) return;
    setToggling(userId);
    try {
      // Optimistic update immediately
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, isActive: !currentStatus } : u
      ));
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
    } catch {
      // Revert on error
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, isActive: currentStatus } : u
      ));
      alert('Failed to update status. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    const matchStatus =
      !statusFilter ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  const countOf = (role: string) =>
    role === 'all' ? users.length : users.filter(u => u.role === role).length;

  return (
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      {/* Success banner after creation */}
      {successMsg && (
        <div className="mmh-banner-success" style={{ marginBottom: '20px' }}>
          ✅ {successMsg}
          {defaultPwd && (
            <div style={{
              marginTop: '10px',
              padding: '10px 16px',
              background: 'var(--mmh-success-soft)',
              borderRadius: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span>Default Password: <strong>{defaultPwd}</strong></span>
              <button
                className="mmh-btn mmh-btn-ghost mmh-btn-xs"
                onClick={() => setSuccessMsg('')}
              >Dismiss</button>
            </div>
          )}
          <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--mmh-success)' }}>
            User can change password from Settings
          </div>
        </div>
      )}

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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div className="mmh-search-wrap" style={{ maxWidth: '320px', flex: 1 }}>
              <span className="mmh-search-icon">🔍</span>
              <input
                className="mmh-search-input"
                placeholder="Filter by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="mmh-input-select"
              style={{ width: '160px', colorScheme: 'dark' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">🟢 Active</option>
              <option value="inactive">🔴 Inactive</option>
            </select>
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
                    <div>
                      <div style={{ color: 'var(--mmh-text)', fontSize: '12px', fontWeight: 600 }}>
                        {getDepartmentLabel(u)}
                      </div>
                      {u.specialization && (
                        <div style={{ color: 'var(--mmh-muted)', fontSize: '10px' }}>
                          {u.specialization}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className={`mmh-toggle-inline ${u.isActive ? 'on' : 'off'}`}
                      onClick={() => handleToggle(u._id, u.isActive)}
                      disabled={toggling === u._id}
                      title={u.isActive ? 'Deactivate account' : 'Activate account'}
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
                  {editingUser
                    ? 'Edit role, status, and department settings'
                    : 'New user will be created with default password: mmh1234'}
                </div>
              </div>
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

              {!editingUser && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 16px',
                  background: 'var(--mmh-success-soft)',
                  border: '1px solid var(--mmh-success-soft)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: 'var(--mmh-success)',
                }}>
                  🔑 Default password will be set to: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>mmh1234</strong>
                  <span style={{ color: 'var(--mmh-text3)', marginLeft: '8px', fontWeight: 400 }}>(user can change from Settings)</span>
                </div>
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
                    disabled={!!editingUser}
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

                {/* Phone */}
                <div className="mmh-field">
                  <label className="mmh-label">Phone</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📞</span>
                    <input
                      className="mmh-input"
                      style={{ paddingLeft: 40, borderColor: phoneError ? 'var(--mmh-danger)' : undefined }}
                      placeholder="e.g. 0300-1234567"
                      value={formData.phone}
                      onChange={e => {
                        const formatted = formatPhone(e.target.value);
                        setFormData(f => ({ ...f, phone: formatted }));
                        setPhoneError(validatePhone(formatted));
                      }}
                    />
                  </div>
                  {phoneError
                    ? <span className="mmh-field-error">⚠️ {phoneError}</span>
                    : <span className="mmh-input-hint">Format: 03XX-XXXXXXX (11 digits)</span>
                  }
                </div>

                {/* Joining Date */}
                <div className="mmh-field">
                  <label className="mmh-label">Joining Date</label>
                  <input
                    type="date"
                    className="mmh-input"
                    style={{ colorScheme: 'dark' }}
                    value={formData.joiningDate}
                    onChange={e => setFormData(f => ({ ...f, joiningDate: e.target.value }))}
                  />
                </div>

                {/* Account status (edit only) */}
                {editingUser && (
                  <div className="mmh-field">
                    <label className="mmh-label">Account Status</label>
                    <select
                      className="mmh-input-select"
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={e =>
                        setFormData(f => ({ ...f, isActive: e.target.value === 'active' }))
                      }
                    >
                      <option value="active">🟢 Active</option>
                      <option value="inactive">🔴 Inactive</option>
                    </select>
                  </div>
                )}

                {/* Salary Section (Exclude patients) */}
                {formData.role !== 'patient' && (
                  <>
                    <div className="mmh-section-divider" style={{ gridColumn: '1 / -1' }}>
                      <div className="mmh-section-line" />
                      <div className="mmh-section-text">💰 Salary Setup</div>
                      <div className="mmh-section-line" />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">Basic Salary (PKR)</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.basicSalary}
                        onChange={e => setFormData(f => ({ ...f, basicSalary: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">House Allowance</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.houseAllowance}
                        onChange={e => setFormData(f => ({ ...f, houseAllowance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Medical Allowance</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.medicalAllowance}
                        onChange={e => setFormData(f => ({ ...f, medicalAllowance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Transport Allowance</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.transportAllowance}
                        onChange={e => setFormData(f => ({ ...f, transportAllowance: Number(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="mmh-field" style={{ gridColumn: '1 / -1' }}>
                      <div style={{
                        background: 'var(--mmh-card2)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--mmh-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--mmh-text3)' }}>Gross Monthly Package:</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mmh-success)' }}>
                          PKR {(formData.basicSalary + formData.houseAllowance + formData.medicalAllowance + formData.transportAllowance).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Leaves Section */}
                    <div className="mmh-section-divider" style={{ gridColumn: '1 / -1' }}>
                      <div className="mmh-section-line" />
                      <div className="mmh-section-text">🗓️ Leave Balances (Days)</div>
                      <div className="mmh-section-line" />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">Annual Leave</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.annualLeaveBalance}
                        onChange={e => setFormData(f => ({ ...f, annualLeaveBalance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Sick Leave</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.sickLeaveBalance}
                        onChange={e => setFormData(f => ({ ...f, sickLeaveBalance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Emergency Leave</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.emergencyLeaveBalance}
                        onChange={e => setFormData(f => ({ ...f, emergencyLeaveBalance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Maternity Leave</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.maternityLeaveBalance}
                        onChange={e => setFormData(f => ({ ...f, maternityLeaveBalance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mmh-field">
                      <label className="mmh-label">Unpaid Leave</label>
                      <input
                        type="number"
                        className="mmh-input"
                        value={formData.unpaidLeaveBalance}
                        onChange={e => setFormData(f => ({ ...f, unpaidLeaveBalance: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  </>
                )}

                {/* Doctor-specific fields */}
                {formData.role === 'doctor' && (
                  <>
                    <div className="mmh-section-divider" style={{ gridColumn: '1 / -1' }}>
                      <div className="mmh-section-line" />
                      <div className="mmh-section-text">🏥 Medical Department Info</div>
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
                      <label className="mmh-label">Specialization</label>
                      <input
                        className="mmh-input"
                        placeholder="e.g. Interventional Cardiology"
                        value={formData.doctorInfo.specialization}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: { ...f.doctorInfo, specialization: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="mmh-field">
                      <label className="mmh-label">OPD Timing</label>
                      <input
                        className="mmh-input"
                        placeholder="e.g. 09:00 – 14:00"
                        value={formData.doctorInfo.opdTiming}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            doctorInfo: { ...f.doctorInfo, opdTiming: e.target.value },
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
                            className={`mmh-day-btn${formData.doctorInfo.opdDays.includes(day) ? ' selected' : ''}`}
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
