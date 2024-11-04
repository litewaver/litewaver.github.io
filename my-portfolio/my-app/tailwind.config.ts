import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;






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

