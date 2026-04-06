import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

interface SessionGuardResult {
  minutesLeft:       number | null;
  showExpireWarning: boolean;
}

/**
 * useSessionGuard
 *
 * Runs in every authenticated portal.
 * - Immediately checks session validity on mount.
 * - Polls the server every 5 minutes to verify the DB session is still active.
 * - Updates a minute-level countdown every 60 seconds.
 * - Shows a warning banner when < 30 minutes remain.
 * - Hard-redirects to /login (with a message) when the session is invalid or
 *   has been ended (midnight job, replaced by another device, etc.).
 */
export const useSessionGuard = (): SessionGuardResult => {
  const navigate = useNavigate();
  const [minutesLeft,       setMinutesLeft]       = useState<number | null>(null);
  const [showExpireWarning, setShowExpireWarning] = useState(false);

  // Track whether we've already triggered logout to avoid double-redirects
  const isExpiredRef = useRef(false);

  const handleExpired = useCallback(
    (message: string) => {
      if (isExpiredRef.current) return;
      isExpiredRef.current = true;
      localStorage.removeItem('mmh_token');
      localStorage.removeItem('mmh_expires');
      localStorage.removeItem('mmh_user');
      localStorage.setItem('mmh_logout_msg', message);
      navigate('/login', { replace: true });
    },
    [navigate]
  );

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('mmh_token');
    if (!token) {
      handleExpired('Please log in to continue.');
      return;
    }

    // ── Fast local expiry check ───────────────────────────────────────────────
    const expiresAt = localStorage.getItem('mmh_expires');
    if (expiresAt) {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const mins = Math.floor(diff / 60_000);

      if (diff <= 0) {
        handleExpired('Your session has expired. Please log in again.');
        return;
      }

      setMinutesLeft(mins);
      setShowExpireWarning(mins <= 30);
    }

    // ── Server-side session validation ────────────────────────────────────────
    try {
      await authAPI.verifySession();
    } catch (err: any) {
      const code   = err.response?.data?.code;
      const status = err.response?.status;

      if (code === 'SESSION_INVALID') {
        handleExpired('Your session was ended on another device or by an admin.');
      } else if (code === 'SESSION_EXPIRED') {
        handleExpired('Your session has expired. Please log in again.');
      } else if (status === 401) {
        handleExpired('Please log in to continue.');
      }
      // Network errors (offline) — silently ignore, don't kick the user
    }
  }, [handleExpired]);

  useEffect(() => {
    // Check immediately on mount
    checkSession();

    // Poll server every 5 minutes
    const serverPoll = setInterval(checkSession, 5 * 60 * 1_000);

    // Update countdown every 60 seconds (for the warning banner display)
    const countdown = setInterval(() => {
      const expiresAt = localStorage.getItem('mmh_expires');
      if (!expiresAt) return;

      const diff = new Date(expiresAt).getTime() - Date.now();
      const mins = Math.floor(diff / 60_000);

      if (diff <= 0) {
        handleExpired('Your session has expired. Please log in again.');
        return;
      }

      setMinutesLeft(mins);
      setShowExpireWarning(mins <= 30);
    }, 60_000);

    return () => {
      clearInterval(serverPoll);
      clearInterval(countdown);
    };
  }, [checkSession, handleExpired]);

  return { minutesLeft, showExpireWarning };
};
