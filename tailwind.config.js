import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.teal,
        accent: colors.amber,
      },
    },
    extend:{ fontFamily:{ sans:["Poppins","ui-sans-serif","system-ui"], display:["Bebas Neue","cursive"] } } ,
  },
  plugins: [],
}

