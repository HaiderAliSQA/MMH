import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/mmh.css';
import { wakeUpServer } from '../utils/keepAlive';

const ROLES = [
  { id: 'admin',         label: 'Admin',     icon: '🛡️' },
  { id: 'doctor',        label: 'Doctor',    icon: '👨‍⚕️' },
  { id: 'receptionist',  label: 'Reception', icon: '🏥' },
  { id: 'lab',           label: 'Lab',       icon: '🔬' },
  { id: 'pharmacist',    label: 'Pharmacy',  icon: '💊' },
  { id: 'manager',       label: 'Manager',   icon: '📊' },
  { id: 'patient',       label: 'Patient',   icon: '👤' },
];

const BACKEND_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace('/api', '');

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('admin');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [retrying, setRetrying]   = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'waking'>('checking');

  // Wake up server immediately on page load
  useEffect(() => {
    wakeUpServer();
  }, []);

  // Show server status in real time
  useEffect(() => {
    const checkServer = async () => {
      try {
        setServerStatus('waking');
        const res = await fetch(`${BACKEND_URL}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) setServerStatus('online');
      } catch {
        setServerStatus('waking');
      }
    };
    checkServer();
  }, []);

  const getDefaultRoute = (roleId: string): string => {
    if (roleId === 'admin')        return '/dashboard';
    if (roleId === 'pharmacist')   return '/dispense';
    if (roleId === 'receptionist') return '/receptionist';
    return `/${roleId}`;
  };

  const handleLoginInternal = async (retryCount: number = 0): Promise<void> => {
    setLoading(true);
    if (retryCount === 0) setError('');

    try {
      const res = await api.post('/users/login', { email, password });
      const { user, token } = res.data;

      if (user.role !== role) {
        setError(
          `Incorrect role selected. This account is registered as: "${user.role}". Please select the correct role above.`
        );
        setLoading(false);
        setRetrying(false);
        return;
      }

      login(user, token);
      navigate(getDefaultRoute(user.role), { replace: true });

    } catch (err: any) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || '';

      // Cold start detection:
      // 503 = server unavailable
      // 502 = bad gateway (server starting)
      // Network error = server waking up
      // "Invalid email" on first try = could be cold start stale connection
      const isColdStart =
        status === 503 ||
        status === 502 ||
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED' ||
        (retryCount === 0 && message.toLowerCase().includes('invalid'));

      if (isColdStart && retryCount < 2) {
        setRetrying(true);
        setError(
          `⏳ Server is starting up... Retrying automatically in 4 seconds (Attempt ${retryCount + 1}/2)`
        );
        setLoading(false);

        setTimeout(() => {
          handleLoginInternal(retryCount + 1);
        }, 4000);

        return;
      }

      // Real error after retries
      setRetrying(false);
      setError(message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetrying(false);
    await handleLoginInternal(0);
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

        {/* Server status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          marginBottom: '16px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: serverStatus === 'online'
            ? 'rgba(16,185,129,0.1)'
            : 'rgba(245,158,11,0.1)',
          border: `1px solid ${serverStatus === 'online'
            ? 'rgba(16,185,129,0.25)'
            : 'rgba(245,158,11,0.25)'}`,
          width: 'fit-content',
          margin: '0 auto 16px',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: serverStatus === 'online' ? '#10b981' : '#f59e0b',
            display: 'inline-block',
            animation: serverStatus !== 'online' ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{
            color: serverStatus === 'online' ? '#34d399' : '#fbbf24',
            fontWeight: 600,
          }}>
            {serverStatus === 'checking' && 'Checking server...'}
            {serverStatus === 'online'   && 'Server Online'}
            {serverStatus === 'waking'   && 'Server starting up...'}
          </span>
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
          {error && (
            <div className={retrying ? 'mmh-login-warning' : 'mmh-login-error'}>
              {error}
              {retrying && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  fontSize: '12px',
                }}>
                  <span className="mmh-spinner-sm" />
                  Please wait...
                </div>
              )}
            </div>
          )}

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

          <button
            className="mmh-login-btn"
            type="submit"
            disabled={loading || retrying}
          >
            {loading || retrying
              ? <div className="mmh-spinner" />
              : '🔐 Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
