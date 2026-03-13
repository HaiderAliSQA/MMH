import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/mmh.css';

const Settings: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Form states
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
        if (savedUser) setUser(JSON.parse(savedUser));
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
            await api.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            setBanner({ type: 'success', msg: '✅ Password updated successfully!' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setBanner({ type: 'error', msg: err.response?.data?.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const strength = getStrength(form.newPassword);

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="mmh-page-header">
                <div>
                    <h1 className="mmh-page-title">⚙️ Settings</h1>
                    <p className="mmh-page-sub">Manage your profile and security preferences</p>
                </div>
            </div>

            <div className="mmh-settings-grid">
                {/* Profile Card */}
                <div className="mmh-card">
                    <div className="mmh-card-accent" />
                    <div className="mmh-card-header">
                        <div className="mmh-card-title">My Profile</div>
                    </div>
                    <div className="mmh-profile-card-body">
                        <div className="mmh-profile-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="mmh-profile-name">{user.name}</div>
                        <div className="mmh-profile-email">{user.email}</div>
                        
                        <div style={{ marginTop: '24px', width: '100%' }}>
                            <div className="mmh-info-row">
                                <span className="mmh-info-label">Role</span>
                                <span className="mmh-badge mmh-badge-sky">{user.role}</span>
                            </div>
                            <div className="mmh-info-row">
                                <span className="mmh-info-label">Department</span>
                                <span className="mmh-info-value">{user.doctorInfo?.department || 'N/A'}</span>
                            </div>
                            <div className="mmh-info-row">
                                <span className="mmh-info-label">Member Since</span>
                                <span className="mmh-info-value">Jan 2024</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Card */}
                <div className="mmh-card">
                    <div className="mmh-card-accent" style={{ background: 'var(--amber)' }} />
                    <div className="mmh-card-header">
                        <div className="mmh-card-title">Change Password</div>
                    </div>
                    <form className="mmh-card-body" onSubmit={handleSubmit}>
                        {banner && (
                            <div className={banner.type === 'success' ? 'mmh-success-banner' : 'mmh-error-banner'}>
                                {banner.msg}
                            </div>
                        )}

                        <div className="mmh-field" style={{ marginBottom: '16px' }}>
                            <label className="mmh-label">Current Password</label>
                            <div className="mmh-pass-row">
                                <input 
                                    type={showPass.curr ? 'text' : 'password'} 
                                    name="currentPassword"
                                    className="mmh-input" 
                                    placeholder="Enter current password"
                                    value={form.currentPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="mmh-eye-btn"
                                    onClick={() => setShowPass({ ...showPass, curr: !showPass.curr })}
                                >
                                    {showPass.curr ? '👁️' : '🙈'}
                                </button>
                            </div>
                        </div>

                        <div className="mmh-field" style={{ marginBottom: '16px' }}>
                            <label className="mmh-label">New Password</label>
                            <div className="mmh-pass-row">
                                <input 
                                    type={showPass.new ? 'text' : 'password'} 
                                    name="newPassword"
                                    className="mmh-input" 
                                    placeholder="8+ chars, 1 uppercase, 1 number"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="mmh-eye-btn"
                                    onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                                >
                                    {showPass.new ? '👁️' : '🙈'}
                                </button>
                            </div>
                            {form.newPassword && (
                                <>
                                    <div className="mmh-pass-strength-bar">
                                        <div className={`mmh-pass-strength-fill ${
                                            strength <= 1 ? 'mmh-pass-weak' : 
                                            strength === 2 ? 'mmh-pass-medium' : 'mmh-pass-strong'
                                        }`} />
                                    </div>
                                    <div className={`mmh-pass-strength-label ${
                                        strength <= 1 ? 'mmh-pass-weak-text' : 
                                        strength === 2 ? 'mmh-pass-medium-text' : 'mmh-pass-strong-text'
                                    }`}>
                                        {strength <= 1 ? 'Weak' : strength === 2 ? 'Medium' : 'Strong'}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mmh-field" style={{ marginBottom: '24px' }}>
                            <label className="mmh-label">Confirm New Password</label>
                            <div className="mmh-pass-row">
                                <input 
                                    type={showPass.conf ? 'text' : 'password'} 
                                    name="confirmPassword"
                                    className={`mmh-input ${form.confirmPassword && form.confirmPassword === form.newPassword ? 'mmh-input-match' : ''}`}
                                    placeholder="Repeat new password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="mmh-eye-btn"
                                    onClick={() => setShowPass({ ...showPass, conf: !showPass.conf })}
                                >
                                    {showPass.conf ? '👁️' : '🙈'}
                                </button>
                            </div>
                            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                                <div className="mmh-field-error">Passwords do not match</div>
                            )}
                        </div>

                        <button className="mmh-btn mmh-btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? <div className="mmh-spinner" /> : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
