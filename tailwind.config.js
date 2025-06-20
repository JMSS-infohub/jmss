/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00a6fb',
        secondary: '#0582ca',
        accent: '#006494',
        light: '#e6f2ff',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 