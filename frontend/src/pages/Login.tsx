import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import SessionConflictModal from '../components/SessionConflictModal';
import '../styles/mmh.css';
import { wakeUpServer } from '../utils/keepAlive';
import { getDefaultPath } from '../utils/routes';

const ROLES = [
  { id: 'admin',        label: 'Admin',      icon: '🛡️' },
  { id: 'doctor',       label: 'Doctor',     icon: '👨‍⚕️' },
  { id: 'receptionist', label: 'Reception',  icon: '🏥' },
  { id: 'lab',          label: 'Lab',        icon: '🔬' },
  { id: 'pharmacist',   label: 'Pharmacy',   icon: '💊' },
  { id: 'manager',      label: 'Manager',    icon: '📊' },
  { id: 'patient',      label: 'Patient',    icon: '👤' },
  { id: 'dispensary',   label: 'Dispensary', icon: '🆓' },
];

const BACKEND_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace('/api', '');


const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('admin');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const [logoutMessage, setLogoutMessage] = useState('');

  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'waking'>('checking');

  // ── Session conflict state ────────────────────────────────────────────────
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    existingSession: { deviceInfo: string; loginAt: string; ipAddress: string };
    conflictToken: string;
  } | null>(null);
  const [forceLoading, setForceLoading] = useState(false);

  // ── On mount: read the logout message left by useSessionGuard ───────────
  useEffect(() => {
    const msg = localStorage.getItem('mmh_logout_msg');
    if (msg) {
      setLogoutMessage(msg);
      localStorage.removeItem('mmh_logout_msg');
    }
  }, []);

  // ── Wake up the backend server ───────────────────────────────────────────
  useEffect(() => {
    wakeUpServer();
  }, []);

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

  // ── Core login logic (with retry support) ────────────────────────────────
  const handleLoginInternal = async (retryCount: number = 0): Promise<void> => {
    setLoading(true);
    if (retryCount === 0) setError('');

    try {
      const res = await authAPI.login({ email, password });
      const { user, token, expiresAt } = res.data;

      if (user.role !== role) {
        setError(
          `Incorrect role selected. This account is registered as: "${user.role}". Please select the correct role above.`
        );
        setLoading(false);
        setRetrying(false);
        return;
      }

      // Persist session data
      localStorage.setItem('mmh_token',   token);
      localStorage.setItem('mmh_expires', expiresAt || '');
      login(user, token, expiresAt);
      navigate(getDefaultPath(user.role), { replace: true });

    } catch (err: any) {
      const status  = err.response?.status;
      const data    = err.response?.data;

      // ── 409 — duplicate session detected ──────────────────────────────────
      if (status === 409 && data?.code === 'SESSION_EXISTS') {
        setConflictData({
          existingSession: data.existingSession,
          conflictToken:   data.conflictToken,
        });
        setShowConflictModal(true);
        setLoading(false);
        setRetrying(false);
        return;
      }

      const message = data?.message || '';

      // Cold-start / network retry logic
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
        setTimeout(() => handleLoginInternal(retryCount + 1), 4000);
        return;
      }

      setRetrying(false);
      setError(message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetrying(false);
    setLogoutMessage('');
    await handleLoginInternal(0);
  };

  // ── "Keep old session" — user cancels, stays on other device ────────────
  const handleKeepOld = () => {
    setShowConflictModal(false);
    setConflictData(null);
    setError('Login cancelled. Your other session is still active.');
  };

  // ── "Login here" — force-kill old session, create new one ───────────────
  const handleForceLogin = async () => {
    if (!conflictData) return;
    setForceLoading(true);

    try {
      const res = await authAPI.forceLogin({
        conflictToken: conflictData.conflictToken,
      });
      const { user, token, expiresAt } = res.data;

      localStorage.setItem('mmh_token',   token);
      localStorage.setItem('mmh_expires', expiresAt || '');
      login(user, token, expiresAt);
      setShowConflictModal(false);
      navigate(getDefaultPath(user.role), { replace: true });

    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Force login failed. Please try again.'
      );
      setShowConflictModal(false);
    } finally {
      setForceLoading(false);
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
            <div className="mmh-login-hospital-name">MMH</div>
            <div className="mmh-login-hospital-sab">Majida Memorial Hospital</div>
          </div>
        </div>

        {/* Server status indicator */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          fontSize:       '11px',
          marginBottom:   '16px',
          padding:        '6px 12px',
          borderRadius:   '20px',
          background:     serverStatus === 'online'
            ? 'var(--mmh-success-soft)'
            : 'var(--mmh-warning-soft)',
          border: `1px solid ${serverStatus === 'online'
            ? 'var(--mmh-success-soft)'
            : 'var(--mmh-warning-soft)'}`,
          width:  'fit-content',
          margin: '0 auto 16px',
        }}>
          <span style={{
            width:       '7px',
            height:      '7px',
            borderRadius:'50%',
            background:  serverStatus === 'online' ? 'var(--mmh-success)' : 'var(--mmh-warning)',
            display:     'inline-block',
            animation:   serverStatus !== 'online' ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{
            color:      serverStatus === 'online' ? 'var(--mmh-success)' : 'var(--mmh-warning)',
            fontWeight: 600,
          }}>
            {serverStatus === 'checking' && 'Checking server...'}
            {serverStatus === 'online'   && 'Server Online'}
            {serverStatus === 'waking'   && 'Server starting up...'}
          </span>
        </div>

        {/* ── Logout / session-ended info banner (amber) ── */}
        {logoutMessage && (
          <div style={{
            padding:      '12px 14px',
            background:   'rgba(245,158,11,0.1)',
            border:       '1px solid rgba(245,158,11,0.3)',
            borderRadius: '10px',
            fontSize:     '13px',
            color:        '#fbbf24',
            marginBottom: '16px',
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
          }}>
            <span>ℹ️</span>
            {logoutMessage}
          </div>
        )}

        {/* Role selector */}
        <div className="mmh-login-section-title">Select Portal Access</div>
        <div className="mmh-login-role-grid">
          {ROLES.map(r => (
            <div
              key={r.id}
              className={`mmh-login-role-card ${role === r.id ? 'selected' : ''}`}
              onClick={() => { setRole(r.id); setError(''); setLogoutMessage(''); }}
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
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '8px',
                  marginTop:      '8px',
                  fontSize:       '12px',
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

      {/* ── Session conflict modal ── */}
      {showConflictModal && conflictData && (
        <SessionConflictModal
          existingSession={conflictData.existingSession}
          conflictToken={conflictData.conflictToken}
          onKeepOld={handleKeepOld}
          onLoginHere={handleForceLogin}
          loading={forceLoading}
        />
      )}
    </div>
  );
};

export default Login;
