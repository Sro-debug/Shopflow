import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { dismissNotification } from '../../redux/userSlice';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#6366f1',
  warning: '#f59e0b',
};

export default function NotificationToast({ notification }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissNotification(notification.id)), 4000);
    return () => clearTimeout(timer);
  }, [notification.id, dispatch]);

  const color = COLORS[notification.type] || COLORS.info;
  const icon = ICONS[notification.type] || ICONS.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: `1px solid ${color}44`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow)',
        animation: 'slideIn 0.3s ease',
        minWidth: 280,
        maxWidth: 360,
        cursor: 'pointer',
      }}
      onClick={() => dispatch(dismissNotification(notification.id))}
    >
      <span style={{ color, fontWeight: 700, fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text)', flex: 1 }}>{notification.message}</span>
    </div>
  );
}
