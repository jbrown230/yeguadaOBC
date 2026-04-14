// components/KpiCard.jsx
import React from 'react';

const accentColors = {
  green:  'var(--forest-light)',
  teal:   'var(--teal-light)',
  gold:   'var(--gold-light)',
  stone:  'var(--stone-mid)',
  coral:  'var(--coral-light)',
};

export default function KpiCard({ label, value, sub, icon, color = 'green', style = {} }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeUp 0.4s var(--ease) both',
      ...style,
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: accentColors[color] || accentColors.green,
        borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
      }} />

      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--stone-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>

      <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--stone-deep)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 11, color: 'var(--stone-mid)' }}>{sub}</div>
      )}

      {icon && (
        <div style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 26,
          opacity: 0.12,
          pointerEvents: 'none',
        }}>
          {icon}
        </div>
      )}
    </div>
  );
}