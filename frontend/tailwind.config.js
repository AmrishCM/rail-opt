/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Operational status colors
        'status-red': '#dc2626',    // Critical issues
        'status-amber': '#d97706',  // Warnings
        'status-green': '#16a34a',  // Normal/Good
        'status-blue': '#2563eb',   // Information
        // Professional palette
        'rail-dark': '#1e293b',
        'rail-light': '#f8fafc',
      },
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
      }
    },
  },
  plugins: [],
}