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
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-[#15151A] border-l border-white/[0.12] shadow-2xl flex flex-col animate-slide-left select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Detalle de Puerto
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-zinc-300">
        {/* Port Hero & Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">
              {item.port}
            </span>
            <Badge status={item.state} size="md" />
          </div>
          <h2 className="text-base font-semibold text-zinc-100">
            {item.projectName || 'Servicio Local'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {item.framework || 'Node.js'} · {item.serverType || 'Development Server'}
          </p>
        </div>

        {/* URL Card */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="truncate pr-2">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">URL Local</div>
            <a
              href={item.url}
              onClick={(e) => {
                e.preventDefault();
                onOpenUrl(item.url);
              }}
              className="text-xs font-mono text-blue-400 hover:underline truncate block"
            >
              {item.url}
            </a>
          </div>
          <button
            onClick={() => onCopyUrl(item.url)}
            title="Copiar URL"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Process Telemetry */}
        <div className="space-y-3 pt-1 border-t border-white/[0.06]">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Telemetría de Proceso
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
              <div className="text-[10px] text-zinc-500">Proceso</div>
              <div className="font-mono font-medium text-zinc-200 mt-0.5 truncate">{item.processName}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
              <div className="text-[10px] text-zinc-500">PID</div>
              <div className="font-mono font-medium text-zinc-200 mt-0.5">{item.pid}</div>
            </div>
          </div>

          {item.startTime && (
            <div className="flex items-center justify-between text-xs py-1 px-2 bg-white/[0.02] rounded-lg">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Iniciado</span>
              </span>
              <span className="font-mono text-zinc-300">
                {item.startTime} {item.uptimeFormatted && `(${item.uptimeFormatted})`}
              </span>
            </div>
          )}

          {/* Working Directory */}
          {item.workingDirectory && (
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>Directorio de Trabajo</span>
                </span>
                <button
                  onClick={() => copyToClipboard(item.workingDirectory!)}
                  className="text-zinc-400 hover:text-white text-[10px] p-0.5 hover:bg-white/10 rounded"
                >
                  Copiar
                </button>
              </div>
              <div className="font-mono text-[11px] text-zinc-300 break-all">
                {item.workingDirectory}
              </div>
            </div>
          )}

          {/* Command Line */}
          {item.commandLine && (
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <TerminalSquare className="w-3 h-3" />
                  <span>Línea de Comandos</span>
                </span>
                <button
                  onClick={() => copyToClipboard(item.commandLine!)}
                  className="text-zinc-400 hover:text-white text-[10px] p-0.5 hover:bg-white/10 rounded"
                >
                  Copiar
                </button>
              </div>
              <div className="font-mono text-[11px] text-zinc-300 bg-black/40 p-2 rounded border border-white/5 break-all max-h-24 overflow-y-auto">
                {item.commandLine}
              </div>
            </div>
          )}

          {/* Safety Classification */}
          <div className="flex items-center justify-between py-1 px-2">
            <span className="text-zinc-500">Clasificación</span>
            <Badge safety={item.safety} />
          </div>
        </div>

        {/* Acciones de Apertura */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Acciones Rápidas
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenUrl(item.url)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all text-zinc-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Navegador</span>
            </button>

            <button
              onClick={() => onCopyUrl(item.url)}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all text-zinc-200"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copiar URL</span>
            </button>

            {item.workingDirectory && (
              <>
                <button
                  onClick={() => onOpenFolder(item.workingDirectory)}
                  className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all text-zinc-200"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>Carpeta</span>
                </button>

                <button
                  onClick={() => onOpenTerminal(item.workingDirectory)}
                  className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all text-zinc-200"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controles de Proceso */}
        {!isSystem && (
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Control de Proceso
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => (isPaused ? onResume(item.pid) : onPause(item.pid))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border active:scale-95 transition-all font-medium ${
                  isPaused
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>

              <button
                onClick={() => onRestart(item.pid)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-zinc-200 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Reiniciar</span>
              </button>

              <button
                onClick={() => onRequestStop(item)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 active:scale-95 transition-all font-medium"
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
