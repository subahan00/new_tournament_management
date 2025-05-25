/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'] // Or another premium font
      },
      colors: {
        black: {
          DEFAULT: '#000000',  // <-- This brings back 'bg-black'
          900: '#0a0a0a',
          800: '#1a1a1a',
        },
        gold: {
          300: '#f0d175',
          400: '#e6c05e',
          500: '#d4af37',
          600: '#c9a227',
          700: '#bd8f17',
          800: '#b57d0d',
          900: '#a56a0a',
        },
      },
      boxShadow: {
        'gold-lg': '0 10px 25px -5px rgba(212, 175, 55, 0.2), 0 10px 10px -5px rgba(212, 175, 55, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [],
};
