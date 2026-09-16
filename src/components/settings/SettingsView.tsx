import React, { useState, useEffect } from 'react';
import { Settings, Bell, Monitor, KeyRound, Shield, RefreshCw, Sun, Moon } from 'lucide-react';
import { AppSettings } from '../../types/models';

interface SettingsViewProps {
  currentTheme: 'system' | 'dark' | 'light';
  onThemeChange: (theme: 'system' | 'dark' | 'light') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!window.api) return;
    const current = await window.api.getSettings();
    setSettings(current);
  };

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings || !window.api) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await window.api.saveSettings({ [key]: value });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  if (!settings) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none animate-fade-in text-xs text-theme-secondary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-theme-text">Configuración</h2>
          <p className="text-theme-muted mt-0.5">
            Ajustes generales, apariencia y preferencias del sistema.
          </p>
        </div>
        {savedMessage && (
          <span className="text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            ✓ Guardado
          </span>
        )}
      </div>

      {/* Settings Grid */}
      <div className="space-y-4 max-w-2xl">
        {/* Apariencia / Tema */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Apariencia y Tema</span>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { id: 'dark' as const, label: 'Oscuro', icon: Moon, desc: 'Estilo Apple OLED' },
              { id: 'light' as const, label: 'Claro', icon: Sun, desc: 'Estilo macOS Silver' },
              { id: 'system' as const, label: 'Automático', icon: Monitor, desc: 'Sincronizar con Windows' },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = currentTheme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onThemeChange(item.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'bg-theme-button border-theme-border text-theme-secondary hover:text-theme-text hover:bg-theme-button-hover'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[10px] text-theme-muted mt-0.5">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comportamiento del Sistema */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-4">
          <div className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-500" />
            <span>Sistema y Ventana</span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-theme-text">Minimizar a la Bandeja del Sistema (Tray)</div>
                <div className="text-[11px] text-theme-muted">Al cerrar la ventana, mantener la aplicación ejecutándose en segundo plano.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={e => updateSetting('minimizeToTray', e.target.checked)}
                className="w-4 h-4 rounded border-theme-border bg-theme-input text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-theme-text">Iniciar con Windows</div>
                <div className="text-[11px] text-theme-muted">Abrir LocalPort Manager automáticamente al iniciar sesión en el PC.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.startWithWindows}
                onChange={e => updateSetting('startWithWindows', e.target.checked)}
                className="w-4 h-4 rounded border-theme-border bg-theme-input text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            <span>Notificaciones</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer pt-1">
            <div>
              <div className="font-medium text-theme-text">Notificar Nuevos Servidores</div>
              <div className="text-[11px] text-theme-muted">Mostrar una notificación de Windows cuando un nuevo puerto o servidor sea detectado.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={e => updateSetting('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-theme-border bg-theme-input text-blue-500 focus:ring-blue-400 cursor-pointer"
            />
          </label>
        </div>

        {/* Atajos de Teclado */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Atajo Global</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-theme-text">Atajo para Invocar el Widget</div>
              <div className="text-[11px] text-theme-muted">Presiona esta combinación para mostrar u ocultar la ventana en cualquier momento.</div>
            </div>
            <input
              type="text"
              value={settings.globalShortcut}
              onChange={e => updateSetting('globalShortcut', e.target.value)}
              className="px-3 py-1.5 bg-theme-input border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:ring-1 focus:ring-blue-500 text-right w-52"
            />
          </div>
        </div>

        {/* Privacidad y Seguridad */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-2">
          <div className="text-xs font-semibold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Privacidad y Seguridad</span>
          </div>
          <p className="text-[11px] text-theme-muted leading-relaxed pt-1">
            LocalPort Manager es <strong>100% privado y local</strong>. Ningún nombre de proyecto, ruta de archivo o puerto es transmitido por Internet. Todos los datos persisten exclusivamente en tu máquina en el directorio de usuario de Windows.
          </p>
        </div>
      </div>
    </div>
  );
};
