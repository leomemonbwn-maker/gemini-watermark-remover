/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js}",
    "./public/**/*.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        theme: {
          light: "#F0F4F8",
          dark: "#090D16",
          cardDark: "#111827",
        },
        brand: {
          primary: "#10b981",   /* Emerald Teal */
          secondary: "#06b6d4", /* Electric Cyan */
          accent: "#8b5cf6",    /* Royal Violet */
        },
        patreon: "#FF424D",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
