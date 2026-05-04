/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core terminal palette
        term: {
          black:   "#050505",   // deepest bg
          void:    "#080808",   // page bg
          base:    "#0A0A0A",   // card bg
          raised:  "#0D0D0D",   // elevated
          border:  "#1A1A1A",   // borders
          dim:     "#111111",   // hover states
          green:   "#00FF41",   // primary accent
          bright:  "#39FF14",   // bright green
          mid:     "#00CC33",   // mid green
          dark:    "#003B00",   // dark green surface
          muted:   "#005500",   // muted green
          glow:    "rgba(0,255,65,0.15)",  // glow
          glowDim: "rgba(0,255,65,0.06)",  // subtle glow
        },
        // Text hierarchy
        ink: {
          primary:   "#E8FFE8",   // near white with green tint
          secondary: "#7FBF7F",   // mid green-grey
          muted:     "#3D6B3D",   // dim
          ghost:     "#1F3D1F",   // barely visible
        },
        // Semantic (all green-shifted)
        ok:   { DEFAULT: "#00FF41", dim: "#003B00" },
        warn: { DEFAULT: "#FFB800", dim: "#3D2D00" },
        err:  { DEFAULT: "#FF3333", dim: "#3D0000" },
        info: { DEFAULT: "#00CCFF", dim: "#003340" },
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        serif:   ["'Playfair Display'", "Georgia", "serif"],
        sans:    ["'JetBrains Mono'", "monospace"], // fallback
      },
      fontSize: {
        "2xs": ["0.6rem", { lineHeight: "0.875rem" }],
        "xs":  ["0.7rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        glow:     "0 0 20px rgba(0,255,65,0.2), 0 0 40px rgba(0,255,65,0.08)",
        "glow-sm": "0 0 10px rgba(0,255,65,0.15)",
        "glow-lg": "0 0 60px rgba(0,255,65,0.15), 0 0 120px rgba(0,255,65,0.06)",
        inset:    "inset 0 1px 0 rgba(0,255,65,0.08)",
      },
      keyframes: {
        "blink":     { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "scanline":  { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100vh)" } },
        "flicker":   { "0%,19%,21%,23%,25%,54%,56%,100%": { opacity: "1" }, "20%,24%,55%": { opacity: "0.6" } },
        "fade-in":   { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "type-in":   { from: { width: "0" }, to: { width: "100%" } },
        "glow-pulse":{ "0%,100%": { boxShadow: "0 0 10px rgba(0,255,65,0.2)" }, "50%": { boxShadow: "0 0 25px rgba(0,255,65,0.5)" } },
        "matrix":    { "0%": { opacity: "1" }, "100%": { opacity: "0", transform: "translateY(20px)" } },
      },
      animation: {
        "blink":      "blink 1s step-end infinite",
        "scanline":   "scanline 8s linear infinite",
        "flicker":    "flicker 6s infinite",
        "fade-in":    "fade-in 0.4s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

module.exports = config;