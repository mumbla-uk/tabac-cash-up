// tailwind.config.js
module.exports = {
  content: [
    // Ensure this path covers all your React components (.js, .jsx, .ts, .tsx)
    "./src/**/*.{js,jsx,ts,tsx}",
    // IMPORTANT: Also include your public HTML file, as it often contains the root element where
    // some initial Tailwind classes (like min-h-screen, bg-gray-50) might be applied.
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}