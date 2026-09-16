import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types/models';

export type ThemeMode = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  const applyTheme = useCallback((mode: ThemeMode) => {
    let resolved: ResolvedTheme = 'dark';

    if (mode === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }

    setResolvedTheme(resolved);

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#0F0F12';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#F2F2F7';
    }
  }, []);

  // Initialize theme from saved settings
  useEffect(() => {
    async function initTheme() {
      if (window.api) {
        try {
          const settings = await window.api.getSettings();
          const savedTheme = settings.theme || 'dark';
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        } catch (e) {
          applyTheme('dark');
        }
      } else {
        applyTheme('dark');
      }
    }
    initTheme();
  }, [applyTheme]);

  // Listen to system color scheme changes when mode is 'system'
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      applyTheme(newTheme);
      if (window.api) {
        window.api.saveSettings({ theme: newTheme } as Partial<AppSettings>);
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
