// components/KpiCard.jsx — one cell inside a .stat-strip (see index.css)
import React from 'react';

export default function KpiCard({ label, value, sub, style = {} }) {
  const trendClass = sub?.startsWith('↑') ? 'up' : sub?.startsWith('↓') ? 'down' : '';
  return (
    <div className="stat-cell" style={style}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub ${trendClass}`}>{sub}</div>}
    </div>
  );
}
