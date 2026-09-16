import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import { StorageService } from './services/storage';
import { PortScanner } from './services/port-scanner';
import { ProcessManager, ProcessDetails } from './services/process-manager';
import { ProjectDetector } from './services/project-detector';
import { ProcessController } from './services/process-controller';
import { TrayService } from './services/tray';
import { PortItem, PortStatus } from '../src/types/models';

const isDev = process.env.NODE_ENV === 'development';

class LocalPortApplication {
  private mainWindow: BrowserWindow | null = null;
  private storage = new StorageService();
  private portScanner = new PortScanner();
  private processManager = new ProcessManager();
  private projectDetector = new ProjectDetector();
  private processController = new ProcessController();
  private trayService = new TrayService();

  private cachedPorts: PortItem[] = [];
  private processCache = new Map<number, ProcessDetails>();
  private previousActivePortKeys = new Set<string>();
  private pollTimer: NodeJS.Timeout | null = null;
  private isScanning = false;
  private pausedPids = new Set<number>();

  async init() {
    await app.whenReady();

    this.createWindow();
    this.registerIpcHandlers();
    this.initTrayAndShortcuts();
    this.startAdaptivePolling();

    // Start with Windows setting
    const settings = this.storage.getSettings();
    try {
      app.setLoginItemSettings({
        openAtLogin: settings.startWithWindows,
      });
    } catch {}
  }

