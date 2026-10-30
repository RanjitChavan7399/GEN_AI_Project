/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#03281E',
          900: '#064E3B', // Deep Emerald
          800: '#065F46',
          700: '#047857',
          600: '#059669', // Emerald Green
          500: '#10B981', // Neon Emerald
          400: '#34D399',
          300: '#6EE7B7',
          200: '#A7F3D0', // Soft Mint
          100: '#D1FAE5',
          50: '#ECFDF5',
        },
        lime: {
          400: '#A3E635',
          300: '#BEF264',
          200: '#D9F99D', // Lime Accent
          100: '#ECFCCB',
          50: '#F7FEE7',
        },
        cream: {
          50: '#FFFDF7',
          100: '#FFFBEB', // Warm Cream
          200: '#FEF3C7',
          300: '#FDE68A',
        },
        surface: {
          bg: '#F7F9F2',
          card: 'rgba(255, 255, 255, 0.9)',
          darkBg: '#041E17',
          darkCard: 'rgba(6, 78, 59, 0.4)',
          textDark: '#0A1C15',
          textMuted: '#233A30',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-lime': '0 0 25px rgba(217, 249, 157, 0.4)',
        'glass': '0 8px 32px 0 rgba(6, 78, 59, 0.12)',
        'glass-hover': '0 12px 40px 0 rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'spin-slow': 'spin 15s linear infinite',
        'gradient-mesh': 'gradient-mesh 12s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(3deg)' },
        },
        'gradient-mesh': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
