/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Aquí aplicaremos la estética de tu diseño de Figma
      borderRadius: {
        'bento': '24px', 
      },
      colors: {
        'card-bg': '#f9f9f9',
      }
    },
  },
  plugins: [],
}