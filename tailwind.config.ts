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
        "error-container": "#93000a", "secondary-fixed-dim": "#00dbe9", "on-primary-fixed": "#171e00", "on-secondary-container": "#00686f", "outline-variant": "#444932", "on-primary-fixed-variant": "#3e4c00", "surface-container-lowest": "#0a0e13", "error": "#ffb4ab", "on-background": "#e0e2ea", "outline": "#8f9378", "on-secondary-fixed": "#002022", "on-error-container": "#ffdad6", "on-surface": "#e0e2ea", "tertiary-container": "#ffdad5", "inverse-primary": "#536600", "tertiary-fixed": "#ffdad5", "surface-tint": "#b0d500", "surface-variant": "#31353b", "on-tertiary-fixed": "#410001", "primary-fixed": "#caf300", "surface-bright": "#36393f", "tertiary-fixed-dim": "#ffb4aa", "surface-container": "#1c2025", "on-primary-container": "#596c00", "primary": "#ffffff", "primary-container": "#caf300", "secondary-fixed": "#7df4ff", "primary-fixed-dim": "#b0d500", "on-tertiary": "#690003", "surface-container-high": "#262a30", "on-tertiary-container": "#ca0a0f", "secondary": "#d3fbff", "surface-container-highest": "#31353b", "on-surface-variant": "#c5c9ac", "on-tertiary-fixed-variant": "#930005", "secondary-container": "#00eefc", "tertiary": "#ffffff", "surface-dim": "#101419", "on-primary": "#2a3400", "inverse-surface": "#e0e2ea", "inverse-on-surface": "#2d3136", "on-secondary": "#00363a", "on-secondary-fixed-variant": "#004f54", "surface-container-low": "#181c21", "on-error": "#690005",
      },
      fontFamily: {
        "timer-display": ["JetBrains Mono", "monospace"], "display-xl-mobile": ["Space Grotesk", "sans-serif"], "label-badge": ["Space Grotesk", "sans-serif"], "headline-lg": ["Space Grotesk", "sans-serif"], "display-xl": ["Space Grotesk", "sans-serif"], "body-sm": ["Manrope", "sans-serif"], "label-data": ["JetBrains Mono", "monospace"], "body-lg": ["Manrope", "sans-serif"], "headline-md": ["Space Grotesk", "sans-serif"], "headline-sm": ["Space Grotesk", "sans-serif"], "body-md": ["Manrope", "sans-serif"], "timer-display-mobile": ["JetBrains Mono", "monospace"],
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
      spacing: { "space-sm": "0.75rem", "margin-tablet": "1.5rem", "space-2xs": "0.25rem", "gutter-desktop": "1.5rem", "margin-desktop": "2.5rem", "gutter": "1rem", "space-xl": "2rem", "space-xs": "0.5rem", "space-2xl": "3rem", "space-md": "1rem", "margin": "1rem", "space-lg": "1.5rem" },
      fontSize: { "timer-display": ["64px", { lineHeight: "64px", letterSpacing: "-0.05em", fontWeight: "800" }], "display-xl-mobile": ["40px", { lineHeight: "44px", letterSpacing: "-0.03em", fontWeight: "700" }], "label-badge": ["11px", { lineHeight: "14px", letterSpacing: "0.08em", fontWeight: "700" }], "headline-lg": ["32px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "700" }], "display-xl": ["56px", { lineHeight: "60px", letterSpacing: "-0.04em", fontWeight: "700" }], "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }], "label-data": ["13px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }], "body-lg": ["18px", { lineHeight: "26px", fontWeight: "500" }], "headline-md": ["24px", { lineHeight: "30px", letterSpacing: "-0.01em", fontWeight: "600" }], "headline-sm": ["20px", { lineHeight: "26px", letterSpacing: "0em", fontWeight: "600" }], "body-md": ["15px", { lineHeight: "22px", fontWeight: "400" }], "timer-display-mobile": ["48px", { lineHeight: "48px", letterSpacing: "-0.04em", fontWeight: "800" }] },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
