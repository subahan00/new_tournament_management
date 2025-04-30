module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'eafc-blue': '#1e3a8a',
        gold: '#FFD700',
      },
      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
