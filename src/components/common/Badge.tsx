import React from 'react';
import { PortStatus, ProcessSafety } from '../../types/models';

interface BadgeProps {
  status?: PortStatus;
  safety?: ProcessSafety;
  text?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, safety, text, size = 'sm' }) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (status) {
    switch (status) {
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 active-pulse" />
            <span>{text || 'ACTIVO'}</span>
          </span>
        );
      case 'paused':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{text || 'PAUSADO'}</span>
          </span>
        );
      case 'starting':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <span>{text || 'INICIANDO'}</span>
          </span>
        );
      case 'stopped':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full border border-zinc-400" />
            <span>{text || 'DETENIDO'}</span>
          </span>
        );
      case 'error':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{text || 'ERROR'}</span>
          </span>
        );
    }
  }

  if (safety) {
    switch (safety) {
      case 'safe':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
            <span>Seguro</span>
          </span>
        );
      case 'caution':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
            <span>Precaución</span>
          </span>
        );
      case 'system':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-zinc-600/20 text-zinc-400 border border-zinc-500/20 ${sizeClasses}`}>
            <span>Sistema</span>
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-white/5 text-zinc-300 border border-white/10 ${sizeClasses}`}>
      {text}
    </span>
  );
};
