/** @type {import('tailwindcss').Config} */
module.exports = {
  
  content: ["./src/**/*.{html,js}"],
  darkMode: ['selector', '[data-mode="dark"]'],
  darkMode: ['variant', '&:not(.light *)'],
  theme: {

        container: {
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
          center: true,
          padding: '1rem',
    },
    extend:{
      colors: {
        'bg-dark':'#03031e',
        
            },
        
      spacing: {
      '1': '8px',
      '2': '12px',
      '3': '16px',
      '4': '24px',
      '5': '32px',
      '6': '48px',
    },
      fontFamily: {
        'mono': ['Source Code Pro', 'sans-serif'],
        'serif': ['EB Garamond', 'sans-serif'],
    },

      fontSize: {
        sm: '0.8rem',
        base: '1rem',
        xl: '1.25rem',
            }
          },
          variants: {
            colors: {
              'bg-dark':'#03031e',
              'text-color': '#f0fbda',
              ""
        
            },
          }

