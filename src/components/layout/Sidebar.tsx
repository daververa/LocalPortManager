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
    <aside className="w-52 h-full bg-[#131317] border-r border-white/[0.08] flex flex-col justify-between p-3 select-none">
      {/* Navigation list */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                    isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-zinc-400'
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
      <div className="pt-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
          <span className="text-[11px]">Tema</span>
          <button
            onClick={onToggleTheme}
            title={`Tema actual: ${theme}`}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs"
          >
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
            {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="capitalize text-[10px]">{theme}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
