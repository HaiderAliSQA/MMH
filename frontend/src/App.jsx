import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Receptionist from './pages/Receptionist';
import Doctor from './pages/Doctor';
import Lab from './pages/Lab';
import Pharmacist from './pages/Pharmacist';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import Patient from './pages/Patient';

function App() {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage for basic auth session
    const savedUser = localStorage.getItem('mmh_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('mmh_user', JSON.stringify(u));
    navigate(`/${u.role}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mmh_user');
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(p => !p);

  if (!user) {
    return <Routes><Route path="*" element={<Login onLogin={handleLogin} />} /></Routes>;
  }

  return (
    <div className="shell">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} />}
      <Sidebar user={user} onLogout={handleLogout} isOpen={isSidebarOpen} closeSidebar={()=>setSidebarOpen(false)} />
      <div className="main">
        <Topbar user={user} toggleSidebar={toggleSidebar} />
        <div className="content">
          <Routes>
            <Route path="/receptionist" element={<Receptionist />} />
            <Route path="/doctor" element={<Doctor user={user} />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/pharmacist" element={<Pharmacist />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="/patient" element={<Patient user={user} />} />
            <Route path="*" element={<div style={{padding:40}}>Select an option from the sidebar. (Role: {user.role})</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
