import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';

// Layout Wrappers
import {
  AdminLayout,
  DoctorLayout,
  ReceptionistLayout,
  LabLayout,
  PharmacyLayout,
  DispensaryLayout,
  ManagerLayout,
  PatientLayout
} from './components/layouts';

// Pages
import LoginPage from './pages/Login';
import DashboardPage from './pages/admin/AdminDashboard';
import PatientsPage from './pages/admin/PatientsPage';
import AdminPharmacyPage from './pages/pharmacy/PharmacyPage';
import WardsPage from './pages/admin/ManageWards';
import PaymentsPage from './pages/admin/PaymentsGrid';
import UsersPage from './pages/admin/ManageUsers';
import HRPage from './pages/admin/HRPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminDispensaryPage from './pages/dispensary/DispensaryPage';
import SettingsPage from './pages/shared/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Portal Main Pages
import DoctorPage from './pages/Doctor';
import OpdPage from './pages/Receptionist';
import LabPage from './pages/Lab';
import PharmacistPage from './pages/pharmacy/PharmacyPage';
import DispensaryPage from './pages/dispensary/DispensaryPage';
import ManagerPage from './pages/Manager';
import PatientPage from './pages/Patient';

import { getDefaultPath } from './utils/routes';
import './styles/mmh.css';

// Role guard component:
const RoleRoute = ({
  allowedRole,
  children,
}: {
  allowedRole: string | string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="mmh-loading-container">
      <div className="mmh-loader"></div>
      <p>Loading MMH...</p>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (!roles.includes(user.role)) {
    // Redirect to correct portal
    return <Navigate to={getDefaultPath(user.role)} replace />;
  }

  return <>{children}</>;
};

// RootRedirect:
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(user.role)} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* ADMIN */}
        <Route path="/admin" element={
          <RoleRoute allowedRole="admin">
            <AdminLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="patients"   element={<PatientsPage />} />
          <Route path="pharmacy"   element={<AdminPharmacyPage user={{ role: 'admin' }} />} />
          <Route path="wards"      element={<WardsPage />} />
          <Route path="payments"   element={<PaymentsPage />} />
          <Route path="users"      element={<UsersPage />} />
          <Route path="hr"         element={<HRPage />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="dispensary" element={<AdminDispensaryPage />} />
          <Route path="settings"   element={<SettingsPage />} />
        </Route>

        {/* DOCTOR */}
        <Route path="/doctor" element={
          <RoleRoute allowedRole="doctor">
            <DoctorLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/doctor/patients" replace />} />
          <Route path="patients"  element={<DoctorPage user={{ role: 'doctor' }} />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* RECEPTIONIST */}
        <Route path="/receptionist" element={
          <RoleRoute allowedRole="receptionist">
            <ReceptionistLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/receptionist/opd" replace />} />
          <Route path="opd"      element={<OpdPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* LAB */}
        <Route path="/lab" element={
          <RoleRoute allowedRole="lab">
            <LabLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/lab/queue" replace />} />
          <Route path="queue"    element={<LabPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* PHARMACIST */}
        <Route path="/pharmacy" element={
          <RoleRoute allowedRole="pharmacist">
            <PharmacyLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/pharmacy/dispense" replace />} />
          <Route path="dispense"  element={<PharmacistPage user={{ role: 'pharmacist' }} />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* DISPENSARY */}
        <Route path="/dispensary" element={
          <RoleRoute allowedRole="dispensary">
            <DispensaryLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/dispensary/dispense" replace />} />
          <Route path="dispense"  element={<DispensaryPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* MANAGER */}
        <Route path="/manager" element={
          <RoleRoute allowedRole="manager">
            <ManagerLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/manager/analytics" replace />} />
          <Route path="analytics" element={<ManagerPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* PATIENT */}
        <Route path="/patient" element={
          <RoleRoute allowedRole="patient">
            <PatientLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/patient/records" replace />} />
          <Route path="records"  element={<PatientPage user={{ role: 'patient' }} />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Old URLs → redirect to new (backward compat) */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/my-patients" element={<Navigate to="/doctor/patients" replace />} />
        <Route path="/opd" element={<Navigate to="/receptionist/opd" replace />} />
        <Route path="/lab-portal" element={<Navigate to="/lab/queue" replace />} />
        <Route path="/hr" element={<Navigate to="/admin/hr" replace />} />
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/dispense" element={<Navigate to="/pharmacy/dispense" replace />} />
        <Route path="/inventory" element={<Navigate to="/pharmacy/dispense?tab=inventory" replace />} />
        <Route path="/analytics" element={<Navigate to="/manager/analytics" replace />} />
        <Route path="/my-records" element={<Navigate to="/patient/records" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
