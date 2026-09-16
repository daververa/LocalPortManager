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
    <div className="p-4 border-b border-white/[0.06] bg-white/[0.01] space-y-3 select-none">
      {/* Top bar: Summary statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <span>Puertos Locales</span>
            <span className="text-xs font-normal text-zinc-400">
              ({stats.activeCount} activos · {stats.totalListeners} listeners totales)
            </span>
          </h2>
        </div>

        {/* Small Stat Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 active-pulse" />
            <span className="font-semibold text-emerald-400">{stats.activeCount}</span>
            <span className="text-emerald-300/70 text-[11px]">Activos</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
            <span className="font-semibold text-blue-400">{stats.projectCount}</span>
            <span className="text-blue-300/70 text-[11px]">Proyectos</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">
            <span className="font-semibold">{stats.totalListeners}</span>
            <span className="text-zinc-400 text-[11px]">Puertos</span>
          </div>
        </div>
      </div>

      {/* Middle row: Search & Sort */}
      <div className="flex items-center gap-3">
        {/* Instant Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por puerto (ej. 3000), proyecto, proceso, PID, framework..."
            className="w-full pl-9 pr-8 py-1.5 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-white/10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-xs text-zinc-300">
          <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="port" className="bg-zinc-900 text-zinc-200">Puerto</option>
            <option value="name" className="bg-zinc-900 text-zinc-200">Proyecto</option>
            <option value="status" className="bg-zinc-900 text-zinc-200">Estado</option>
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
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-transparent'
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
