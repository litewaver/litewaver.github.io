/** @type {import('tailwindcss').Config} */
module.exports = {
  content:{
  
    relative: true,
    files: [
    '/public/*.{html,js,}',

    '.public/index.html/*.{html,js}',

  ],
},
  theme: {
    extend: {
      darkMode: ['selector', '[data-mode="dark"]'],
      darkMode: ['variant', '&:not(.light *)'],
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
  
