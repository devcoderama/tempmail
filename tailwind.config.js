/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        neo: "6px 6px 0px 0px rgba(0,0,0,1)",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};
