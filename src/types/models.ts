export type PortStatus = 'active' | 'paused' | 'stopped' | 'starting' | 'error';
export type ProcessSafety = 'safe' | 'caution' | 'system';

export interface PortItem {
  id: string;
  port: number;
  protocol: 'tcp' | 'udp';
  localAddress: string;
  state: PortStatus;
  pid: number;
  processName: string;
  executablePath?: string;
  commandLine?: string;
  workingDirectory?: string;
  projectName?: string;
  framework?: string;
  serverType?: string;
  startTime?: string;
  uptimeFormatted?: string;
  user?: string;
  safety: ProcessSafety;
  isFavorite?: boolean;
  url: string;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  folder: string;
  command: string;
  expectedPort?: number;
  framework?: string;
  icon?: string;
  color?: string;
  status: PortStatus;
  activePid?: number;
  activePort?: number;
}

export type HistoryEventType = 'started' | 'detected' | 'paused' | 'resumed' | 'stopped' | 'error';

export interface HistoryEvent {
  id: string;
  timestamp: string;
  type: HistoryEventType;
  title: string;
  details?: string;
  port?: number;
  pid?: number;
}

export interface AppSettings {
  windowMode: 'widget' | 'full';
  alwaysOnTop: boolean;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  refreshIntervalMs: number;
  globalShortcut: string;
  theme: 'system' | 'dark' | 'light';
}

export interface SystemStats {
  activeCount: number;
  projectCount: number;
  totalListeners: number;
  pausedCount: number;
}
