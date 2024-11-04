/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ 
    "./src/index.html**/*.{html,js}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",],
  theme: {
    extend: {},
  },
  plugins: [],
}


},
theme: {
  extend: {
    darkMode: ['selector', '[data-mode="dark"]'],
  },

  colors: {
    'bg-dark':'#03031e',
    'text-color': '#f0fbda',
},
  fontFamily: {
    'source-code-pro': ['"Source Code Pro"', 'monospace'],
},
  container: {
  padding: {
    DEFAULT: '1rem',
    sm: '2rem',
    lg: '4rem',
    xl: '5rem',
    '2xl': '6rem',

plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
  
],
},
},
},
}



