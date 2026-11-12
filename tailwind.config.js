/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        choco: {
          50: '#fbf7f5',
          100: '#f4ede8',
          500: '#794028',
          700: '#522919',
          900: '#2c150c',
        },
        roseberry: {
          500: '#e11d48',
          600: '#be123c',
        }
      }
    },
  },
  plugins: [],
}
