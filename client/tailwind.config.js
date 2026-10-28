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
        charcoal: '#171e19',
        darkgray: '#272727',
        sage: '#b7c6c2',
        yellow: {
          DEFAULT: '#ffe17c',
          accent: '#ffe17c',
          50: '#fffdeb',
          100: '#fff9c7',
          200: '#fff39e',
          300: '#ffeb75',
          400: '#ffe17c',
          500: '#f5c84c',
          600: '#d9a626',
        },
        cyber: {
          950: '#070b14',
          900: '#0b1120',
          850: '#0f172a',
          800: '#15213b',
          700: '#1e293b',
          600: '#334155',
          accent: '#06b6d4',
          glow: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        anton: ['Anton', 'Impact', 'Arial Black', 'sans-serif'],
        satoshi: ['Satoshi', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Satoshi', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      lineHeight: {
        '0.9': '0.9',
        'tight-none': '0.85',
      },
      transitionTimingFunction: {
        'brutalist': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
