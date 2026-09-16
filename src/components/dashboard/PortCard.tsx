import React from 'react';
import { ExternalLink, Play, Pause, Square, Star, Copy, Folder, Terminal } from 'lucide-react';
import { PortItem } from '../../types/models';
import { Badge } from '../common/Badge';

interface PortCardProps {
  item: PortItem;
  onSelect: (item: PortItem) => void;
  onToggleFavorite: (port: number) => void;
  onOpenUrl: (url: string) => void;
  onCopyUrl: (url: string) => void;
  onPause: (pid: number) => void;
  onResume: (pid: number) => void;
  onRequestStop: (item: PortItem) => void;
  onOpenFolder?: (path: string) => void;
  onOpenTerminal?: (path: string) => void;
}

export const PortCard: React.FC<PortCardProps> = ({
  item,
  onSelect,
  onToggleFavorite,
  onOpenUrl,
  onCopyUrl,
  onPause,
  onResume,
  onRequestStop,
  onOpenFolder,
  onOpenTerminal,
}) => {
  const isPaused = item.state === 'paused';
  const isSystem = item.safety === 'system';

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-theme-card hover:bg-theme-card-hover border border-theme-border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Top row: Port Hero, Status, Favorite */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xl font-bold tracking-tight text-theme-text group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
            {item.port}
          </span>
          <Badge status={item.state} />
          {item.safety !== 'safe' && <Badge safety={item.safety} />}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.port);
          }}
          title={item.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          className={`p-1 rounded-lg transition-colors ${
            item.isFavorite
              ? 'text-amber-500 dark:text-amber-400 hover:text-amber-400'
              : 'text-theme-muted hover:text-theme-text opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Middle row: Project name & framework */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-theme-text truncate flex items-center gap-2">
          <span>{item.projectName || 'Proyecto desconocido'}</span>
        </h3>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-theme-secondary">
          <span className="text-theme-text font-medium">{item.framework || 'Node.js / Local'}</span>
          <span>·</span>
          <span className="font-mono text-[11px] text-theme-secondary">{item.processName}</span>
          <span>·</span>
          <span className="font-mono text-[11px] text-theme-muted">PID: {item.pid}</span>
        </div>
      </div>

      {/* Directory or URL preview */}
      <div className="mb-4 text-xs text-theme-secondary">
        {item.workingDirectory ? (
          <div className="flex items-center gap-1.5 text-[11px] text-theme-secondary truncate bg-theme-pill px-2 py-1 rounded-lg border border-theme-border">
            <Folder className="w-3 h-3 text-theme-muted shrink-0" />
            <span className="truncate">{item.workingDirectory}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-theme-secondary truncate bg-theme-pill px-2 py-1 rounded-lg border border-theme-border">
            <span className="font-mono truncate">{item.url}</span>
          </div>
        )}
      </div>

      {/* Footer: Duration & Real Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-theme-border" onClick={e => e.stopPropagation()}>
        <div className="text-[11px] text-theme-muted">
          {item.uptimeFormatted ? `Activo: ${item.uptimeFormatted}` : (item.startTime ? `Inicio: ${item.startTime}` : '')}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Open in browser */}
          <button
            onClick={() => onOpenUrl(item.url)}
            title="Abrir en navegador"
            className="p-1.5 rounded-lg bg-theme-button hover:bg-theme-button-hover text-theme-secondary hover:text-theme-text border border-theme-border transition-colors active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Copy URL */}
          <button
            onClick={() => onCopyUrl(item.url)}
            title="Copiar URL"
            className="p-1.5 rounded-lg bg-theme-button hover:bg-theme-button-hover text-theme-secondary hover:text-theme-text border border-theme-border transition-colors active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Pause / Resume */}
          {!isSystem && (
            <button
              onClick={() => (isPaused ? onResume(item.pid) : onPause(item.pid))}
              title={isPaused ? 'Reanudar proceso' : 'Pausar proceso'}
              className={`p-1.5 rounded-lg active:scale-95 transition-all ${
                isPaused
                  ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'bg-theme-button hover:bg-theme-button-hover text-theme-secondary hover:text-theme-text border border-theme-border'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Stop */}
          {!isSystem && (
            <button
              onClick={() => onRequestStop(item)}
              title="Detener servidor"
              className="p-1.5 rounded-lg bg-theme-button hover:bg-rose-500/10 text-theme-secondary hover:text-rose-500 border border-theme-border transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
