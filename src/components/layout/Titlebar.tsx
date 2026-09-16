import React from 'react';
import { Pin, RefreshCw, LayoutGrid, Layers, Minus, X, Maximize2 } from 'lucide-react';

interface TitlebarProps {
  windowMode: 'widget' | 'full';
  alwaysOnTop: boolean;
  activeCount: number;
  scanning: boolean;
  onToggleMode: () => void;
  onToggleAlwaysOnTop: () => void;
  onScan: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  windowMode,
  alwaysOnTop,
  activeCount,
  scanning,
  onToggleMode,
  onToggleAlwaysOnTop,
  onScan,
  onMinimize,
  onClose,
}) => {
  return (
    <header className="titlebar-drag h-10 w-full flex items-center justify-between px-3 bg-white/[0.03] border-b border-white/[0.06] select-none z-40 backdrop-blur-md">
      {/* Left: Apple traffic light buttons */}
      <div className="titlebar-no-drag flex items-center gap-2 group">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 flex items-center justify-center text-black/60 opacity-90 hover:opacity-100 transition-opacity"
        >
          <X className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={onMinimize}
          aria-label="Minimizar"
          className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 flex items-center justify-center text-black/60 opacity-90 hover:opacity-100 transition-opacity"
        >
          <Minus className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={onToggleMode}
          aria-label="Alternar modo"
          className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 flex items-center justify-center text-black/60 opacity-90 hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Center: Title & Live indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 active-pulse" />
        <span className="font-semibold tracking-wide text-zinc-100">LocalPort</span>
        <span className="text-zinc-500 font-normal">|</span>
        <span className="text-[11px] text-zinc-400">
          {activeCount} {activeCount === 1 ? 'activo' : 'activos'}
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          onClick={onScan}
          title="Escanear puertos ahora (Ctrl+R)"
          disabled={scanning}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        <button
          onClick={onToggleAlwaysOnTop}
          title={alwaysOnTop ? 'Desactivar Siempre Visible' : 'Mantener Siempre Visible'}
          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
            alwaysOnTop
              ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Pin className={`w-3.5 h-3.5 ${alwaysOnTop ? 'rotate-45' : ''}`} />
        </button>

        <button
          onClick={onToggleMode}
          title={windowMode === 'widget' ? 'Expandir a vista completa' : 'Modo Widget flotante'}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
        >
          {windowMode === 'widget' ? (
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-300" />
          ) : (
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
          )}
        </button>
      </div>
    </header>
  );
};
