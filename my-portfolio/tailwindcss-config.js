/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    
  ],
  theme: {
    extend: {
      darkMode: ['selector', '[data-mode="dark"]'],
      darkMode: ['variant', '&:not(.light *)'],
      colors: {
        'bg-dark':'#03031e',
        'text-color': '#f0fbda',




      }
  },
  plugins: [    
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],


  

theme: {

      container: {
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',

         
  },
  extend:{
    colors: {
      'bg-dark':'#03031e',
    
    fontFamily: {
        'source-code-pro': ['"Source Code Pro"', 'monospace'],
    },
          },
      
    spacing: {
    '1': '8px',
    '2': '12px',
    '3': '16px',
    '4': '24px',
    '5': '32px',
    '6': '48px',
  },
    columns: {
       'xs':'14rem',


    },


    fontSize: {
      sm: '0.8rem',
      base: '1rem',
      xl: '1.25rem',
          }
        },


        
        fontWeight: {
          'source-code-light': 300,
          'source-code-regular': 400,
        }
        variants: {}
          colors: {
            'bg-dark':'#03031e',
            'text-color': '#f0fbda',
            ""
      
          },
        }
