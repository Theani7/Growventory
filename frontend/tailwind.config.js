/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy forest palette kept for landing/login/register
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // New dashboard palette
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dde1e9',
          300: '#c1c8d4',
          400: '#9ba4b5',
          500: '#727b8e',
          600: '#525a6c',
          700: '#3f4757',
          800: '#2a303c',
          900: '#1a1f29',
          950: '#0d1118',
        },
        moss: {
          50: '#effaf3',
          100: '#d8f3df',
          200: '#b3e7c4',
          300: '#7fd49d',
          400: '#4cba76',
          500: '#2ba059',
          600: '#1d8147',
          700: '#19663b',
          800: '#175131',
          900: '#13422a',
          950: '#062418',
        },
        accent: {
          mint: '#34d8a5',
          teal: '#0fb5b5',
          sky: '#3b9eff',
          amber: '#f5a623',
          coral: '#ff6b6b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 0 4px rgba(16, 185, 129, 0.1)',
        'elevated': '0 1px 0 0 rgba(17, 24, 28, 0.04), 0 0 0 1px rgba(17, 24, 28, 0.04), 0 4px 16px -4px rgba(17, 24, 28, 0.08)',
        'elevated-lg': '0 1px 0 0 rgba(17, 24, 28, 0.04), 0 0 0 1px rgba(17, 24, 28, 0.04), 0 12px 32px -8px rgba(17, 24, 28, 0.12)',
        'inner-glow': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'mesh-emerald': 'radial-gradient(at 20% 0%, rgba(52, 216, 165, 0.18) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(15, 181, 181, 0.12) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(43, 160, 89, 0.10) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 20% 0%, rgba(43, 160, 89, 0.20) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(15, 181, 181, 0.12) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
