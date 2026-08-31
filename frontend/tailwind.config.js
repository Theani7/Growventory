/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Unified editorial palette — matches landing/auth #1a3a2a / #fcfdfc
        // forest/brand kept for backwards compat — use moss instead
        forest: {
          50: '#eef6ee',
          100: '#d6ead6',
          200: '#b7d8b7',
          300: '#8ec08e',
          400: '#5a9a5a',
          500: '#2d6a3d',
          600: '#1a3a2a',
          700: '#143021',
          800: '#0f1f14',
          900: '#0a1910',
          950: '#06120c',
        },
        brand: {
          50: '#eef6ee',
          100: '#d6ead6',
          200: '#b7d8b7',
          300: '#8ec08e',
          400: '#5a9a5a',
          500: '#2d6a3d',
          600: '#1a3a2a',
          700: '#143021',
          800: '#0f1f14',
          900: '#06120c',
        },
        // ink now aliases warm stone (was cool blue-gray) — existing ink-* classes auto-remap
        ink: {
          50: '#f6f7f5',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0f1f14',
        },
        moss: {
          50: '#eef6ee',
          100: '#d6ead6',
          200: '#b7d8b7',
          300: '#8ec08e',
          400: '#5a9a5a',
          500: '#2d6a3d',
          600: '#1a3a2a',
          700: '#143021',
          800: '#0f1f14',
          900: '#0a1910',
          950: '#06120c',
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
        'glow': '0 0 0 4px rgba(26, 58, 42, 0.12)',
        'elevated': '0 1px 0 0 rgba(28, 25, 23, 0.04), 0 0 0 1px rgba(28, 25, 23, 0.04), 0 4px 16px -4px rgba(28, 25, 23, 0.08)',
        'elevated-lg': '0 1px 0 0 rgba(28, 25, 23, 0.04), 0 0 0 1px rgba(28, 25, 23, 0.04), 0 12px 32px -8px rgba(28, 25, 23, 0.12)',
        'inner-glow': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
        'shrink': 'shrink 6s linear forwards',
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
        shrink: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
      backgroundImage: {
        'mesh-emerald': 'radial-gradient(at 20% 0%, rgba(26, 58, 42, 0.12) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(29, 77, 46, 0.08) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(45, 106, 61, 0.06) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 20% 0%, rgba(26, 58, 42, 0.14) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(29, 77, 46, 0.08) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
