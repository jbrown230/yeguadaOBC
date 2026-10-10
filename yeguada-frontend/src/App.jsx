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
      case 'intents':   return <Intents metrics={metrics} />;
      case 'kb':        return <KnowledgeBase />;
      case 'monitor':   return <Monitor metrics={metrics} />;
      case 'config':    return <Config backendOnline={backendOnline} />;
      default:          return <Dashboard metrics={metrics} />;
    }
  };

  return (
    <main className="app-main">
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Cargando dashboard...</span>
        </div>
      ) : renderPage()}
      {lastUpdated && (
        <div className="last-updated">
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