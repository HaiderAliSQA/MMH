import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDefaultPath } from '../utils/routes';
import '../styles/mmh.css';

const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (user) {
      navigate(getDefaultPath(user.role), { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="mmh-login-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mmh-login-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔍</div>
        <h1 className="mmh-card-title" style={{ fontSize: '28px', marginBottom: '10px' }}>404 — Page Not Found</h1>
        <p style={{ color: 'var(--mmh-text3)', marginBottom: '30px' }}>
          The page you're looking for doesn't exist or has been moved to a new URL.
        </p>
        <button 
          className="mmh-btn mmh-btn-primary" 
          style={{ width: '100%' }}
          onClick={handleGoHome}
        >
          {user ? 'Go to Dashboard' : 'Go to Login'}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
