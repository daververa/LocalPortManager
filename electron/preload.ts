import { contextBridge, ipcRenderer } from 'electron';
import { PortItem, Project, HistoryEvent, AppSettings } from '../src/types/models';

export interface LocalPortApi {
  getPorts: () => Promise<PortItem[]>;
  scanPorts: () => Promise<PortItem[]>;
  toggleFavorite: (port: number) => Promise<boolean>;
  openUrl: (url: string) => Promise<void>;
  openFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  openTerminal: (path: string) => Promise<{ success: boolean; error?: string }>;
  copyUrl: (url: string) => Promise<void>;
  pauseProcess: (pid: number) => Promise<{ success: boolean; error?: string }>;
  resumeProcess: (pid: number) => Promise<{ success: boolean; error?: string }>;
  stopProcess: (pid: number, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  restartProcess: (pid: number) => Promise<{ success: boolean; error?: string }>;

  getProjects: () => Promise<Project[]>;
  saveProject: (project: Project) => Promise<Project>;
  deleteProject: (id: string) => Promise<boolean>;
  startProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  stopProject: (id: string) => Promise<{ success: boolean; error?: string }>;

  getHistory: () => Promise<HistoryEvent[]>;
  clearHistory: () => Promise<boolean>;

  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  setWindowMode: (mode: 'widget' | 'full') => Promise<void>;
  toggleAlwaysOnTop: () => Promise<boolean>;

  onPortsUpdated: (callback: (ports: PortItem[]) => void) => () => void;
  onProjectOutput: (callback: (data: { projectId: string; text: string }) => void) => () => void;
  onNavigate: (callback: (view: string) => void) => () => void;
}

const api: LocalPortApi = {
  getPorts: () => ipcRenderer.invoke('ports:get'),
  scanPorts: () => ipcRenderer.invoke('ports:scan'),
  toggleFavorite: (port) => ipcRenderer.invoke('ports:toggle-favorite', port),
  openUrl: (url) => ipcRenderer.invoke('ports:open-url', url),
  openFolder: (path) => ipcRenderer.invoke('ports:open-folder', path),
  openTerminal: (path) => ipcRenderer.invoke('ports:open-terminal', path),
  copyUrl: (url) => ipcRenderer.invoke('ports:copy-url', url),
  pauseProcess: (pid) => ipcRenderer.invoke('ports:pause', pid),
  resumeProcess: (pid) => ipcRenderer.invoke('ports:resume', pid),
  stopProcess: (pid, force) => ipcRenderer.invoke('ports:stop', pid, force),
  restartProcess: (pid) => ipcRenderer.invoke('ports:restart', pid),

  getProjects: () => ipcRenderer.invoke('projects:get'),
  saveProject: (project) => ipcRenderer.invoke('projects:save', project),
  deleteProject: (id) => ipcRenderer.invoke('projects:delete', id),
  startProject: (id) => ipcRenderer.invoke('projects:start', id),
  stopProject: (id) => ipcRenderer.invoke('projects:stop', id),

  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  setWindowMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),

  onPortsUpdated: (callback) => {
    const listener = (_: any, ports: PortItem[]) => callback(ports);
    ipcRenderer.on('ports:updated', listener);
    return () => ipcRenderer.removeListener('ports:updated', listener);
  },

  onProjectOutput: (callback) => {
    const listener = (_: any, data: { projectId: string; text: string }) => callback(data);
    ipcRenderer.on('project:output', listener);
    return () => ipcRenderer.removeListener('project:output', listener);
  },

  onNavigate: (callback) => {
    const listener = (_: any, view: string) => callback(view);
    ipcRenderer.on('navigate:view', listener);
    return () => ipcRenderer.removeListener('navigate:view', listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
