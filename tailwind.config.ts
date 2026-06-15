import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        canvas: "#f3f7f7",
        ink: "#2d264b", // IZICHANGE --izi-primary-dark-color (headings / text)
        // Primary — IZICHANGE teal (#008080)
        brand: {
          DEFAULT: "#008080",
          50: "#e6f5f5",
          100: "#c2e7e7",
          200: "#99d8d8",
          300: "#66c4c4",
          400: "#29a8a8",
          500: "#0a9393",
          600: "#008080",
          700: "#016a6a",
          800: "#03504f",
          900: "#053b3b",
        },
        // Secondary accent — IZICHANGE red (#DC3E4D), used for danger / negative
        danger: {
          DEFAULT: "#dc3e4d",
          50: "#fdecee",
          100: "#fbd5da",
          200: "#f6aeb6",
          300: "#f08490",
          400: "#e85e6c",
          500: "#dc3e4d",
          600: "#c52e3c",
          700: "#a32531",
        },
        // Positive / success — emerald (harmonises with teal)
        accent: {
          DEFAULT: "#059669",
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.04), 0 1px 3px 0 rgba(16,24,40,0.06)",
        "card-md": "0 4px 16px -4px rgba(16,24,40,0.10), 0 2px 6px -2px rgba(16,24,40,0.05)",
        pop: "0 18px 44px -16px rgba(16,24,40,0.22)",
        "brand-sm": "0 6px 16px -6px rgba(0,128,128,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
