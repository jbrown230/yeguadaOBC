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
    <main className="app-main">
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
  const [activePage, setActivePage]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const { metrics, backendOnline, loading, lastUpdated } = useMetrics(30000);

  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    setSidebarOpen(false);
    setChatOpen(false);
  }, []);

  const anyOpen = sidebarOpen || chatOpen;

  return (
    <div className="app-root">
      <Topbar
        backendOnline={backendOnline}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        onChatToggle={() => setChatOpen(o => !o)}
      />
      <div className="app-body">
        {anyOpen && <div className="drawer-overlay active" onClick={closeAll} />}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <MainContent
          activePage={activePage}
          metrics={metrics}
          backendOnline={backendOnline}
          loading={loading}
          lastUpdated={lastUpdated}
        />
        <ChatPanel
          backendOnline={backendOnline}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </div>
  );
}