import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#0d141a",
          secondary: "#1d1e20",
          tertiary:  "#211e1b",
        },
        accent: {
          DEFAULT: "#cc6333",
          hover:   "#b5522a",
          light:   "#ffeacc",
        },
        brand: {
          text:    "#ffffff",
          muted:   "#56585e",
          subtle:  "#8a8c92",
          border:  "rgba(255,255,255,0.08)",
        },
        status: {
          green:  "#4caf7d",
          red:    "#e05c5c",
          yellow: "#d4a843",
          blue:   "#6495ed",
        },
      },
      fontFamily: {
        sans:  ["DM Sans", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      borderRadius: {
        // Stile industriale — niente border-radius >6px
        DEFAULT: "2px",
        sm:      "2px",
        md:      "4px",
        lg:      "6px",
        xl:      "6px",
        "2xl":   "6px",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
