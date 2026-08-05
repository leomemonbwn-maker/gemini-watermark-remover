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
        sans: ["Montserrat", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        theme: {
          light: "#F4F7FB",
          dark: "#080C15",
          cardLight: "rgba(255, 255, 255, 0.72)",
          cardDark: "rgba(13, 19, 33, 0.7)",
        },
        brand: {
          primary: "#10b981",   /* Emerald */
          secondary: "#06b6d4", /* Cyan */
          accent: "#8b5cf6",    /* Violet */
          glow: "#34d399",
        },
        patreon: "#FF424D",
      },
      backdropBlur: {
        'xs': '2px',
        'liquid': '24px',
        'liquid-heavy': '36px',
        'liquid-super': '48px',
      },
      boxShadow: {
        'liquid-light': '0 8px 32px 0 rgba(16, 185, 129, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04)',
        'liquid-dark': '0 12px 40px 0 rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4)',
        'liquid-glow': '0 0 35px -5px rgba(16, 185, 129, 0.35)',
        'liquid-glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.35)',
      },
      animation: {
        "fade-in": "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "liquid-shimmer": "liquidShimmer 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        liquidShimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};
