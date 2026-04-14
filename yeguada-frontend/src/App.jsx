// App.jsx — Root component
import React, { useState, memo, useCallback } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import Dashboard from './pages/Dashboard';
import Intents from './pages/Intents';
import KnowledgeBase from './pages/KnowledgeBase';
import Monitor from './pages/Monitor';
import Config from './pages/Config';
import { useMetrics } from './hooks/useMetrics';

// Memoizado: solo re-renderiza si cambia activePage o metrics
// El ChatPanel está FUERA, así que nunca se re-renderiza por métricas ni navegación
const MainContent = memo(function MainContent({
  activePage, metrics, backendOnline, loading, lastUpdated,
}) {
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard metrics={metrics} />;
      case 'intents':   return <Intents />;
      case 'kb':        return <KnowledgeBase />;
      case 'monitor':   return <Monitor metrics={metrics} />;
      case 'config':    return <Config backendOnline={backendOnline} />;
      default:          return <Dashboard metrics={metrics} />;
    }
  };

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg)' }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50%', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--forest-light)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--stone-mid)' }}>Cargando dashboard...</span>
        </div>
      ) : renderPage()}
      {lastUpdated && (
        <div style={{ fontSize: 10, color: 'var(--stone-mid)', textAlign: 'right', marginTop: 16, paddingBottom: 8 }}>
          Última actualización: {lastUpdated}
        </div>
      )}
    </main>
  );
});

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const { metrics, backendOnline, loading, lastUpdated } = useMetrics(30000);

  // Referencia estable: no se recrea en cada poll de métricas
  const handleNavigate = useCallback((page) => setActivePage(page), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar backendOnline={backendOnline} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <MainContent
          activePage={activePage}
          metrics={metrics}
          backendOnline={backendOnline}
          loading={loading}
          lastUpdated={lastUpdated}
        />
        {/* ChatPanel al mismo nivel — React.memo lo protege de re-renders de MainContent */}
        <ChatPanel backendOnline={backendOnline} />
      </div>
    </div>
  );
}