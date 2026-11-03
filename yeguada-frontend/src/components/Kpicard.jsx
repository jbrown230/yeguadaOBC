// components/KpiCard.jsx — one cell inside a .stat-strip (see index.css)
import React from 'react';
import Icon from './Icon';

export default function KpiCard({ label, value, sub, icon, tone = 'accent', style = {} }) {
  const trendClass = sub?.startsWith('↑') ? 'up' : sub?.startsWith('↓') ? 'down' : '';
  return (
    <div className="stat-cell" style={style}>
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        {icon && <div className={`stat-icon ${tone}`}><Icon name={icon} size={17} /></div>}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub ${trendClass}`}>{sub}</div>}
    </div>
  );
}
