import { PortItem, Project, HistoryEvent, AppSettings } from '../../src/types/models';

export interface IPCChannels {
  // Ports
  'ports:get': () => Promise<PortItem[]>;
  'ports:scan': () => Promise<PortItem[]>;
  'ports:toggle-favorite': (portOrId: number | string) => Promise<boolean>;
  'ports:open-url': (url: string) => Promise<void>;
  'ports:open-folder': (path: string) => Promise<{ success: boolean; error?: string }>;
  'ports:open-terminal': (path: string) => Promise<{ success: boolean; error?: string }>;
  'ports:pause': (pid: number) => Promise<{ success: boolean; error?: string }>;
  'ports:resume': (pid: number) => Promise<{ success: boolean; error?: string }>;
  'ports:stop': (pid: number, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  'ports:restart': (pid: number) => Promise<{ success: boolean; error?: string }>;

  // Projects
  'projects:get': () => Promise<Project[]>;
  'projects:save': (project: Project) => Promise<Project>;
  'projects:delete': (id: string) => Promise<boolean>;
  'projects:start': (id: string) => Promise<{ success: boolean; error?: string }>;
  'projects:stop': (id: string) => Promise<{ success: boolean; error?: string }>;

  // History
  'history:get': () => Promise<HistoryEvent[]>;
  'history:clear': () => Promise<boolean>;

  // Settings
  'settings:get': () => Promise<AppSettings>;
  'settings:save': (settings: Partial<AppSettings>) => Promise<AppSettings>;

  // Window Controls
  'window:minimize': () => Promise<void>;
  'window:close': () => Promise<void>;
  'window:set-mode': (mode: 'widget' | 'full') => Promise<void>;
  'window:toggle-always-on-top': () => Promise<boolean>;
}
