/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trade: {
          bg: '#070B12',
          surface: '#0D131D',
          surface2: '#111927',
          surface3: '#162032',
          border: '#1D2938',
          borderLight: '#2A3A4E',
          primary: '#5B8CFF',
          primaryHover: '#4075FF',
          positive: '#22C55E',
          positiveMuted: 'rgba(34, 197, 94, 0.12)',
          negative: '#EF4444',
          negativeMuted: 'rgba(239, 68, 68, 0.12)',
          warning: '#F59E0B',
          warningMuted: 'rgba(245, 158, 11, 0.12)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(91, 140, 255, 0.25)',
        'glow-positive': '0 0 15px -3px rgba(34, 197, 94, 0.3)',
        'glow-negative': '0 0 15px -3px rgba(239, 68, 68, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.35)' },
          '100%': { backgroundColor: 'transparent' }
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.35)' },
          '100%': { backgroundColor: 'transparent' }
        }
      }
    },
  },
  plugins: [],
}
