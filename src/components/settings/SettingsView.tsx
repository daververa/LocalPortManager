import React, { useState, useEffect } from 'react';
import { Settings, Bell, Monitor, KeyRound, Shield, RefreshCw } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none animate-fade-in text-xs text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Configuración</h2>
          <p className="text-zinc-400 mt-0.5">
            Ajustes generales, comportamiento del sistema y preferencias de usuario.
          </p>
        </div>
        {savedMessage && (
          <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            ✓ Guardado
          </span>
        )}
      </div>

      {/* Settings Grid */}
      <div className="space-y-4 max-w-2xl">
        {/* Comportamiento del Sistema */}
        <div className="bg-[#18181C]/70 border border-white/[0.06] rounded-2xl p-4 space-y-4">
          <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Sistema y Ventana</span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-zinc-200">Minimizar a la Bandeja del Sistema (Tray)</div>
                <div className="text-[11px] text-zinc-400">Al cerrar la ventana, mantener la aplicación ejecutándose en segundo plano.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={e => updateSetting('minimizeToTray', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-zinc-200">Iniciar con Windows</div>
                <div className="text-[11px] text-zinc-400">Abrir LocalPort Manager automáticamente al iniciar sesión en el PC.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.startWithWindows}
                onChange={e => updateSetting('startWithWindows', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-400"
              />
            </label>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-[#18181C]/70 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Notificaciones</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer pt-1">
            <div>
              <div className="font-medium text-zinc-200">Notificar Nuevos Servidores</div>
              <div className="text-[11px] text-zinc-400">Mostrar una notificación de Windows cuando un nuevo puerto o servidor sea detectado.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={e => updateSetting('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-400"
            />
          </label>
        </div>

        {/* Atajos de Teclado */}
        <div className="bg-[#18181C]/70 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Atajo Global</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-zinc-200">Atajo para Invocar el Widget</div>
              <div className="text-[11px] text-zinc-400">Presiona esta combinación para mostrar u ocultar la ventana en cualquier momento.</div>
            </div>
            <input
              type="text"
              value={settings.globalShortcut}
              onChange={e => updateSetting('globalShortcut', e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right w-52"
            />
          </div>
        </div>

        {/* Privacidad y Seguridad */}
        <div className="bg-[#18181C]/70 border border-white/[0.06] rounded-2xl p-4 space-y-2">
          <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Privacidad y Seguridad</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
            LocalPort Manager es <strong>100% privado y local</strong>. Ningún nombre de proyecto, ruta de archivo o puerto es transmitido por Internet. Todos los datos persisten exclusivamente en tu máquina en el directorio de usuario de Windows.
          </p>
        </div>
      </div>
    </div>
  );
};
