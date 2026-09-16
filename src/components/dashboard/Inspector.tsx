import React from 'react';
import {
  X,
  ExternalLink,
  Folder,
  Terminal,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Square,
  ShieldCheck,
  ShieldAlert,
  Clock,
  TerminalSquare,
  Hash,
} from 'lucide-react';
import { PortItem } from '../../types/models';
import { Badge } from '../common/Badge';

interface InspectorProps {
  item: PortItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
  onOpenFolder: (path?: string) => void;
  onOpenTerminal: (path?: string) => void;
  onCopyUrl: (url: string) => void;
  onPause: (pid: number) => void;
  onResume: (pid: number) => void;
  onRestart: (pid: number) => void;
  onRequestStop: (item: PortItem) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  item,
  isOpen,
  onClose,
  onOpenUrl,
  onOpenFolder,
  onOpenTerminal,
  onCopyUrl,
  onPause,
  onResume,
  onRestart,
  onRequestStop,
}) => {
  if (!isOpen || !item) return null;

  const isPaused = item.state === 'paused';
  const isSystem = item.safety === 'system';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-theme-drawer border-l border-theme-border shadow-2xl flex flex-col animate-slide-left select-none text-theme-text transition-colors duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-bg/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
            Detalle de Puerto
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-button transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-theme-secondary">
        {/* Port Hero & Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-3xl font-bold tracking-tight text-theme-text">
              {item.port}
            </span>
            <Badge status={item.state} size="md" />
          </div>
          <h2 className="text-base font-semibold text-theme-text">
            {item.projectName || 'Servicio Local'}
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            {item.framework || 'Node.js'} · {item.serverType || 'Development Server'}
          </p>
        </div>

        {/* URL Card */}
        <div className="bg-theme-pill border border-theme-border rounded-xl p-3 flex items-center justify-between">
          <div className="truncate pr-2">
            <div className="text-[10px] text-theme-muted uppercase font-semibold">URL Local</div>
            <a
              href={item.url}
              onClick={(e) => {
                e.preventDefault();
                onOpenUrl(item.url);
              }}
              className="text-xs font-mono text-blue-500 dark:text-blue-400 hover:underline truncate block"
            >
              {item.url}
            </a>
          </div>
          <button
            onClick={() => onCopyUrl(item.url)}
            title="Copiar URL"
            className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-text hover:bg-theme-button transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Process Telemetry */}
        <div className="space-y-3 pt-1 border-t border-theme-border">
          <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
            Telemetría de Proceso
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-theme-card border border-theme-border rounded-lg p-2.5">
              <div className="text-[10px] text-theme-muted">Proceso</div>
              <div className="font-mono font-medium text-theme-text mt-0.5 truncate">{item.processName}</div>
            </div>
            <div className="bg-theme-card border border-theme-border rounded-lg p-2.5">
              <div className="text-[10px] text-theme-muted">PID</div>
              <div className="font-mono font-medium text-theme-text mt-0.5">{item.pid}</div>
            </div>
          </div>

          {item.startTime && (
            <div className="flex items-center justify-between text-xs py-1 px-2 bg-theme-pill rounded-lg">
              <span className="text-theme-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Iniciado</span>
              </span>
              <span className="font-mono text-theme-secondary">
                {item.startTime} {item.uptimeFormatted && `(${item.uptimeFormatted})`}
              </span>
            </div>
          )}

          {/* Working Directory */}
          {item.workingDirectory && (
            <div className="bg-theme-card border border-theme-border rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-theme-muted flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>Directorio de Trabajo</span>
                </span>
                <button
                  onClick={() => copyToClipboard(item.workingDirectory!)}
                  className="text-theme-muted hover:text-theme-text text-[10px] p-0.5 hover:bg-theme-button rounded"
                >
                  Copiar
                </button>
              </div>
              <div className="font-mono text-[11px] text-theme-text break-all">
                {item.workingDirectory}
              </div>
            </div>
          )}

          {/* Command Line */}
          {item.commandLine && (
            <div className="bg-theme-card border border-theme-border rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-theme-muted flex items-center gap-1">
                  <TerminalSquare className="w-3 h-3" />
                  <span>Línea de Comandos</span>
                </span>
                <button
                  onClick={() => copyToClipboard(item.commandLine!)}
                  className="text-theme-muted hover:text-theme-text text-[10px] p-0.5 hover:bg-theme-button rounded"
                >
                  Copiar
                </button>
              </div>
              <div className="font-mono text-[11px] text-theme-text bg-theme-input p-2 rounded border border-theme-border break-all max-h-24 overflow-y-auto">
                {item.commandLine}
              </div>
            </div>
          )}

          {/* Safety Classification */}
          <div className="flex items-center justify-between py-1 px-2">
            <span className="text-theme-muted">Clasificación</span>
            <Badge safety={item.safety} />
          </div>
        </div>

        {/* Acciones de Apertura */}
        <div className="space-y-2 pt-2 border-t border-theme-border">
          <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
            Acciones Rápidas
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenUrl(item.url)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-theme-button hover:bg-theme-button-hover border border-theme-border active:scale-95 transition-all text-theme-text font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Navegador</span>
            </button>

            <button
              onClick={() => onCopyUrl(item.url)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-theme-button hover:bg-theme-button-hover border border-theme-border active:scale-95 transition-all text-theme-text font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-theme-muted" />
              <span>Copiar URL</span>
            </button>

            {item.workingDirectory && (
              <>
                <button
                  onClick={() => onOpenFolder(item.workingDirectory)}
                  className="flex items-center justify-center gap-2 p-2 rounded-xl bg-theme-button hover:bg-theme-button-hover border border-theme-border active:scale-95 transition-all text-theme-text font-medium"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Carpeta</span>
                </button>

                <button
                  onClick={() => onOpenTerminal(item.workingDirectory)}
                  className="flex items-center justify-center gap-2 p-2 rounded-xl bg-theme-button hover:bg-theme-button-hover border border-theme-border active:scale-95 transition-all text-theme-text font-medium"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Terminal</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controles de Proceso */}
        {!isSystem && (
          <div className="space-y-2 pt-2 border-t border-theme-border">
            <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
              Control de Proceso
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => (isPaused ? onResume(item.pid) : onPause(item.pid))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border active:scale-95 transition-all font-medium ${
                  isPaused
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-300 hover:bg-amber-500/20'
                    : 'bg-theme-button border-theme-border text-theme-text hover:bg-theme-button-hover'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>

              <button
                onClick={() => onRestart(item.pid)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-theme-button hover:bg-theme-button-hover border border-theme-border active:scale-95 transition-all text-theme-text font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Reiniciar</span>
              </button>

              <button
                onClick={() => onRequestStop(item)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 active:scale-95 transition-all font-medium"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Detener</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
