import React from 'react';

interface ExistingSession {
  deviceInfo: string;
  loginAt:    string;
  ipAddress:  string;
}

interface SessionConflictModalProps {
  existingSession: ExistingSession;
  conflictToken:   string;
  onKeepOld:       () => void;
  onLoginHere:     () => void;
  loading:         boolean;
}

const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  existingSession,
  onKeepOld,
  onLoginHere,
  loading,
}) => {
  const formattedTime = (() => {
    try {
      return new Date(existingSession.loginAt).toLocaleString('en-PK', {
        day:    '2-digit',
        month:  'short',
        hour:   '2-digit',
        minute: '2-digit',
      });
    } catch {
      return existingSession.loginAt;
    }
  })();

  return (
    /* ── Overlay ── */
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.55)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         9999,
        padding:        '20px',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* ── Card ── */}
      <div
        style={{
          background:   'white',
          borderRadius: '16px',
          padding:      '32px',
          maxWidth:     '800px',
          width:        '100%',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* ── Header row ── */}
        <div
          style={{
            display:     'flex',
            alignItems:  'flex-start',
            gap:         '16px',
            marginBottom:'20px',
          }}
        >
          {/* Warning icon circle */}
          <div
            style={{
              width:          '44px',
              height:         '44px',
              borderRadius:   '50%',
              background:     '#fef2f2',
              border:         '1px solid #fecaca',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9"  x2="12"   y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Title + subtitle */}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize:   '18px',
                fontWeight: '700',
                color:      '#0f172a',
                margin:     '0 0 6px',
              }}
            >
              You're Already Logged In on Another Device
            </h3>
            <p
              style={{
                fontSize:   '14px',
                color:      '#64748b',
                margin:     0,
                lineHeight: '1.6',
                whiteSpace: 'nowrap',
              }}
            >
              It looks like you're logged in to your account on another device or browser.
            </p>
          </div>

          {/* Close × */}
          <button
            onClick={onKeepOld}
            title="Cancel"
            style={{
              width:          '32px',
              height:         '32px',
              borderRadius:   '8px',
              background:     '#f1f5f9',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          '#64748b',
              fontSize:       '20px',
              flexShrink:     0,
              lineHeight:     1,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Active session info box ── */}
        <div
          style={{
            background:   '#f8fafc',
            border:       '1px solid #e2e8f0',
            borderRadius: '12px',
            padding:      '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize:      '12px',
              fontWeight:    '700',
              color:         '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom:  '10px',
            }}
          >
            Active Session
          </div>

          <div
            style={{
              display:  'flex',
              gap:      '32px',
              fontSize: '14px',
              color:    '#475569',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              💻 {existingSession.deviceInfo || 'Web Browser'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🕐 {formattedTime}
            </span>
          </div>
        </div>

        {/* ── Question ── */}
        <p
          style={{
            fontSize:     '14px',
            color:        '#1e3a5f',
            fontWeight:   '600',
            marginBottom: '24px',
            lineHeight:   '1.5',
          }}
        >
          Would you like to stay logged in on that device, or end that session
          and log in here instead?
        </p>

        {/* ── Buttons ── */}
        <div
          style={{
            display:        'flex',
            gap:            '10px',
            justifyContent: 'flex-end',
            flexWrap:       'wrap',
          }}
        >
          {/* Keep old session */}
          <button
            onClick={onKeepOld}
            disabled={loading}
            className="mmh-session-conflict-cancel"
            style={{
              padding:      '10px 20px',
              background:   'white',
              border:       '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize:     '13px',
              fontWeight:   '600',
              color:        '#475569',
              cursor:       loading ? 'not-allowed' : 'pointer',
              opacity:      loading ? 0.6 : 1,
              transition:   'border-color 0.15s',
            }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.borderColor = '#94a3b8')
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0')
            }
          >
            No, Keep me logged in where I was
          </button>

          {/* Force login here */}
          <button
            onClick={onLoginHere}
            disabled={loading}
            style={{
              padding:      '10px 24px',
              background:   '#1e40af',
              border:       'none',
              borderRadius: '10px',
              fontSize:     '13px',
              fontWeight:   '700',
              color:        'white',
              cursor:       loading ? 'not-allowed' : 'pointer',
              opacity:      loading ? 0.7 : 1,
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              transition:   'opacity 0.15s',
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width:       '14px',
                    height:      '14px',
                    border:      '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation:   'mmh-spin 0.6s linear infinite',
                    display:     'inline-block',
                    flexShrink:  0,
                  }}
                />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionConflictModal;
