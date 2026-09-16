import React, { useState, useEffect } from 'react';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar, ActiveNavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PortCard } from './components/dashboard/PortCard';
import { Inspector } from './components/dashboard/Inspector';
import { MiniWidget } from './components/widget/MiniWidget';
import { ProjectsView } from './components/projects/ProjectsView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { ConfirmModal } from './components/common/ConfirmModal';
import { EmptyState } from './components/common/EmptyState';
import { usePorts } from './hooks/usePorts';
import { PortItem } from './types/models';

export const App: React.FC = () => {
  const {
    ports,
    filteredPorts,
    loading,
    scanning,
    stats,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy,
    actionMessage,
    triggerScan,
    toggleFavorite,
    openUrl,
    openFolder,
    openTerminal,
    copyUrl,
    pauseProcess,
    resumeProcess,
    stopProcess,
    restartProcess,
  } = usePorts();

  const [windowMode, setWindowMode] = useState<'widget' | 'full'>('full');
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('ports');
  const [selectedPort, setSelectedPort] = useState<PortItem | null>(null);
  const [stopModalItem, setStopModalItem] = useState<PortItem | null>(null);
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('dark');

  // Load window settings
  useEffect(() => {
    async function loadSettings() {
      if (window.api) {
        const s = await window.api.getSettings();
        setWindowMode(s.windowMode);
        setAlwaysOnTop(s.alwaysOnTop);
        setTheme(s.theme || 'dark');
      }
    }
    loadSettings();

    // Listen for navigation requests from tray
    let unsubscribe: (() => void) | undefined;
    if (window.api?.onNavigate) {
      unsubscribe = window.api.onNavigate((view) => {
        if (view === 'settings') {
          setWindowMode('full');
          setCurrentTab('settings');
        }
      });
    }

    // Keyboard shortcut listeners (Esc to close inspector)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPort(null);
        setStopModalItem(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        triggerScan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerScan]);

  const handleToggleMode = async () => {
    const nextMode = windowMode === 'widget' ? 'full' : 'widget';
    setWindowMode(nextMode);
    if (window.api) {
      await window.api.setWindowMode(nextMode);
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    if (window.api) {
      const isTop = await window.api.toggleAlwaysOnTop();
      setAlwaysOnTop(isTop);
    }
  };

  const handleMinimize = () => {
    window.api?.minimizeWindow();
  };

  const handleClose = () => {
    window.api?.closeWindow();
  };

  const handleConfirmStop = async (force: boolean) => {
    if (stopModalItem) {
      await stopProcess(stopModalItem.pid, force);
      if (selectedPort?.pid === stopModalItem.pid) {
        setSelectedPort(null);
      }
      setStopModalItem(null);
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
    if (window.api) {
      window.api.saveSettings({ theme: next });
    }
  };

  return (
    <div className={`w-screen h-screen flex flex-col font-sans ${theme === 'dark' ? 'dark text-zinc-100' : 'light text-zinc-800'}`}>
      {/* Outer Shell with Solid Apple Surface & Corner Radius */}
      <div className="w-full h-full flex flex-col overflow-hidden bg-[#0F0F12] border border-white/[0.12] shadow-2xl rounded-2xl relative">
        {/* Custom Apple Titlebar */}
        <Titlebar
          windowMode={windowMode}
          alwaysOnTop={alwaysOnTop}
          activeCount={stats.activeCount}
          scanning={scanning}
          onToggleMode={handleToggleMode}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onScan={triggerScan}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />

        {/* Content Body */}
        {windowMode === 'widget' ? (
          /* Mini Widget Mode */
          <MiniWidget
            ports={ports}
            activeCount={stats.activeCount}
            scanning={scanning}
            onScan={triggerScan}
            onSelect={item => setSelectedPort(item)}
            onExpandToFull={handleToggleMode}
            onOpenUrl={openUrl}
            onPause={pauseProcess}
            onResume={resumeProcess}
            onRequestStop={item => setStopModalItem(item)}
          />
        ) : (
          /* Full Dashboard Mode */
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              currentTab={currentTab}
              onSelectTab={tab => {
                setCurrentTab(tab);
                if (tab === 'favorites') setFilterCategory('favorites');
                else if (tab === 'ports') setFilterCategory('all');
              }}
              stats={stats}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
              {currentTab === 'projects' ? (
                <ProjectsView
                  activePorts={ports}
                  onOpenUrl={openUrl}
                  onOpenFolder={openFolder}
                />
              ) : currentTab === 'history' ? (
                <HistoryView />
              ) : currentTab === 'settings' ? (
                <SettingsView currentTheme={theme} onThemeChange={setTheme} />
              ) : (
                /* Default View: Ports Grid & General Dashboard */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header
                    stats={stats}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterCategory={filterCategory}
                    onFilterChange={setFilterCategory}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />

                  {/* Ports Grid */}
                  <div className="flex-1 overflow-y-auto p-4 pr-3">
                    {loading ? (
                      <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                          <span>Escaneando puertos y procesos locales...</span>
                        </div>
                      </div>
                    ) : filteredPorts.length === 0 ? (
                      <EmptyState
                        onScan={triggerScan}
                        onViewProjects={() => setCurrentTab('projects')}
                        scanning={scanning}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-fade-in">
                        {filteredPorts.map(item => (
                          <PortCard
                            key={item.id}
                            item={item}
                            onSelect={selected => setSelectedPort(selected)}
                            onToggleFavorite={toggleFavorite}
                            onOpenUrl={openUrl}
                            onCopyUrl={copyUrl}
                            onPause={pauseProcess}
                            onResume={resumeProcess}
                            onRequestStop={stopTarget => setStopModalItem(stopTarget)}
                            onOpenFolder={openFolder}
                            onOpenTerminal={openTerminal}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide-over Inspector Drawer */}
        <Inspector
          item={selectedPort}
          isOpen={!!selectedPort}
          onClose={() => setSelectedPort(null)}
          onOpenUrl={openUrl}
          onOpenFolder={openFolder}
          onOpenTerminal={openTerminal}
          onCopyUrl={copyUrl}
          onPause={pauseProcess}
          onResume={resumeProcess}
          onRestart={restartProcess}
          onRequestStop={item => setStopModalItem(item)}
        />

        {/* Destruction Confirmation Modal */}
        <ConfirmModal
          portItem={stopModalItem}
          isOpen={!!stopModalItem}
          onClose={() => setStopModalItem(null)}
          onConfirm={handleConfirmStop}
        />

        {/* Apple Capsule Toast Notification */}
        {actionMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
            <div
              className={`px-4 py-2 rounded-full text-xs font-medium backdrop-blur-2xl shadow-2xl border flex items-center gap-2 select-none ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                  : actionMessage.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                  : 'bg-zinc-900/85 border-white/10 text-zinc-200'
              }`}
            >
              <span>{actionMessage.text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
