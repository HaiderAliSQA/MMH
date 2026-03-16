import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../api';
import '../styles/mmh.css';

const Settings: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPass, setShowPass] = useState<Record<string, boolean>>({
        curr: false,
        new: false,
        conf: false
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('mmh_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const getStrength = (pass: string) => {
        if (!pass) return 0;
        let s = 0;
        if (pass.length >= 8) s++;
        if (/[A-Z]/.test(pass)) s++;
        if (/[0-9]/.test(pass)) s++;
        if (/[^A-Za-z0-9]/.test(pass)) s++;
        return s;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBanner(null);

        if (form.newPassword !== form.confirmPassword) {
            setBanner({ type: 'error', msg: 'New passwords do not match!' });
            return;
        }

        if (getStrength(form.newPassword) < 3) {
            setBanner({ type: 'error', msg: 'Password is too weak. Must have 8+ chars, uppercase, and a number.' });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            
            setBanner({ type: 'success', msg: '✅ ' + (response.data.message || 'Password updated successfully!') });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
            // Optional: User might want to logout after password change for security
            // logout();
            // navigate('/login');
        } catch (err: any) {
            setBanner({ type: 'error', msg: err.response?.data?.message || 'Failed to update password. Please check your current password.' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const strength = getStrength(form.newPassword);
    const strengthLabels = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#475569', '#ef4444', '#f59e0b', '#10b981', '#10b981'];

    return (
        <div style={{ padding: '0', animation: 'mmh-fade-in 0.4s ease' }}>
            {/* Page Header (Optional, simplified) */}
            <div className="mmh-page-header" style={{ marginBottom: '24px' }}>
                <h1 className="mmh-page-title" style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>⚙️ Security & Profile</h1>
                <p className="mmh-page-sub" style={{ color: '#64748b' }}>Manage your account settings and update password</p>
            </div>

            <div className="mmh-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                
                {/* Profile Overview */}
                <div className="mmh-card" style={{ height: 'fit-content' }}>
                    <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                    <div className="mmh-card-header">
                        <div className="mmh-card-title">👤 My Profile</div>
                    </div>
                    <div className="mmh-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
                        <div className="mmh-profile-avatar" style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '40px',
                            color: 'white',
                            fontWeight: 700,
                            marginBottom: '20px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{user.name}</h2>
                        <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '32px' }}>{user.email}</p>
                        
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Role', value: user.role, isBadge: true },
                                { label: 'Department', value: user.doctorInfo?.department || 'General' },
                                { label: 'Access Level', value: user.role === 'admin' ? 'Root' : 'Standard' },
                                { label: 'Status', value: 'Active ✅', isSuccess: true }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>{item.label}</span>
                                    {item.isBadge ? (
                                        <span className="mmh-badge mmh-badge-sky" style={{ textTransform: 'capitalize' }}>{item.value}</span>
                                    ) : (
                                        <span style={{ color: item.isSuccess ? '#10b981' : 'white', fontWeight: 600, fontSize: '14px' }}>{item.value}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Password Change Form */}
                <div className="mmh-card">
                    <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                    <div className="mmh-card-header">
                        <div className="mmh-card-title">🔐 Change Password</div>
                    </div>
                    <form className="mmh-card-body" style={{ padding: '24px' }} onSubmit={handleSubmit}>
                        {banner && (
                            <div className={banner.type === 'success' ? 'mmh-banner-success' : 'mmh-banner-error'} style={{ marginBottom: '24px' }}>
                                {banner.msg}
                            </div>
                        )}

                        <div className="mmh-field" style={{ marginBottom: '20px' }}>
                            <label className="mmh-label">Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPass.curr ? 'text' : 'password'} 
                                    name="currentPassword"
                                    className="mmh-input" 
                                    style={{ paddingRight: '46px' }}
                                    placeholder="Verify your identity"
                                    value={form.currentPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.6 }}
                                    onClick={() => setShowPass({ ...showPass, curr: !showPass.curr })}
                                >
                                    {showPass.curr ? '👁️' : '🙈'}
                                </button>
                            </div>
                        </div>

                        <div className="mmh-field" style={{ marginBottom: '20px' }}>
                            <label className="mmh-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPass.new ? 'text' : 'password'} 
                                    name="newPassword"
                                    className="mmh-input" 
                                    style={{ paddingRight: '46px' }}
                                    placeholder="Create a strong password"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.6 }}
                                    onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                                >
                                    {showPass.new ? '👁️' : '🙈'}
                                </button>
                            </div>
                            
                            {form.newPassword && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Security Strength</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{ 
                                                flex: 1, 
                                                height: '100%', 
                                                borderRadius: '2px',
                                                background: i <= strength ? strengthColors[strength] : 'transparent',
                                                transition: 'all 0.3s ease'
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mmh-field" style={{ marginBottom: '32px' }}>
                            <label className="mmh-label">Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPass.conf ? 'text' : 'password'} 
                                    name="confirmPassword"
                                    className={`mmh-input ${form.confirmPassword && form.confirmPassword === form.newPassword ? 'mmh-input-success' : ''}`}
                                    style={{ paddingRight: '46px' }}
                                    placeholder="Repeat new password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.6 }}
                                    onClick={() => setShowPass({ ...showPass, conf: !showPass.conf })}
                                >
                                    {showPass.conf ? '👁️' : '🙈'}
                                </button>
                            </div>
                            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>⚠️ Passwords do not match</div>
                            )}
                        </div>

                        <button className="mmh-btn mmh-btn-primary" style={{ width: '100%', height: '48px', fontSize: '16px', fontWeight: 600 }} disabled={loading}>
                            {loading ? <div className="mmh-spinner" style={{ width: '20px', height: '20px' }} /> : 'Update Security Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
