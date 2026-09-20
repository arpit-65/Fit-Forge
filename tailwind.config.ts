import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FitForge exact palette tokens (via CSS vars)
        "ff-bg-primary": "var(--ff-bg-primary, #0B0F14)",
        "ff-bg-secondary": "var(--ff-bg-secondary, #131A22)",
        "ff-border": "var(--ff-border, #223040)",
        "ff-text-primary": "var(--ff-text-primary, #EAF2F5)",
        "ff-text-secondary": "var(--ff-text-secondary, #8CA0AD)",
        "ff-accent": "var(--ff-accent, #4F9C8F)",
        "ff-risk-low": "var(--ff-risk-low, #2ECC71)",
        "ff-risk-mid": "var(--ff-risk-mid, #F5A623)",
        "ff-risk-high": "var(--ff-risk-high, #E5484D)",
        "ff-gold": "var(--ff-gold, #FFD166)",

        // Namespaced object for convenient utility classes (e.g., bg-ff-bg-primary, text-ff-accent)
        ff: {
          bg: {
            primary: "var(--ff-bg-primary, #0B0F14)",
            secondary: "var(--ff-bg-secondary, #131A22)",
          },
          border: "var(--ff-border, #223040)",
          text: {
            primary: "var(--ff-text-primary, #EAF2F5)",
            secondary: "var(--ff-text-secondary, #8CA0AD)",
          },
          accent: "var(--ff-accent, #4F9C8F)",
          risk: {
            low: "var(--ff-risk-low, #2ECC71)",
            mid: "var(--ff-risk-mid, #F5A623)",
            high: "var(--ff-risk-high, #E5484D)",
          },
          gold: "var(--ff-gold, #FFD166)",
        },

        // Backward-compatible mappings
        brand: {
          DEFAULT: "var(--ff-accent, #4F9C8F)",
          light: "#6bbab0",
          dark: "#3a7a6f",
        },
        risk: {
          low: "var(--ff-risk-low, #2ECC71)",
          medium: "var(--ff-risk-mid, #F5A623)",
          mid: "var(--ff-risk-mid, #F5A623)",
          high: "var(--ff-risk-high, #E5484D)",
        },
        background: "var(--ff-bg-primary, #0B0F14)",
        surface: {
          DEFAULT: "var(--ff-bg-secondary, #131A22)",
          2: "#182330",
          3: "#223040",
        },
        border: "var(--ff-border, #223040)",
      },
      fontFamily: {
        // Inter for body/UI
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Playfair Display for hero headline and section titles ONLY
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 12px rgba(79, 156, 143, 0.45))",
          },
          "50%": {
            opacity: "0.85",
            filter: "drop-shadow(0 0 24px rgba(79, 156, 143, 0.8))",
          },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
