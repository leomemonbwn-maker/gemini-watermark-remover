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
        theme: {
          light: "#0F0F1A",
          dark: "#0A0A0F",
          cardLight: "rgba(26, 26, 46, 0.7)",
          cardDark: "rgba(18, 18, 26, 0.7)",
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
        cyber: {
          void: "#0A0A0F",
          surface: "#12121A",
          elevated: "#1A1A2E",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          primary: "#FF2D95",
          secondary: "#00F0FF",
          accent: "#B026FF",
          glow: "#FF2D95",
        },
      },
      backdropBlur: {
        'xs': '2px',
        'cyber': '20px',
        'cyber-heavy': '32px',
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 45, 149, 0.4), 0 0 60px rgba(255, 45, 149, 0.15)',
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.15)',
        'neon-purple': '0 0 20px rgba(176, 38, 255, 0.4), 0 0 60px rgba(176, 38, 255, 0.15)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.15)',
        'cyber-card': '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
        'cyber-card-hover': '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.1)',
        'cyber-glow': '0 0 40px -5px rgba(255, 45, 149, 0.3), 0 0 80px -10px rgba(0, 240, 255, 0.2)',
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "neon-flicker": "neonFlicker 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "scan-line": "scanLine 8s linear infinite",
        "glitch": "glitch 3s infinite",
        "border-flow": "borderFlow 4s linear infinite",
        "typewriter": "typewriter 3s steps(40) 1s both",
        "blink-caret": "blinkCaret 0.75s step-end infinite",
        "bounce-down": "bounceDown 2s ease-in-out infinite",
        "counter-up": "counterUp 2s ease-out both",
        "neon-border": "neonBorder 3s ease-in-out infinite",
        "matrix-fall": "matrixFall 10s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 20px rgba(255, 45, 149, 0.3)" },
          "50%": { opacity: "1", boxShadow: "0 0 40px rgba(255, 45, 149, 0.6), 0 0 80px rgba(0, 240, 255, 0.3)" },
        },
        neonFlicker: {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.8" },
          "43%": { opacity: "1" },
          "45%": { opacity: "0.3" },
          "46%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        blinkCaret: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#FF2D95" },
        },
        bounceDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(10px)" },
        },
        counterUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        neonBorder: {
          "0%, 100%": { borderColor: "rgba(255, 45, 149, 0.5)" },
          "33%": { borderColor: "rgba(0, 240, 255, 0.5)" },
          "66%": { borderColor: "rgba(176, 38, 255, 0.5)" },
        },
        matrixFall: {
          "0%": { transform: "translateY(-100%)", opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
