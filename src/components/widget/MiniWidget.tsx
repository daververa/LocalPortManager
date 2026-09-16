import React from 'react';
import { ExternalLink, Play, Pause, Square, ArrowRight, Star, RefreshCw } from 'lucide-react';
import { PortItem } from '../../types/models';
import { Badge } from '../common/Badge';

interface MiniWidgetProps {
  ports: PortItem[];
  activeCount: number;
  scanning: boolean;
  onScan: () => void;
  onSelect: (item: PortItem) => void;
  onExpandToFull: () => void;
  onOpenUrl: (url: string) => void;
  onPause: (pid: number) => void;
  onResume: (pid: number) => void;
  onRequestStop: (item: PortItem) => void;
}

export const MiniWidget: React.FC<MiniWidgetProps> = ({
  ports,
  activeCount,
  scanning,
  onScan,
  onSelect,
  onExpandToFull,
  onOpenUrl,
  onPause,
  onResume,
  onRequestStop,
}) => {
  const activePorts = ports.filter(p => p.state === 'active' || p.state === 'paused');

  return (
    <div className="flex-1 flex flex-col justify-between p-4 select-none overflow-hidden bg-theme-bg text-theme-text transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-theme-border">
        <div>
          <div className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
            Local Development
          </div>
          <div className="text-sm font-semibold text-theme-text mt-0.5 flex items-center gap-2">
            <span>{activeCount} {activeCount === 1 ? 'servidor activo' : 'servidores activos'}</span>
          </div>
        </div>

        <button
          onClick={onScan}
          disabled={scanning}
          title="Escanear puertos"
          className="p-1.5 rounded-xl bg-theme-button hover:bg-theme-button-hover text-theme-text border border-theme-border transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-500' : ''}`} />
        </button>
      </div>

      {/* List of active server cards */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
        {activePorts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-2xl bg-theme-button border border-theme-border flex items-center justify-center mb-3">
              <span className="w-2 h-2 rounded-full bg-theme-muted" />
            </div>
            <p className="text-xs font-medium text-theme-text">Todo tranquilo.</p>
            <p className="text-[11px] text-theme-muted mt-0.5">No hay servidores corriendo.</p>
          </div>
        ) : (
          activePorts.map(item => {
            const isPaused = item.state === 'paused';
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className="group bg-theme-card hover:bg-theme-card-hover border border-theme-border rounded-2xl p-3 transition-all cursor-pointer shadow-sm"
              >
                {/* Top: Port & Status */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-theme-text">
                      {item.port}
                    </span>
                    <Badge status={item.state} />
                  </div>
                  {item.isFavorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                </div>

                {/* Middle: Project & Framework */}
                <div className="mb-2">
                  <h4 className="text-xs font-semibold text-theme-text truncate">
                    {item.projectName || 'Proyecto'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-theme-secondary mt-0.5">
                    <span>{item.framework || 'Node.js'}</span>
                    <span>·</span>
                    <span className="font-mono text-theme-muted truncate">{item.processName}</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-theme-border"
                  onClick={e => e.stopPropagation()}
                >
                  <a
                    href={item.url}
                    onClick={e => {
                      e.preventDefault();
                      onOpenUrl(item.url);
                    }}
                    className="font-mono text-[11px] text-blue-500 dark:text-blue-400 hover:underline truncate max-w-[140px]"
                  >
                    localhost:{item.port}
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenUrl(item.url)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-theme-button hover:bg-theme-button-hover text-theme-text border border-theme-border active:scale-95 transition-all"
                    >
                      Abrir
                    </button>

                    {item.safety !== 'system' && (
                      <>
                        <button
                          onClick={() => (isPaused ? onResume(item.pid) : onPause(item.pid))}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium active:scale-95 transition-all ${
                            isPaused
                              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300 hover:bg-amber-500/25'
                              : 'bg-theme-button hover:bg-theme-button-hover text-theme-text border border-theme-border'
                          }`}
                        >
                          {isPaused ? 'Reanudar' : 'Pausar'}
                        </button>

                        <button
                          onClick={() => onRequestStop(item)}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 active:scale-95 transition-all border border-rose-500/20"
                        >
                          Apagar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action: Expand */}
      <div className="pt-2 border-t border-theme-border">
        <button
          onClick={onExpandToFull}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-theme-button hover:bg-theme-button-hover text-theme-text border border-theme-border text-xs font-medium active:scale-95 transition-all"
        >
          <span>Ver todos los servicios ({ports.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
