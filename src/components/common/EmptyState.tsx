import React from 'react';
import { Coffee, RefreshCw, FolderGit2 } from 'lucide-react';

interface EmptyStateProps {
  onScan: () => void;
  onViewProjects?: () => void;
  scanning?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onScan, onViewProjects, scanning }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-xl backdrop-blur-md">
        <Coffee className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-zinc-200 mb-1">Todo tranquilo.</h3>
      <p className="text-xs text-zinc-400 max-w-xs mb-6">
        No se detectaron servidores locales de desarrollo activos en este momento.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Escaneando...' : 'Escanear puertos'}</span>
        </button>

        {onViewProjects && (
          <button
            onClick={onViewProjects}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white active:scale-95 transition-all shadow-md"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Ver proyectos</span>
          </button>
        )}
      </div>
    </div>
  );
};
