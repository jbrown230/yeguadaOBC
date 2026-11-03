// App.jsx — Root component
import React, { useState, memo, useCallback } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Intents from './pages/Intents';
import KnowledgeBase from './pages/KnowledgeBase';
import Escalations from './pages/Escalations';
import Monitor from './pages/Monitor';
import Config from './pages/Config';
import Users from './pages/Users';
import Account from './pages/Account';
import { NAV_ITEMS, canAccess } from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import { useMetrics } from './hooks/useMetrics';

const MainContent = memo(function MainContent({
  activePage, metrics, backendOnline, loading, lastUpdated,
}) {
  const { user } = useAuth();
  const renderPage = () => {
    const item = NAV_ITEMS.find((i) => i.id === activePage);
    if (item && !canAccess(item, user.role)) return <Dashboard metrics={metrics} />;
    switch (activePage) {
      case 'dashboard': return <Dashboard metrics={metrics} />;
      case 'intents':   return <Intents metrics={metrics} />;
      case 'kb':        return <KnowledgeBase />;
      case 'escalations': return <Escalations />;
      case 'monitor':   return <Monitor metrics={metrics} />;
      case 'users':     return <Users />;
      case 'account':   return <Account />;
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

export default function AppShell() {
  const [activePage, setActivePage]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { metrics, backendOnline, loading, lastUpdated } = useMetrics(30000);

  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);


  return (
    <div className="app-root">
      <Topbar
        backendOnline={backendOnline}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        pendingEscalations={metrics.pendingEscalations || 0}
        onNotifClick={() => handleNavigate('escalations')}
        onAccount={() => handleNavigate('account')}
      />
      <div className="app-body">
        {sidebarOpen && <div className="drawer-overlay active" onClick={() => setSidebarOpen(false)} />}
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
      </div>
    </div>
  );
}