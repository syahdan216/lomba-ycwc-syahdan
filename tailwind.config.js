/** @type {import('tailwindcss').Config} */
export default {
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
        textMuted: '#64748B'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
