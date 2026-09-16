import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { PortItem } from '../../types/models';

interface ConfirmModalProps {
  portItem: PortItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  portItem,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [force, setForce] = useState(false);

  if (!isOpen || !portItem) return null;

  const isCaution = portItem.safety === 'caution';
  const isSystem = portItem.safety === 'system';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-theme-modal border border-theme-border rounded-2xl shadow-2xl p-6 text-theme-text animate-slide-up">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-theme-border">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-base">
            {isCaution ? <ShieldAlert className="w-5 h-5 text-amber-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
            <span>¿Detener este servidor?</span>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text p-1 rounded-lg hover:bg-theme-button transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-theme-secondary">
          <p>
            Esto finalizará el proceso <strong className="text-theme-text font-mono">{portItem.processName}</strong> (PID: {portItem.pid}) asociado al puerto{' '}
            <strong className="text-theme-text font-mono">{portItem.port}</strong>.
          </p>

          {portItem.projectName && (
            <div className="bg-theme-pill border border-theme-border rounded-xl p-3 text-xs">
              <span className="text-theme-muted">Proyecto detectado:</span>{' '}
              <span className="font-medium text-theme-text">{portItem.projectName}</span>
              {portItem.framework && (
                <span className="ml-2 text-theme-muted">({portItem.framework})</span>
              )}
            </div>
          )}

          {isCaution && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 rounded-xl p-3 text-xs leading-relaxed">
              ⚠️ <strong>Atención:</strong> Este proceso corresponde a un servicio de infraestructura ({portItem.processName}). Detenerlo podría afectar a otras aplicaciones locales.
            </div>
          )}

          {isSystem && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl p-3 text-xs leading-relaxed">
              🚫 <strong>Proceso Crítico Protegido:</strong> Por seguridad del sistema operativo Windows, no es posible finalizar procesos del sistema.
            </div>
          )}

          {!isSystem && (
            <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-xs text-theme-muted hover:text-theme-text">
              <input
                type="checkbox"
                checked={force}
                onChange={e => setForce(e.target.checked)}
                className="w-4 h-4 rounded border-theme-border bg-theme-input text-rose-500 focus:ring-rose-400 focus:ring-offset-0"
              />
              <span>Forzar detención inmediata (usar solo si no responde)</span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-theme-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-theme-secondary hover:text-theme-text bg-theme-button hover:bg-theme-button-hover rounded-xl border border-theme-border transition-colors"
          >
            Cancelar
          </button>
          {!isSystem && (
            <button
              type="button"
              onClick={() => onConfirm(force)}
              className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-lg transition-all"
            >
              {force ? 'Forzar Detención' : 'Detener Servidor'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
