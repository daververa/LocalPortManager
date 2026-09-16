import React, { useState, useEffect } from 'react';
import { Clock, Trash2, CheckCircle2, AlertCircle, PauseCircle, PlayCircle, StopCircle } from 'lucide-react';
import { HistoryEvent, HistoryEventType } from '../../types/models';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!window.api) return;
    const items = await window.api.getHistory();
    setHistory(items);
  };

  const handleClear = async () => {
    if (!window.api) return;
    await window.api.clearHistory();
    setHistory([]);
  };

  const getEventIcon = (type: HistoryEventType) => {
    switch (type) {
      case 'detected':
      case 'started':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-amber-400" />;
      case 'resumed':
        return <PlayCircle className="w-4 h-4 text-blue-400" />;
      case 'stopped':
        return <StopCircle className="w-4 h-4 text-zinc-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none animate-fade-in text-theme-secondary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-theme-text">Historial de Actividad</h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Registro cronológico de servidores iniciados, puertos detectados y cambios de estado.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-button hover:bg-theme-button-hover text-theme-secondary hover:text-theme-text text-xs font-medium border border-theme-border transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-theme-muted" />
            <span>Limpiar Historial</span>
          </button>
        )}
      </div>

      {/* Timeline */}
      {history.length === 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-theme-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-theme-text">Sin eventos registrados</h3>
          <p className="text-xs text-theme-muted max-w-sm mx-auto mt-1">
            Los eventos de inicio, pausa y detección de puertos se guardarán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = isNaN(date.getTime())
              ? item.timestamp
              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={item.id}
                className="bg-theme-card border border-theme-border rounded-xl p-3 flex items-start gap-3 text-xs shadow-sm"
              >
                <div className="mt-0.5">{getEventIcon(item.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-text">{item.title}</span>
                    <span className="font-mono text-[11px] text-theme-muted">{timeStr}</span>
                  </div>
                  {item.details && (
                    <p className="text-theme-muted text-[11px] mt-0.5">{item.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
