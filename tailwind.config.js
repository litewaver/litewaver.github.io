/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        shine: {
          "100%": { left: "125%" }
        }
      },
      animation: {
        shine: "shine 1s"
      },
      colors: {
        "bg-dark": "#03031e"
      },
      fontFamily: {
        "source-code-pro": ['"Source Code Pro"', "monospace"]
      }
    }
  },
  plugins: []
};
