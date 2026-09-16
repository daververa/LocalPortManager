import React from 'react';
import {
  Activity,
  Radio,
  FolderGit2,
  Cpu,
  Star,
  Clock,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { SystemStats } from '../../types/models';

export type ActiveNavTab = 'general' | 'ports' | 'projects' | 'processes' | 'favorites' | 'history' | 'settings';

interface SidebarProps {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  stats: SystemStats;
  theme: 'system' | 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'general' as ActiveNavTab, label: 'General', icon: Activity },
    { id: 'ports' as ActiveNavTab, label: 'Puertos', icon: Radio, count: stats.activeCount },
    { id: 'projects' as ActiveNavTab, label: 'Proyectos', icon: FolderGit2, count: stats.projectCount },
    { id: 'processes' as ActiveNavTab, label: 'Procesos', icon: Cpu },
    { id: 'favorites' as ActiveNavTab, label: 'Favoritos', icon: Star },
    { id: 'history' as ActiveNavTab, label: 'Historial', icon: Clock },
    { id: 'settings' as ActiveNavTab, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-52 h-full bg-theme-sidebar border-r border-theme-border flex flex-col justify-between p-3 select-none transition-colors duration-200">
      {/* Navigation list */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
          Local Development
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-theme-active-item text-theme-text shadow-sm border border-theme-border font-semibold'
                  : 'text-theme-secondary hover:text-theme-text hover:bg-theme-button'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-theme-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                    isActive ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'bg-theme-pill text-theme-secondary'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Theme toggle */}
      <div className="pt-3 border-t border-theme-border">
        <div className="flex items-center justify-between px-2 text-xs text-theme-secondary">
          <span className="text-[11px] font-medium">Tema</span>
          <button
            onClick={onToggleTheme}
            title={`Cambiar tema (actual: ${theme})`}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-theme-button hover:bg-theme-button-hover text-theme-text border border-theme-border transition-all text-xs font-medium shadow-sm active:scale-95"
          >
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
            {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-theme-muted" />}
            <span className="capitalize text-[11px]">
              {theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Auto'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
