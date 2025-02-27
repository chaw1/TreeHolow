/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tree: {
          bark: "#5D4037",
          leafDark: "#2E7D32",
          leafLight: "#4CAF50",
          fruit: "#FFC107",
          hole: "#3E2723"
        },
        brand: {
          primary: "#4f46e5", // indigo-600
          secondary: "#7c3aed", // purple-600
          accent: "#c026d3", // fuchsia-600
          light: "#e0e7ff", // indigo-100
          dark: "#312e81", // indigo-900
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'hero-pattern': "url('/images/hero-pattern.svg')",
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-light": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-light": "pulse-light 3s ease-in-out infinite",
        "gradient-x": "gradient-x 15s ease infinite",
      },
      boxShadow: {
        'glow': '0 0 15px rgba(79, 70, 229, 0.5)',
        'glow-lg': '0 0 25px rgba(79, 70, 229, 0.6)',
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
};