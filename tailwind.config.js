/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dominant: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        slate: '#1E293B',
        accent: '#10B981',
        warning: '#F97316',
        textMain: '#0F172A',
        textMuted: '#64748B',
        // Dark mode variables
        dark: {
          dominant: '#0B1120',
          card: '#1E293B',
          border: '#334155',
          textMain: '#F8FAFC',
          textMuted: '#94A3B8',
          accent: '#10B981', // emerald-500
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
