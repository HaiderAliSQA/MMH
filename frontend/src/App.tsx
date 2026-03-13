import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role) {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
        }
      }
    } catch {
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const handleLogin = useCallback((loggedInUser: any) => {
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin/*"        element={<AdminLayout onLogout={handleLogout} />} />
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
