import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import '../../styles/mmh.css';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'theme'>('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Theme state
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeScheme, setActiveScheme] = useState('dark');
  const [themeMsg, setThemeMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedAccent = localStorage.getItem('mmh-accent') || 'default';
    const savedScheme = localStorage.getItem('mmh-scheme') || 'dark';
    setActiveTheme(savedAccent);
    setActiveScheme(savedScheme);
  }, []);

  const applyTheme = (accent: string, scheme: string) => {
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-scheme', scheme);
    localStorage.setItem('mmh-accent', accent);
    localStorage.setItem('mmh-scheme', scheme);
    setActiveTheme(accent);
    setActiveScheme(scheme);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    if (pass.length < 6) return { score: 33, label: 'Too short', color: 'var(--mmh-danger)' };
    if (pass.length < 8) return { score: 66, label: 'Weak', color: 'var(--mmh-warning)' };
    return { score: 100, label: 'Strong', color: 'var(--mmh-success)' };
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await authAPI.updateProfile(profileData);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      // Update local storage user if needed or reload
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      await authAPI.changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setPassMsg({ type: 'success', text: 'Password changed successfully! Logging out...' });
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 3000);
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setPassLoading(false);
    }
  };

  const strength = getPasswordStrength(passData.newPassword);

  const themeOptions = [
    { id: 'default', label: 'Default', color: '#0ea5e9' },
    { id: 'teal',    label: 'Teal',    color: '#14b8a6' },
    { id: 'rose',    label: 'Rose',    color: '#f43f5e' },
    { id: 'purple',  label: 'Purple',  color: '#8b5cf6' },
    { id: 'amber',   label: 'Amber',   color: '#f59e0b' },
  ];

  return (
    <div className="mmh-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Settings</h1>
          <p className="mmh-page-subtitle">Manage your account preferences and security</p>
        </div>
      </div>

      <div className="mmh-card">
        <div className="mmh-admin-tabs-wrap" style={{ padding: '0 20px' }}>
          <div className="mmh-admin-tabs">
            <button 
              className={`mmh-admin-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`mmh-admin-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              🔐 Change Password
            </button>
            <button 
              className={`mmh-admin-tab ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              🎨 Theme
            </button>
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '80px', height: '80px', 
                  borderRadius: '50%', 
                  background: 'var(--mmh-accent)',
                  color: 'var(--mmh-text-inverted)',
                  fontSize: '32px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 style={{ color: 'var(--mmh-text)', marginBottom: '4px' }}>{user?.name}</h3>
                <div className="mmh-badge-sky" style={{ display: 'inline-block' }}>{user?.role}</div>
                <p style={{ color: 'var(--mmh-text3)', fontSize: '12px', marginTop: '12px' }}>
                  Member since {new Date().toLocaleDateString()}
                </p>
              </div>

              <form onSubmit={handleProfileSave}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Full Name</label>
                  <input 
                    className="mmh-input" 
                    value={profileData.name}
                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Email Address</label>
                  <input 
                    className="mmh-input" 
                    value={user?.email} 
                    disabled 
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--mmh-text3)' }}>Email cannot be changed</small>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Phone Number</label>
                  <input 
                    className="mmh-input" 
                    placeholder="0312-4422004"
                    value={profileData.phone}
                    onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                {profileMsg && (
                  <div className={`mmh-banner ${profileMsg.type}`} style={{ marginBottom: '20px' }}>
                    {profileMsg.text}
                  </div>
                )}
                <button className="mmh-btn mmh-btn-primary" type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div style={{ maxWidth: '500px' }}>
              <form onSubmit={handlePasswordSave}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Current Password</label>
                  <input 
                    type="password" 
                    className="mmh-input" 
                    placeholder="Enter current password"
                    value={passData.currentPassword}
                    onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>New Password</label>
                  <input 
                    type="password" 
                    className="mmh-input" 
                    placeholder="Enter new password (min 6 chars)"
                    value={passData.newPassword}
                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                    required
                  />
                  {passData.newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="mmh-strength-bar">
                        <div style={{ 
                          width: `${strength.score}%`, 
                          height: '100%', 
                          background: strength.color,
                          transition: 'all 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: strength.color, marginTop: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                        {strength.label}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    className="mmh-input" 
                    placeholder="Confirm new password"
                    value={passData.confirmPassword}
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                {passMsg && (
                  <div className={`mmh-banner ${passMsg.type}`} style={{ marginBottom: '20px' }}>
                    {passMsg.text}
                  </div>
                )}
                <button className="mmh-btn mmh-btn-primary" type="submit" disabled={passLoading}>
                  {passLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'theme' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--mmh-text)', marginBottom: '4px' }}>Color Theme</h3>
                <p style={{ fontSize: '13px', color: 'var(--mmh-text3)', marginBottom: '20px' }}>Choose your preferred accent color</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {themeOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => applyTheme(opt.id, activeScheme)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: activeTheme === opt.id ? 'var(--mmh-accent-bg)' : 'var(--mmh-card2)',
                        border: activeTheme === opt.id ? '2px solid var(--mmh-accent)' : '1px solid var(--mmh-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        background: opt.color,
                        border: '2px solid var(--mmh-border)',
                        flexShrink: 0,
                      }}/>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--mmh-text)' }}>
                        {opt.label}
                      </span>
                      {activeTheme === opt.id && (
                        <span style={{ marginLeft: 'auto', color: 'var(--mmh-accent)', fontSize: '16px' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--mmh-text)', marginBottom: '4px' }}>Color Scheme</h3>
                <p style={{ fontSize: '13px', color: 'var(--mmh-text3)', marginBottom: '20px' }}>Dark is easier on the eyes at night</p>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => applyTheme(activeTheme, 'dark')}
                    className="mmh-btn"
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: activeScheme === 'dark' ? 'var(--mmh-accent-soft)' : 'var(--mmh-bg3)',
                      border: activeScheme === 'dark' ? '2px solid var(--mmh-accent)' : '1px solid var(--mmh-border)',
                      color: activeScheme === 'dark' ? 'var(--mmh-accent)' : 'var(--mmh-text2)',
                    }}
                  >
                    🌙 Dark
                  </button>
                  <button
                    onClick={() => applyTheme(activeTheme, 'light')}
                    className="mmh-btn"
                    style={{
                      flex: 1,
                      padding: 'var(--mmh-spacing-lg)',
                      background: activeScheme === 'light' ? 'var(--mmh-accent-soft)' : 'var(--mmh-bg3)',
                      border: activeScheme === 'light' ? '2px solid var(--mmh-accent)' : '1px solid var(--mmh-border)',
                      color: activeScheme === 'light' ? 'var(--mmh-accent)' : 'var(--mmh-text2)',
                    }}
                  >
                    ☀️ Light
                  </button>
                </div>
              </div>
              
              <div style={{ marginTop: '30px', borderTop: '1px solid var(--mmh-border)', paddingTop: '20px' }}>
                <button 
                  className="mmh-btn mmh-btn-primary" 
                  onClick={() => setThemeMsg('Theme saved! Changes apply immediately.')}
                >
                  Save Theme
                </button>
                {themeMsg && <p style={{ color: 'var(--mmh-accent)', fontSize: '13px', marginTop: '12px' }}>{themeMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
