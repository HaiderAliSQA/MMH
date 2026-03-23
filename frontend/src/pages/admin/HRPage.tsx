import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../api';
import '../../styles/mmh.css';
import EmployeesTab from './hr/EmployeesTab';
import AttendanceTab from './hr/AttendanceTab';
import LeaveTab from './hr/LeaveTab';
import PayrollTab from './hr/PayrollTab';
import SlipTab from './hr/SlipTab';

const TABS = [
  { key: 'employees', label: 'Employees', icon: '👥' },
  { key: 'attendance', label: 'Attendance', icon: '📊' },
  { key: 'leave', label: 'Leave Requests', icon: '🏖️' },
  { key: 'payroll', label: 'Payroll', icon: '💰' },
  { key: 'slips', label: 'Salary Slips', icon: '📄' },
];

const HRPage: React.FC = () => {
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const r = await hrAPI.getEmployees();
      setEmployees(r.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="mmh-loader" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
      <div className="mmh-page-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`mmh-page-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
        {tab === 'employees' && <EmployeesTab employees={employees} reload={loadEmployees} />}
        {tab === 'attendance' && <AttendanceTab employees={employees} />}
        {tab === 'leave' && <LeaveTab employees={employees} />}
        {tab === 'payroll' && <PayrollTab employees={employees} />}
        {tab === 'slips' && <SlipTab employees={employees} />}
      </div>
    </div>
  );
};

export default HRPage;
