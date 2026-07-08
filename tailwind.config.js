/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#ff8c00',
        secondary: '#e67e00',
        dark: '#1a1a1a',
        card: '#2d2d2d',
        lightText: '#f0f0f0',
      }
    },
  },
  plugins: [],
}
