import React from 'react';

interface SessionWarningProps {
  minutesLeft: number;
}

/**
 * Fixed bottom-right banner shown when the session has < 30 minutes left.
 * Turns urgent (red + pulse) when < 10 minutes remain.
 */
export const SessionWarning: React.FC<SessionWarningProps> = ({ minutesLeft }) => {
  if (minutesLeft > 30) return null;

  const isUrgent = minutesLeft <= 10;

  return (
    <div
      style={{
        position:  'fixed',
        bottom:    '20px',
        right:     '20px',
        background: isUrgent ? '#7f1d1d' : '#78350f',
        border:    `1px solid ${isUrgent ? '#f43f5e' : '#f59e0b'}`,
        borderRadius: '12px',
        padding:   '12px 16px',
        zIndex:    9000,
        display:   'flex',
        alignItems: 'center',
        gap:       '10px',
        maxWidth:  '320px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: isUrgent ? 'mmh-pulse 1s ease infinite' : 'none',
      }}
    >
      <span style={{ fontSize: '20px', flexShrink: 0 }}>
        {isUrgent ? '⚠️' : '🕐'}
      </span>

      <div>
        <div
          style={{
            fontSize:   '13px',
            fontWeight: '700',
            color:      isUrgent ? '#fca5a5' : '#fcd34d',
          }}
        >
          {isUrgent
            ? `Session expires in ${minutesLeft} min!`
            : `Session expires in ${minutesLeft} min`}
        </div>
        <div
          style={{
            fontSize:   '11px',
            color:      '#94a3b8',
            marginTop:  '2px',
          }}
        >
          {isUrgent
            ? 'Save your work now'
            : 'You will be logged out automatically'}
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;
