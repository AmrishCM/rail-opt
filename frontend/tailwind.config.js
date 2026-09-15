/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Operational railway palette
        'rail-maroon': '#881337',
        'rail-maroon-dark': '#4c0519',
        'rail-maroon-light': '#9f1239',
        'rail-maroon-tint': '#ffe4e6',
        'rail-navy': '#0f172a',
        'rail-slate': '#1e293b',
        'rail-surface': '#ffffff',
        'rail-bg': '#f8fafc',
        'rail-border': '#e2e8f0',
        'rail-muted': '#64748b',
        // Operational status colors
        'status-critical': '#b91c1c',
        'status-warning': '#b45309',
        'status-success': '#15803d',
        'status-info': '#1d4ed8',
      },
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}