  private createWindow() {
    const settings = this.storage.getSettings();
    const isWidget = settings.windowMode === 'widget';

    const width = isWidget ? 420 : 1040;
    const height = isWidget ? 600 : 740;

    const appDir = app.getAppPath();
    const iconPath = path.join(appDir, 'assets', 'icon.png');

    this.mainWindow = new BrowserWindow({
      width,
      height,
      minWidth: 380,
      minHeight: 520,
      frame: false,
      transparent: false,
      backgroundColor: '#0F0F12',
      hasShadow: true,
      show: true,
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      alwaysOnTop: settings.alwaysOnTop,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    const candidatePaths = [
      path.join(appDir, 'dist', 'index.html'),
      path.resolve(__dirname, '../../dist/index.html'),
      path.resolve(__dirname, '../dist/index.html'),
    ];
    const targetHtml = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173').catch(err => {
        console.warn('[Main] Dev server not reachable at localhost:5173, loading local bundle:', err.message);
        this.mainWindow?.loadFile(targetHtml);
      });
    } else {
      console.log('[Main] Loading production UI from:', targetHtml);
      this.mainWindow.loadFile(targetHtml).catch(err => {
        console.error('[Main] Failed to load production index.html:', targetHtml, err);
      });
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });

    this.mainWindow.on('close', (event) => {
      if (!(app as any).isQuitting && this.storage.getSettings().minimizeToTray) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('focus', () => {
      // Faster polling when focused
      this.restartPolling(2000);
    });

    this.mainWindow.on('blur', () => {
      // Slower polling when backgrounded
      this.restartPolling(4500);
    });
  }

  private initTrayAndShortcuts() {
    if (!this.mainWindow) return;

    this.trayService.init(this.mainWindow, {
      onScan: () => this.runScanCycle(true),
      onSettings: () => {
        this.mainWindow?.webContents.send('navigate:view', 'settings');
      },
      onToggleMode: () => {
        const currentMode = this.storage.getSettings().windowMode;
        this.setWindowMode(currentMode === 'widget' ? 'full' : 'widget');
      },
    });

    const settings = this.storage.getSettings();
    if (settings.globalShortcut) {
      this.trayService.registerShortcut(settings.globalShortcut, () => {
        this.trayService.toggleWindow();
      });
    }
  }

  private startAdaptivePolling() {
    const settings = this.storage.getSettings();
    this.restartPolling(settings.refreshIntervalMs || 2500);
    // Initial immediate scan
    setTimeout(() => this.runScanCycle(), 500);
  }

  private restartPolling(intervalMs: number) {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.runScanCycle(), intervalMs);
  }

  public async runScanCycle(forceDispatch: boolean = false): Promise<PortItem[]> {
    if (this.isScanning) return this.cachedPorts;
    this.isScanning = true;

    try {
      const rawListeners = await this.portScanner.scan();
      const currentPids = new Set(rawListeners.map(l => l.pid).filter(p => p > 0));

      // 1. Evict terminated processes from cache
      for (const cachedPid of this.processCache.keys()) {
        if (!currentPids.has(cachedPid)) {
          this.processCache.delete(cachedPid);
        }
      }

      // 2. Query only new PIDs not in cache (drastically saves CPU)
      const newPids = Array.from(currentPids).filter(p => !this.processCache.has(p));
      if (newPids.length > 0) {
        const newProcsMap = await this.processManager.getProcessesInfo(newPids);
        for (const [pid, details] of newProcsMap.entries()) {
          this.processCache.set(pid, details);
        }
      }

      const favorites = new Set(this.storage.getFavorites());
      const items: PortItem[] = [];
      const currentKeys = new Set<string>();

      for (const listener of rawListeners) {
        const proc = this.processCache.get(listener.pid);
        const pName = proc ? proc.name : 'Unknown';
        const cmd = proc ? proc.commandLine : undefined;
        const cwd = proc ? proc.workingDirectory : undefined;

        const identity = this.projectDetector.identify(
          listener.port,
          pName,
          cmd,
          cwd
        );

        let state: PortStatus = 'active';
        if (this.pausedPids.has(listener.pid)) {
          state = 'paused';
        }

        const isFav = favorites.has(listener.port);
        const url = `http://localhost:${listener.port}`;
        const key = `${listener.port}:${listener.pid}`;
        currentKeys.add(key);

        // Check for new port notification
        if (!this.previousActivePortKeys.has(key) && this.previousActivePortKeys.size > 0) {
          this.handleNewPortDetected(listener.port, identity.projectName, url);
        }

        items.push({
          id: `port-${listener.port}-${listener.pid}`,
          port: listener.port,
          protocol: listener.protocol,
          localAddress: listener.localAddress,
          state,
          pid: listener.pid,
          processName: pName,
          executablePath: proc?.executablePath,
          commandLine: cmd,
          workingDirectory: cwd,
          projectName: identity.projectName,
          framework: identity.framework,
          serverType: identity.serverType,
          startTime: proc?.creationDate,
          uptimeFormatted: proc?.uptimeFormatted,
          safety: proc ? proc.safety : 'safe',
          isFavorite: isFav,
          url,
        });
      }

      // Detect closed ports
      for (const oldKey of this.previousActivePortKeys) {
        if (!currentKeys.has(oldKey)) {
          const oldPort = parseInt(oldKey.split(':')[0], 10);
          this.storage.addHistoryEvent({
            type: 'stopped',
            title: `Puerto ${oldPort} liberado`,
            details: 'El servidor o proceso finalizó su ejecución.',
            port: oldPort,
          });
        }
      }

      this.previousActivePortKeys = currentKeys;
      this.cachedPorts = items;

      // Update Tray tooltip & menu
      this.trayService.updateContextMenu(items.filter(i => i.state === 'active').length);

      // Push to Renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('ports:updated', items);
      }

      return items;
    } catch (err) {
      console.error('[Main] Scan cycle error:', err);
      return this.cachedPorts;
    } finally {
      this.isScanning = false;
    }
  }

  private handleNewPortDetected(port: number, projectName: string, url: string) {
    this.storage.addHistoryEvent({
      type: 'detected',
      title: `Servidor detectado en puerto ${port}`,
      details: `${projectName} está disponible en ${url}`,
      port,
    });

    const settings = this.storage.getSettings();
    if (settings.notificationsEnabled && Notification.isSupported()) {
      new Notification({
        title: '🟢 Nuevo Servidor Detectado',
        body: `${projectName} activo en localhost:${port}`,
        silent: false,
      }).show();
    }
  }

  private setWindowMode(mode: 'widget' | 'full') {
    if (!this.mainWindow) return;
    this.storage.saveSettings({ windowMode: mode });

    if (mode === 'widget') {
      this.mainWindow.setSize(420, 600, true);
    } else {
      this.mainWindow.setSize(1040, 740, true);
    }
    this.mainWindow.webContents.send('window:mode-changed', mode);
  }

  private registerIpcHandlers() {
    // Ports
    ipcMain.handle('ports:get', async () => {
      if (this.cachedPorts.length === 0) {
        return await this.runScanCycle();
      }
      return this.cachedPorts;
    });

    ipcMain.handle('ports:scan', async () => {
      return await this.runScanCycle(true);
    });

    ipcMain.handle('ports:toggle-favorite', async (_, port: number) => {
      const isFav = this.storage.toggleFavorite(port);
      await this.runScanCycle(true);
      return isFav;
    });

    ipcMain.handle('ports:open-url', async (_, url: string) => {
      await this.processController.openUrl(url);
    });

    ipcMain.handle('ports:open-folder', async (_, path: string) => {
      return await this.processController.openFolder(path);
    });

    ipcMain.handle('ports:open-terminal', async (_, path: string) => {
      return await this.processController.openTerminal(path);
    });

    ipcMain.handle('ports:copy-url', async (_, url: string) => {
      this.processController.copyUrl(url);
    });

    ipcMain.handle('ports:pause', async (_, pid: number) => {
      const res = await this.processController.pause(pid);
      if (res.success) {
        this.pausedPids.add(pid);
        this.storage.addHistoryEvent({
          type: 'paused',
          title: `Proceso PID ${pid} pausado`,
          details: 'Todos los hilos del proceso fueron suspendidos mediante NtSuspendProcess.',
          pid,
        });
        await this.runScanCycle(true);
      }
      return res;
    });

    ipcMain.handle('ports:resume', async (_, pid: number) => {
      const res = await this.processController.resume(pid);
      if (res.success) {
        this.pausedPids.delete(pid);
        this.storage.addHistoryEvent({
          type: 'resumed',
          title: `Proceso PID ${pid} reanudado`,
          details: 'Hilos del proceso reactivados con NtResumeProcess.',
          pid,
        });
        await this.runScanCycle(true);
      }
      return res;
    });

    ipcMain.handle('ports:stop', async (_, pid: number, force?: boolean) => {
      const res = await this.processController.stop(pid, force);
      if (res.success) {
        this.pausedPids.delete(pid);
        this.storage.addHistoryEvent({
          type: 'stopped',
          title: `Proceso PID ${pid} terminado`,
          details: force ? 'Detención forzada con taskkill /F /T.' : 'Detención ordenada de árbol de procesos.',
          pid,
        });
        // Delay scan to allow socket release
        setTimeout(() => this.runScanCycle(true), 800);
      }
      return res;
    });

    ipcMain.handle('ports:restart', async (_, pid: number) => {
      const current = this.cachedPorts.find(p => p.pid === pid);
      if (!current) {
        return { success: false, error: 'No se encontró el proceso en memoria.' };
      }
      const res = await this.processController.restart(pid, current.commandLine, current.workingDirectory);
      if (res.success) {
        this.storage.addHistoryEvent({
          type: 'started',
          title: `Reinicio de ${current.projectName}`,
          details: `Comando reejecutado: ${current.commandLine || 'N/A'}`,
          port: current.port,
          pid,
        });
        setTimeout(() => this.runScanCycle(true), 2000);
      }
      return res;
    });

    // Projects
    ipcMain.handle('projects:get', async () => {
      return this.storage.getProjects();
    });

    ipcMain.handle('projects:save', async (_, project) => {
      return this.storage.saveProject(project);
    });

    ipcMain.handle('projects:delete', async (_, id: string) => {
      return this.storage.deleteProject(id);
    });

    ipcMain.handle('projects:start', async (_, id: string) => {
      const projects = this.storage.getProjects();
      const proj = projects.find(p => p.id === id);
      if (!proj) return { success: false, error: 'Proyecto no encontrado.' };

      const res = this.processController.startProject(proj.id, proj.folder, proj.command, (line) => {
        this.mainWindow?.webContents.send('project:output', { projectId: proj.id, text: line });
      });

      if (res.success) {
        this.storage.addHistoryEvent({
          type: 'started',
          title: `Proyecto iniciado: ${proj.name}`,
          details: `Comando: ${proj.command} en ${proj.folder}`,
        });
        setTimeout(() => this.runScanCycle(true), 1500);
      }

      return res;
    });

    ipcMain.handle('projects:stop', async (_, id: string) => {
      const res = this.processController.stopProject(id);
      setTimeout(() => this.runScanCycle(true), 800);
      return res;
    });

    // History
    ipcMain.handle('history:get', async () => {
      return this.storage.getHistory();
    });

    ipcMain.handle('history:clear', async () => {
      return this.storage.clearHistory();
    });

    // Settings
    ipcMain.handle('settings:get', async () => {
      return this.storage.getSettings();
    });

    ipcMain.handle('settings:save', async (_, settings) => {
      const updated = this.storage.saveSettings(settings);
      if (settings.alwaysOnTop !== undefined && this.mainWindow) {
        this.mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
      }
      if (settings.startWithWindows !== undefined) {
        try {
          app.setLoginItemSettings({ openAtLogin: settings.startWithWindows });
        } catch {}
      }
      if (settings.globalShortcut) {
        this.trayService.registerShortcut(settings.globalShortcut, () => {
          this.trayService.toggleWindow();
        });
      }
      return updated;
    });

    // Window controls
    ipcMain.handle('window:minimize', async () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:close', async () => {
      const settings = this.storage.getSettings();
      if (settings.minimizeToTray) {
        this.mainWindow?.hide();
      } else {
        (app as any).isQuitting = true;
        app.quit();
      }
    });

    ipcMain.handle('window:set-mode', async (_, mode: 'widget' | 'full') => {
      this.setWindowMode(mode);
    });

    ipcMain.handle('window:toggle-always-on-top', async () => {
      if (!this.mainWindow) return false;
      const isTop = !this.mainWindow.isAlwaysOnTop();
      this.mainWindow.setAlwaysOnTop(isTop);
      this.storage.saveSettings({ alwaysOnTop: isTop });
      return isTop;
    });
  }
}

const localPortApp = new LocalPortApplication();
localPortApp.init();

app.on('window-all-closed', () => {
  // Keep alive in tray unless quitting explicitly
  if (process.platform !== 'darwin') {
    // on Windows, tray keeps it active
  }
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
});
