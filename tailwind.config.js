/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ 
    "./src/index.html**/*.{html,js}",
    "./src/components/**/*.{html,js,}",
    "./src/app/**/*.{html,js,}",],
  theme: {
    extend: {

      backdropFilter: ['responsive'], 
      colors: {
        'bg-dark': '#03031e',


    },
      fontFamily: {
        'source-code-pro': ['"Source Code Pro"', 'monospace']
    },
      container: {
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      

        width
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    

  ],
}


},


}

