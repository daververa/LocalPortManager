import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { SystemStats } from '../../types/models';
import { FilterCategory, SortOption } from '../../hooks/usePorts';

interface HeaderProps {
  stats: SystemStats;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterCategory: FilterCategory;
  onFilterChange: (cat: FilterCategory) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterChange,
  sortBy,
  onSortChange,
}) => {
  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'paused', label: 'Pausados' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'docker', label: 'Docker' },
    { id: 'database', label: 'Bases de Datos' },
    { id: 'favorites', label: '★ Favoritos' },
  ];

  return (
    <div className="p-4 border-b border-theme-border bg-theme-bg/50 space-y-3 select-none transition-colors duration-200">
      {/* Top bar: Summary statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-theme-text flex items-center gap-2">
            <span>Puertos Locales</span>
            <span className="text-xs font-normal text-theme-secondary">
              ({stats.activeCount} activos · {stats.totalListeners} listeners totales)
            </span>
          </h2>
        </div>

        {/* Small Stat Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 active-pulse" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.activeCount}</span>
            <span className="text-emerald-700/70 dark:text-emerald-300/70 text-[11px]">Activos</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.projectCount}</span>
            <span className="text-blue-700/70 dark:text-blue-300/70 text-[11px]">Proyectos</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-button border border-theme-border text-xs text-theme-text">
            <span className="font-semibold">{stats.totalListeners}</span>
            <span className="text-theme-secondary text-[11px]">Puertos</span>
          </div>
        </div>
      </div>

      {/* Middle row: Search & Sort */}
      <div className="flex items-center gap-3">
        {/* Instant Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por puerto (ej. 3000), proyecto, proceso, PID, framework..."
            className="w-full pl-9 pr-8 py-1.5 bg-theme-input hover:bg-theme-button focus:bg-theme-card border border-theme-border rounded-xl text-xs text-theme-text placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text p-0.5 rounded-md hover:bg-theme-button"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 bg-theme-button border border-theme-border rounded-xl px-2 py-1 text-xs text-theme-text">
          <ArrowUpDown className="w-3 h-3 text-theme-muted" />
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="bg-transparent border-none text-xs text-theme-text focus:outline-none cursor-pointer"
          >
            <option value="port" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Puerto</option>
            <option value="name" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Proyecto</option>
            <option value="status" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Estado</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
        {categories.map(cat => {
          const isActive = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-500 text-white shadow-sm font-semibold'
                  : 'bg-theme-button hover:bg-theme-button-hover text-theme-secondary hover:text-theme-text border border-theme-border'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
