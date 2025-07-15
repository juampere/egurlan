/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primario: '#4B352A',     // Marrón oscuro
        secundario: '#D97706',   // Naranja ocre
        fondo: '#FAF4EF',        // Fondo claro
        texto: '#2D2D2D',        // Texto oscuro
        arena: '#C8B6A6',        // Complementario suave
      }
    },
  },
  plugins: [],
}

