import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/mmh.css';

const ROLES = [
  { id: 'admin', label: 'Admin', icon: '🛡️' },
  { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
  { id: 'receptionist', label: 'Reception', icon: '🏥' },
  { id: 'lab', label: 'Lab', icon: '🔬' },
  { id: 'pharmacist', label: 'Pharmacy', icon: '💊' },
  { id: 'manager', label: 'Manager', icon: '📊' },
  { id: 'patient', label: 'Patient', icon: '👤' },
];

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/users/login', { email, password });
      const { user, token } = res.data;

      if (user.role !== role) {
        setError(`Incorrect role selected. This account is registered as: "${user.role}". Please select the correct role above.`);
        setLoading(false);
        return;
      }

      // Update App state via AuthContext
      login(user, token);

      // REDIRECT BASED ON ROLE
      if (user.role === 'admin') navigate('/dashboard');
      else if (user.role === 'pharmacist') navigate('/dispense');
      else if (user.role === 'receptionist') navigate('/receptionist');
      else navigate(`/${user.role}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mmh-login-bg">
      <div className="mmh-login-dots" />

      <div className="mmh-login-card">
        {/* Logo */}
        <div className="mmh-login-logo-row">
          <div className="mmh-login-logo-box">🏥</div>
          <div>
            <div className="mmh-login-hospital-name" style={{ textAlign: 'center' }}>MMH</div>

            <div className="mmh-login-hospital-sab" style={{ color: 'white', textAlign: 'center' }}>Majida Memorial Hospital</div>
          </div>
        </div>

        {/* Role selector */}
        <div className="mmh-login-section-title">Select Portal Access</div>
        <div className="mmh-login-role-grid">
          {ROLES.map(r => (
            <div
              key={r.id}
              className={`mmh-login-role-card ${role === r.id ? 'selected' : ''}`}
              onClick={() => { setRole(r.id); setError(''); }}
            >
              <div className="mmh-login-role-icon">{r.icon}</div>
              <div className="mmh-login-role-label">{r.label}</div>
            </div>
          ))}
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin}>
          {error && <div className="mmh-login-error">⚠️ {error}</div>}

          <div className="mmh-login-field">
            <div className="mmh-label" style={{ marginBottom: '8px' }}>Institutional Email</div>
            <input
              type="email"
              className="mmh-login-input"
              placeholder="e.g. admin@mmh.pk"
              required
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="mmh-login-field">
            <div className="mmh-label" style={{ marginBottom: '8px' }}>Security Password</div>
            <div className="mmh-login-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="mmh-login-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="mmh-login-pass-toggle"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="mmh-login-btn" type="submit" disabled={loading}>
            {loading ? <div className="mmh-spinner" /> : '🔐 Sign In to Portal'}
          </button>
        </form>

        {/* <div className="mmh-login-hint">
          Default credentials: <span className="mmh-login-hint-code">admin@mmh.pk</span>
          {' / '}
          <span className="mmh-login-hint-code">mmh1234</span>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
