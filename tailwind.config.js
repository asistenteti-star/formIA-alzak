/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alzak: {
          // Paleta institucional oficial de ALZAK Foundation
          primary: "#003B5C",      // Azul marino institucional
          "primary-deep": "#031C2B",
          "primary-soft": "#0A4F79",
          accent: "#00A65E",       // Verde ALZAK (color del logo)
          "accent-dark": "#008C4F",
          "accent-light": "#7FE0B4",
          "accent-tint": "#E8F6EF",
          bg: "#F8FBFD",           // Fondo institucional
          "bg-soft": "#F5FBF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "claude-serif": ["var(--font-claude-serif)", "Source Serif 4", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0, 59, 92, 0.15)",
        glow: "0 8px 24px -8px rgba(0, 166, 94, 0.45)",
        card: "0 1px 2px rgba(0, 59, 92, 0.04), 0 8px 24px -12px rgba(0, 59, 92, 0.12)",
      },
      backgroundImage: {
        "alzak-gradient":
          "linear-gradient(135deg, #003B5C 0%, #0A4F79 100%)",
        "alzak-gradient-accent":
          "linear-gradient(135deg, #00A65E 0%, #008C4F 100%)",
      },
    },
  },
  plugins: [],
};
