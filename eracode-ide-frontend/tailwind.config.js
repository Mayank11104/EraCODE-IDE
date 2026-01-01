/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007ACC',
        'dark-base': '#181818',
        'dark-surface': '#1E1E1E',
        'dark-header': '#252526',
        'dark-hover': '#2A2D2E',
        'dark-border': '#3E3E3E',
        'text-primary': '#CCCCCC',
        'text-secondary': '#858585',
        selection: '#094771',
      },
    },
  },
  plugins: [],
}
