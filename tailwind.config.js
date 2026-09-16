/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          '"Cascadia Code"',
          '"Fira Code"',
          '"JetBrains Mono"',
          'Consolas',
          'monospace'
        ],
      },
      colors: {
        apple: {
          bg: {
            dark: '#0E0E10',
            light: '#F5F5F7',
          },
          glass: {
            dark: 'rgba(24, 24, 28, 0.72)',
            light: 'rgba(255, 255, 255, 0.82)',
          },
          surface: {
            dark: 'rgba(38, 38, 44, 0.8)',
            light: 'rgba(255, 255, 255, 0.95)',
          },
          elevated: {
            dark: 'rgba(48, 48, 56, 0.9)',
            light: '#FFFFFF',
          },
          border: {
            dark: 'rgba(255, 255, 255, 0.09)',
            light: 'rgba(0, 0, 0, 0.08)',
          },
          text: {
            primary: {
              dark: '#F5F5F7',
              light: '#1D1D1F',
            },
            secondary: {
              dark: '#A1A1A6',
              light: '#86868B',
            },
            muted: {
              dark: '#636366',
              light: '#AEAEB2',
            }
          },
          blue: '#007AFF',
          green: '#34C759',
          amber: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          indigo: '#5856D6',
        },
        theme: {
          bg: 'var(--app-bg)',
          sidebar: 'var(--sidebar-bg)',
          main: 'var(--main-bg)',
          card: 'var(--card-bg)',
          'card-hover': 'var(--card-hover)',
          drawer: 'var(--drawer-bg)',
          modal: 'var(--modal-bg)',
          border: 'var(--border-color)',
          'border-subtle': 'var(--border-subtle)',
          text: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          input: 'var(--input-bg)',
          button: 'var(--button-secondary-bg)',
          'button-hover': 'var(--button-secondary-hover)',
          'active-item': 'var(--item-active-bg)',
          pill: 'var(--subtle-pill-bg)',
          titlebar: 'var(--titlebar-bg)',
        }
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'apple-md': '0 8px 24px rgba(0, 0, 0, 0.18)',
        'apple-lg': '0 16px 40px rgba(0, 0, 0, 0.25)',
        'apple-glow-green': '0 0 16px rgba(52, 199, 89, 0.35)',
        'apple-glow-blue': '0 0 16px rgba(0, 122, 255, 0.35)',
        'apple-glow-amber': '0 0 16px rgba(255, 149, 0, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.96)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      }
    },
  },
  plugins: [],
}
