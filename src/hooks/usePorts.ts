import { useState, useEffect, useMemo, useCallback } from 'react';
import { PortItem, PortStatus, SystemStats } from '../types/models';

export type FilterCategory = 'all' | 'active' | 'paused' | 'nodejs' | 'python' | 'docker' | 'database' | 'favorites';
export type SortOption = 'port' | 'name' | 'uptime' | 'status';

export function usePorts() {
  const [ports, setPorts] = useState<PortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('port');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3200);
  }, []);

  // Fetch initial ports
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (window.api) {
          const initial = await window.api.getPorts();
          if (mounted) {
            setPorts(initial);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load initial ports:', err);
        if (mounted) setLoading(false);
      }
    }

    load();

    // Subscribe to real-time pushes
    let unsubscribe: (() => void) | undefined;
    if (window.api?.onPortsUpdated) {
      unsubscribe = window.api.onPortsUpdated((updated) => {
        if (mounted) {
          setPorts(updated);
        }
      });
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const triggerScan = useCallback(async () => {
    if (!window.api) return;
    setScanning(true);
    try {
      const refreshed = await window.api.scanPorts();
      setPorts(refreshed);
      showToast('Puertos escaneados', 'success');
    } catch (e: any) {
      showToast(`Error al escanear: ${e.message}`, 'error');
    } finally {
      setScanning(false);
    }
  }, [showToast]);

  const toggleFavorite = useCallback(async (port: number) => {
    if (!window.api) return;
    try {
      const isFav = await window.api.toggleFavorite(port);
      setPorts(prev =>
        prev.map(p => (p.port === port ? { ...p, isFavorite: isFav } : p))
      );
      showToast(isFav ? `Puerto ${port} añadido a favoritos` : `Puerto ${port} eliminado de favoritos`, 'info');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }, [showToast]);

  const openUrl = useCallback(async (url: string) => {
    if (!window.api) return;
    await window.api.openUrl(url);
    showToast(`Abriendo ${url}`, 'info');
  }, [showToast]);

  const openFolder = useCallback(async (folderPath?: string) => {
    if (!window.api || !folderPath) return;
    const res = await window.api.openFolder(folderPath);
    if (!res.success) {
      showToast(res.error || 'No se pudo abrir la carpeta', 'error');
    }
  }, [showToast]);

  const openTerminal = useCallback(async (folderPath?: string) => {
    if (!window.api || !folderPath) return;
    const res = await window.api.openTerminal(folderPath);
    if (!res.success) {
      showToast(res.error || 'No se pudo abrir la terminal', 'error');
    } else {
      showToast('Terminal iniciada en la carpeta del proyecto', 'success');
    }
  }, [showToast]);

  const copyUrl = useCallback(async (url: string) => {
    if (!window.api) return;
    await window.api.copyUrl(url);
    showToast('URL copiada al portapapeles', 'success');
  }, [showToast]);

  const pauseProcess = useCallback(async (pid: number) => {
    if (!window.api) return;
    const res = await window.api.pauseProcess(pid);
    if (res.success) {
      showToast(`Proceso PID ${pid} pausado`, 'info');
      setPorts(prev => prev.map(p => (p.pid === pid ? { ...p, state: 'paused' } : p)));
    } else {
      showToast(res.error || 'Error al pausar el proceso', 'error');
    }
    return res;
  }, [showToast]);

  const resumeProcess = useCallback(async (pid: number) => {
    if (!window.api) return;
    const res = await window.api.resumeProcess(pid);
    if (res.success) {
      showToast(`Proceso PID ${pid} reanudado`, 'success');
      setPorts(prev => prev.map(p => (p.pid === pid ? { ...p, state: 'active' } : p)));
    } else {
      showToast(res.error || 'Error al reanudar el proceso', 'error');
    }
    return res;
  }, [showToast]);

  const stopProcess = useCallback(async (pid: number, force: boolean = false) => {
    if (!window.api) return;
    const res = await window.api.stopProcess(pid, force);
    if (res.success) {
      showToast(`Proceso PID ${pid} detenido`, 'success');
      setPorts(prev => prev.filter(p => p.pid !== pid));
    } else {
      showToast(res.error || 'Error al detener proceso', 'error');
    }
    return res;
  }, [showToast]);

  const restartProcess = useCallback(async (pid: number) => {
    if (!window.api) return;
    showToast(`Reiniciando proceso PID ${pid}...`, 'info');
    const res = await window.api.restartProcess(pid);
    if (res.success) {
      showToast('Servidor reiniciado con éxito', 'success');
    } else {
      showToast(res.error || 'Error al reiniciar', 'error');
    }
    return res;
  }, [showToast]);

  // Statistics
  const stats: SystemStats = useMemo(() => {
    const active = ports.filter(p => p.state === 'active').length;
    const paused = ports.filter(p => p.state === 'paused').length;
    const uniqueProjects = new Set(ports.map(p => p.projectName).filter(Boolean)).size;
    return {
      activeCount: active,
      pausedCount: paused,
      projectCount: uniqueProjects,
      totalListeners: ports.length,
    };
  }, [ports]);

  // Filtering & Sorting
  const filteredPorts = useMemo(() => {
    return ports.filter(item => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.port.toString().includes(q) ||
          (item.projectName && item.projectName.toLowerCase().includes(q)) ||
          (item.framework && item.framework.toLowerCase().includes(q)) ||
          (item.processName && item.processName.toLowerCase().includes(q)) ||
          (item.pid && item.pid.toString().includes(q)) ||
          (item.workingDirectory && item.workingDirectory.toLowerCase().includes(q)) ||
          (item.url && item.url.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category filter
      if (filterCategory === 'active') return item.state === 'active';
      if (filterCategory === 'paused') return item.state === 'paused';
      if (filterCategory === 'favorites') return !!item.isFavorite;
      if (filterCategory === 'nodejs') {
        const f = (item.framework || '').toLowerCase();
        const p = (item.processName || '').toLowerCase();
        return f.includes('node') || f.includes('vite') || f.includes('next') || f.includes('react') || p.includes('node');
      }
      if (filterCategory === 'python') {
        const f = (item.framework || '').toLowerCase();
        const p = (item.processName || '').toLowerCase();
        return f.includes('python') || f.includes('fastapi') || f.includes('flask') || f.includes('django') || p.includes('python');
      }
      if (filterCategory === 'docker') {
        const f = (item.framework || '').toLowerCase();
        const p = (item.processName || '').toLowerCase();
        return f.includes('docker') || p.includes('docker');
      }
      if (filterCategory === 'database') {
        const f = (item.framework || '').toLowerCase();
        return f.includes('postgres') || f.includes('mysql') || f.includes('redis') || f.includes('mongo');
      }

      return true;
    }).sort((a, b) => {
      // Favorites always appear first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      if (sortBy === 'port') return a.port - b.port;
      if (sortBy === 'name') return (a.projectName || '').localeCompare(b.projectName || '');
      if (sortBy === 'status') return a.state.localeCompare(b.state);
      return a.port - b.port;
    });
  }, [ports, searchQuery, filterCategory, sortBy]);

  return {
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
  };
}
