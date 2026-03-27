import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hrAPI } from '../../../api';
import TypeSearch from '../../../components/TypeSearch';
import Pagination from '../../../components/Pagination';

const DEPARTMENTS = [
  'Administration', 'Reception', 'Cardiology', 'Neurology', 'Orthopedics',
  'General Medicine', 'Pediatrics', 'Gynecology', 'Laboratory', 'Pharmacy',
  'Management', 'Emergency', 'ICU',
].map(d => ({ value: d, label: d }));

const EmployeesTab: React.FC<{ employees: any[]; reload: () => void }> = ({ employees, reload }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: string; msg: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const stats = {
    total: employees.length,
    doctors: employees.filter(e => e.role === 'doctor').length,
    support: employees.filter(e => e.role !== 'doctor' && e.role !== 'admin').length,
    onLeave: 0,
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || e.name?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q);
  });

  // Calculate paginated data
  const totalResults = filtered.length;
  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const openEdit = (emp: any) => {
    setEditForm({
      name: emp.name || '', department: emp.department || '', designation: emp.designation || '',
      basicSalary: emp.basicSalary || 0,
      annualLeaveBalance: emp.annualLeaveBalance ?? 24, sickLeaveBalance: emp.sickLeaveBalance ?? 10,
      emergencyLeaveBalance: emp.emergencyLeaveBalance ?? 3,
    });
    setEditModal(emp);
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true); setBanner(null);
    try {
      await hrAPI.updateEmployee(editModal._id, editForm);
      setBanner({ type: 'success', msg: 'Employee updated!' });
      setEditModal(null);
      reload();
    } catch (err: any) {
      setBanner({ type: 'error', msg: err.response?.data?.message || 'Update failed' });
    } finally { setSaving(false); }
  };

  const roleBadge = (role: string) => {
    const m: Record<string, string> = { admin: 'mmh-badge-violet', doctor: 'mmh-badge-sky', receptionist: 'mmh-badge-green', lab: 'mmh-badge-amber', pharmacist: 'mmh-badge-rose', manager: 'mmh-badge-indigo' };
    return m[role] || 'mmh-badge-gray';
  };

  return (
    <div>
      {banner && <div className={`mmh-banner-${banner.type}`} style={{ marginBottom: 16 }}>{banner.type === 'success' ? '✅' : '⚠️'} {banner.msg}</div>}

      <div className="mmh-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: stats.total, icon: '👥', accent: 'var(--mmh-accent)' },
          { label: 'Doctors', value: stats.doctors, icon: '👨‍⚕️', accent: 'var(--mmh-success)' },
          { label: 'Support Staff', value: stats.support, icon: '🏥', accent: 'var(--mmh-accent)' },
          { label: 'On Leave Today', value: stats.onLeave, icon: '🏖️', accent: 'var(--mmh-warning)' },
        ].map(c => (
          <div className="mmh-stat-card" key={c.label}>
            <div className="mmh-stat-accent" style={{ background: c.accent }} />
            <span className="mmh-stat-icon">{c.icon}</span>
            <span className="mmh-stat-value">{c.value}</span>
            <span className="mmh-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mmh-card" style={{ marginBottom: 16 }}>
        <div className="mmh-card-body" style={{ padding: '12px 16px' }}>
          <input className="mmh-input" placeholder="🔍 Search employee by name, ID, role, department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="mmh-card">
        <div className="mmh-card-body" style={{ padding: 0 }}>
          <div className="mmh-table-scroll">
            <table className="mmh-table">
              <thead><tr><th>ID</th><th>Employee</th><th>Role</th><th>Department</th><th>Basic Salary</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={8} className="mmh-empty">No employees found</td></tr>
                ) : paginatedData.map(emp => (
                  <tr key={emp._id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--mmh-accent)', fontWeight: 700, fontSize: 12 }}>{emp.employeeId}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--mmh-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'var(--mmh-text-inverted)', flexShrink: 0 }}>
                          {(emp.name || 'E').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--mmh-text)', fontSize: 13 }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--mmh-text3)' }}>{emp.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`mmh-badge ${roleBadge(emp.role)}`}>{emp.role}</span></td>
                    <td style={{ fontSize: 13 }}>{emp.department}</td>
                    <td style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13 }}>{(emp.basicSalary || 0).toLocaleString()}</td>
                    <td><span className={`mmh-badge ${emp.isActive !== false ? 'mmh-badge-green' : 'mmh-badge-rose'}`}>{emp.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--mmh-text3)' }}>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" onClick={() => openEdit(emp)}>✏️ Edit</button>
                        <button className="mmh-btn mmh-btn-ghost mmh-btn-xs" style={{ color: 'var(--mmh-warning)' }} onClick={() => setSearchParams({ tab: 'leave', empId: emp._id, empName: emp.name })}>🏖️ Leaves</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            totalResults={totalResults}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </div>
      </div>

      {editModal && (
        <div className="mmh-overlay" onClick={e => { if (e.target === e.currentTarget) setEditModal(null) }}>
          <div className="mmh-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, overflow: 'visible' }}>
            <div className="mmh-modal-header" style={{ paddingRight: 12 }}>
              <div className="mmh-modal-title">Edit Employee — {editModal.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="mmh-btn mmh-btn-primary mmh-btn-xs" style={{ padding: '0 16px', height: 28, fontSize: 11, fontWeight: 700 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="mmh-modal-close" style={{ margin: 0, height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditModal(null)}>×</button>
              </div>
            </div>
            <div className="mmh-modal-body" style={{ overflow: 'visible', paddingBottom: 24 }}>
              <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="mmh-field"><label className="mmh-label">Employee Name</label><input className="mmh-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <TypeSearch options={DEPARTMENTS} value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} placeholder="Search department..." label="Department" />
                <div className="mmh-field"><label className="mmh-label">Designation</label><input className="mmh-input" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} /></div>
                <div className="mmh-field"><label className="mmh-label">Basic Salary (PKR)</label><input type="number" className="mmh-input" value={editForm.basicSalary || 0} onChange={e => setEditForm({ ...editForm, basicSalary: +e.target.value })} style={{ fontFamily: 'JetBrains Mono,monospace' }} /></div>
              </div>

              <div style={{ marginTop: 24, fontSize: 10, fontWeight: 700, color: 'var(--mmh-text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 24, height: 2, background: 'var(--mmh-warning)', borderRadius: 2 }} />
                Leave Balances (Remaining Days)
              </div>
              <div className="mmh-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="mmh-field"><label className="mmh-label">Annual Leave</label><input type="number" className="mmh-input" value={editForm.annualLeaveBalance || 0} onChange={e => setEditForm({ ...editForm, annualLeaveBalance: +e.target.value })} style={{ fontFamily: 'JetBrains Mono,monospace' }} /></div>
                <div className="mmh-field"><label className="mmh-label">Sick Leave</label><input type="number" className="mmh-input" value={editForm.sickLeaveBalance || 0} onChange={e => setEditForm({ ...editForm, sickLeaveBalance: +e.target.value })} style={{ fontFamily: 'JetBrains Mono,monospace' }} /></div>
                <div className="mmh-field"><label className="mmh-label">Emergency</label><input type="number" className="mmh-input" value={editForm.emergencyLeaveBalance || 0} onChange={e => setEditForm({ ...editForm, emergencyLeaveBalance: +e.target.value })} style={{ fontFamily: 'JetBrains Mono,monospace' }} /></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
