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
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        neu: {
          bg: "#1a1a2e",
          surface: "#222240",
          raised: "#292950",
          inset: "#151528",
          border: "rgba(255, 255, 255, 0.04)",
        },
        neon: {
          pink: "#FF2D95",
          cyan: "#00F0FF",
          purple: "#B026FF",
          green: "#39FF14",
          orange: "#FF6B35",
          blue: "#4D7CFF",
          yellow: "#FFE600",
        },
        // Keep backward compat aliases
        theme: {
          light: "#222240",
          dark: "#1a1a2e",
          cardLight: "rgba(34, 34, 64, 0.9)",
          cardDark: "rgba(26, 26, 46, 0.9)",
        },
        cyber: {
          void: "#1a1a2e",
          surface: "#222240",
          elevated: "#292950",
          border: "rgba(255, 255, 255, 0.04)",
        },
        brand: {
          primary: "#FF2D95",
          secondary: "#00F0FF",
          accent: "#B026FF",
          glow: "#FF2D95",
        },
      },
      boxShadow: {
        'neu-raised': '6px 6px 16px rgba(8, 8, 20, 0.7), -4px -4px 12px rgba(60, 60, 100, 0.15)',
        'neu-raised-sm': '3px 3px 8px rgba(8, 8, 20, 0.7), -2px -2px 6px rgba(60, 60, 100, 0.15)',
        'neu-raised-lg': '10px 10px 24px rgba(8, 8, 20, 0.7), -8px -8px 20px rgba(60, 60, 100, 0.15)',
        'neu-inset': 'inset 4px 4px 10px rgba(8, 8, 20, 0.7), inset -3px -3px 8px rgba(60, 60, 100, 0.15)',
        'neu-flat': '0 2px 8px rgba(8, 8, 20, 0.5)',
        // Accent glows (subtle)
        'neon-pink': '0 0 16px rgba(255, 45, 149, 0.2)',
        'neon-cyan': '0 0 16px rgba(0, 240, 255, 0.2)',
        'neon-purple': '0 0 16px rgba(176, 38, 255, 0.2)',
        'neon-green': '0 0 16px rgba(57, 255, 20, 0.2)',
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "gentle-float": "gentleFloat 6s ease-in-out infinite",
        "soft-pulse": "softPulse 3s ease-in-out infinite",
        "scan-line": "scanLine 8s linear infinite",
        "border-flow": "borderFlow 4s linear infinite",
        "bounce-down": "bounceDown 2s ease-in-out infinite",
        "counter-up": "counterUp 2s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gentleFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        softPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.8" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        bounceDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        counterUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
