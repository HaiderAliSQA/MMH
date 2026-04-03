import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientsPage from './pages/admin/PatientsPage';
import PharmacyPage from './pages/pharmacy/PharmacyPage';
import ManageUsers from './pages/admin/ManageUsers';
import ManageWards from './pages/admin/ManageWards';
import HRPage from './pages/admin/HRPage';
import PaymentsGrid from './pages/admin/PaymentsGrid';
import SettingsPage from './pages/shared/SettingsPage';
import DispensaryPage from './pages/dispensary/DispensaryPage';
import ReportsPage from './pages/reports/ReportsPage';

// Original Portal Pages
import Receptionist from './pages/Receptionist';
import Doctor from './pages/Doctor';
import Lab from './pages/Lab';
import Manager from './pages/Manager';
import Patient from './pages/Patient';

import './styles/mmh.css';

// Placeholder for missing pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
    <h2 style={{ color: 'var(--mmh-text)', fontSize: '20px' }}>{title}</h2>
    <p style={{ color: 'var(--mmh-text3)', marginTop: '8px' }}>
      Coming soon...
    </p>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="mmh-loading-container">
      <div className="mmh-loader"></div>
      <p>Loading MMH...</p>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user, logout } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Admin Dashboard"><AdminDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'receptionist']}><MainLayout user={user} title="Patients"><PatientsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Pharmacy"><PharmacyPage user={user} /></MainLayout></ProtectedRoute>} />
        <Route path="/wards" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Wards"><ManageWards /></MainLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Payments"><PaymentsGrid /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Manage Users"><ManageUsers /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/managers" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Manage Managers"><PlaceholderPage title="Managers Management" /></MainLayout></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><MainLayout user={user} title="HR Management"><HRPage /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><MainLayout user={user} title="Account Settings"><SettingsPage /></MainLayout></ProtectedRoute>} />

        {/* Receptionist Portal (Restored Legacy UI) */}
        <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']}><Receptionist onLogout={logout} /></ProtectedRoute>} />
        {/* Helper aliases for sidebar navigation */}
        <Route path="/opd" element={<ProtectedRoute allowedRoles={['receptionist']}><Receptionist onLogout={logout} /></ProtectedRoute>} />
        <Route path="/admission" element={<ProtectedRoute allowedRoles={['receptionist']}><Receptionist onLogout={logout} /></ProtectedRoute>} />
        <Route path="/lab-req" element={<ProtectedRoute allowedRoles={['receptionist']}><Receptionist onLogout={logout} /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute allowedRoles={['receptionist']}><Receptionist onLogout={logout} /></ProtectedRoute>} />

        {/* Doctor Portal (Restored Legacy UI) */}
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><Doctor user={user} /></ProtectedRoute>} />
        {/* Helper aliases */}
        <Route path="/my-patients" element={<ProtectedRoute allowedRoles={['doctor']}><Doctor user={user} /></ProtectedRoute>} />
        <Route path="/lab-orders" element={<ProtectedRoute allowedRoles={['doctor']}><Doctor user={user} /></ProtectedRoute>} />

        {/* Lab Portal (Restored Legacy UI) */}
        <Route path="/lab" element={<ProtectedRoute allowedRoles={['lab']}><Lab onLogout={logout} /></ProtectedRoute>} />
        {/* Helper aliases */}
        <Route path="/lab-pending" element={<ProtectedRoute allowedRoles={['lab']}><Lab onLogout={logout} /></ProtectedRoute>} />
        <Route path="/lab-results" element={<ProtectedRoute allowedRoles={['lab']}><Lab onLogout={logout} /></ProtectedRoute>} />

        {/* Pharmacist Portal */}
        <Route path="/dispense" element={<ProtectedRoute allowedRoles={['pharmacist']}><MainLayout user={user} title="Medicine Dispensing"><PharmacyPage user={user} /></MainLayout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={['pharmacist']}><MainLayout user={user} title="Inventory Management"><PharmacyPage user={user} /></MainLayout></ProtectedRoute>} />

        {/* Manager Portal (Restored Legacy UI) */}
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><Manager onLogout={logout} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['manager']}><Manager onLogout={logout} /></ProtectedRoute>} />

        {/* Patient Portal (Restored Legacy UI) */}
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><Patient user={user} onLogout={logout} /></ProtectedRoute>} />
        <Route path="/my-records" element={<ProtectedRoute allowedRoles={['patient']}><Patient user={user} onLogout={logout} /></ProtectedRoute>} />

        {/* Dispensary Portal */}
        <Route path="/dispensary" element={<ProtectedRoute allowedRoles={['dispensary', 'admin']}><MainLayout user={user} title="Trust Dispensary"><DispensaryPage /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/dispensary" element={<ProtectedRoute allowedRoles={['admin']}><MainLayout user={user} title="Dispensary Management"><DispensaryPage /></MainLayout></ProtectedRoute>} />

        {/* Reports Portal */}
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><MainLayout user={user} title="Trust Reports"><ReportsPage /></MainLayout></ProtectedRoute>} />

        {/* Default Redirects */}
        <Route path="/" element={user ? <Navigate to={`/${user.role === 'admin' ? 'dashboard' : user.role === 'pharmacist' ? 'dispense' : user.role === 'receptionist' ? 'receptionist' : user.role === 'dispensary' ? 'dispensary' : user.role}`} replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
