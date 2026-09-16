import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { Project, HistoryEvent, AppSettings } from '../../src/types/models';

interface StorageData {
  favorites: number[];
  projects: Project[];
  history: HistoryEvent[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  windowMode: 'full',
  alwaysOnTop: false,
  startWithWindows: false,
  minimizeToTray: true,
  notificationsEnabled: true,
  refreshIntervalMs: 2500,
  globalShortcut: 'CommandOrControl+Shift+L',
  theme: 'system',
};

export class StorageService {
  private filePath: string;
  private data: StorageData;

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || '.', 'LocalPortManager');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.filePath = path.join(userDataPath, 'config.json');
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    } catch (e) {
      console.error('[Storage] Failed to read config file, initializing defaults:', e);
    }

    return {
      favorites: [],
      projects: [],
      history: [],
      settings: DEFAULT_SETTINGS,
    };
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Storage] Failed to save config file:', e);
    }
  }

  // Favorites
  getFavorites(): number[] {
    return this.data.favorites;
  }

  toggleFavorite(port: number): boolean {
    const index = this.data.favorites.indexOf(port);
    let isFav = false;
    if (index >= 0) {
      this.data.favorites.splice(index, 1);
      isFav = false;
    } else {
      this.data.favorites.push(port);
      isFav = true;
    }
    this.saveData();
    return isFav;
  }

  // Projects
  getProjects(): Project[] {
    return this.data.projects;
  }

  saveProject(project: Project): Project {
    const existingIndex = this.data.projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      this.data.projects[existingIndex] = project;
    } else {
      this.data.projects.push(project);
    }
    this.saveData();
    return project;
  }

  deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.saveData();
    return this.data.projects.length < initialLen;
  }

  // History
  getHistory(): HistoryEvent[] {
    return this.data.history;
  }

  addHistoryEvent(event: Omit<HistoryEvent, 'id' | 'timestamp'>): HistoryEvent {
    const newEvent: HistoryEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.history.unshift(newEvent);
    if (this.data.history.length > 200) {
      this.data.history = this.data.history.slice(0, 200);
    }
    this.saveData();
    return newEvent;
  }

  clearHistory(): boolean {
    this.data.history = [];
    this.saveData();
    return true;
  }

  // Settings
  getSettings(): AppSettings {
    return this.data.settings;
  }

  saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    return this.data.settings;
  }
}
