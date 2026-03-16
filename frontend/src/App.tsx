import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Receptionist from './pages/Receptionist';
import Doctor from './pages/Doctor';
import Lab from './pages/Lab';
import Pharmacist from './pages/Pharmacist';
import Manager from './pages/Manager';
import Patient from './pages/Patient';
import './styles/mmh.css';

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return (
    <div className="mmh-loading-container">
      <div className="mmh-loader"></div>
      <p>Loading MMH...</p>
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={(u, t) => login(u, t)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin/*"        element={<AdminLayout onLogout={logout} />} />
      <Route path="/receptionist/*" element={<Receptionist />} />
      <Route path="/doctor/*"       element={<Doctor user={user} />} />
      <Route path="/lab/*"          element={<Lab />} />
      <Route path="/pharmacist/*"   element={<Pharmacist />} />
      <Route path="/manager/*"      element={<Manager />} />
      <Route path="/patient/*"      element={<Patient user={user} />} />

      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to={`/${user.role}`} replace />} />
      <Route path="*" element={<Navigate to={`/${user.role}`} replace />} />
    </Routes>
  );
}

export default App;
