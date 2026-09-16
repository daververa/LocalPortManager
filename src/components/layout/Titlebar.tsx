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
    <header className="titlebar-drag h-10 w-full flex items-center justify-between px-3 bg-theme-titlebar border-b border-theme-border select-none z-40 backdrop-blur-md transition-colors duration-200">
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
      <div className="flex items-center gap-2 text-xs font-medium text-theme-secondary">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 active-pulse" />
        <span className="font-semibold tracking-wide text-theme-text">LocalPort</span>
        <span className="text-theme-muted font-normal">|</span>
        <span className="text-[11px] text-theme-muted">
          {activeCount} {activeCount === 1 ? 'activo' : 'activos'}
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          onClick={onScan}
          title="Escanear puertos ahora (Ctrl+R)"
          disabled={scanning}
          className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-text hover:bg-theme-button active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

        <button
          onClick={onToggleAlwaysOnTop}
          title={alwaysOnTop ? 'Desactivar Siempre Visible' : 'Mantener Siempre Visible'}
          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
            alwaysOnTop
              ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20'
              : 'text-theme-secondary hover:text-theme-text hover:bg-theme-button'
          }`}
        >
          <Pin className={`w-3.5 h-3.5 ${alwaysOnTop ? 'rotate-45' : ''}`} />
        </button>

        <button
          onClick={onToggleMode}
          title={windowMode === 'widget' ? 'Expandir a vista completa' : 'Modo Widget flotante'}
          className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-text hover:bg-theme-button active:scale-95 transition-all"
        >
          {windowMode === 'widget' ? (
            <LayoutGrid className="w-3.5 h-3.5 text-theme-text" />
          ) : (
            <Layers className="w-3.5 h-3.5 text-theme-text" />
          )}
        </button>
      </div>
    </header>
  );
};
