// components/auth/AuthShell.jsx — marco común de las pantallas de acceso
import React, { Suspense, lazy } from 'react';

// three.js (~130 KB gzip) se descarga aparte: el panel principal no lo carga.
const AuroraScene = lazy(() => import('../three/AuroraScene'));

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-root">
      <Suspense fallback={null}>
        <AuroraScene className="auth-scene" />
      </Suspense>
      <div className="auth-vignette" aria-hidden="true" />

      <main className="auth-card">
        <div className="auth-brand">
          <div className="auth-mark">LY</div>
          <span>Ecoturismo La Yeguada OBC</span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-sub">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </main>
      <p className="auth-legal">Panel de administración · TFG UNA 2026</p>
    </div>
  );
}
