/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Or your main HTML file if not using Vite/CRA default
    "./src/**/*.{js,jsx,ts,tsx}", // <--- IMPORTANT: Ensure this path covers your React components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}