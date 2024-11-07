/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ 
    "./src/index.html**/*.{html,js}",
    "./src/components/**/*.{html,js,}",
    "./src/app/**/*.{html,js,}",],
  theme: {
    extend: {
      darkMode: ['selector', '[data-mode="dark"]'],

      colors: {
        'bg-dark':'#03031e',
        'text-color': '#f0fbda',
        'textcolor1': 'text-emerald-100', 
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

