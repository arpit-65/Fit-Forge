/**
 * lib/motion.ts
 * Shared Framer Motion variants + design tokens for FitForge.
 * Import and reuse these everywhere — never write one-off animation props inline.
 */

import type { Variants } from "framer-motion";

// ─── Variant: Fade Up ────────────────────────────────────────────────────────
// Use on every section card / content block.
// Pair with viewport={{ once: true, margin: "-100px" }} on <motion.div>.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Variant: Stagger Container ──────────────────────────────────────────────
// Wrap a list of motion children with this parent to stagger their entrance.
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

// ─── Variant: Hover Lift ─────────────────────────────────────────────────────
// Apply as whileHover / whileTap directly, or spread into motion props.
export const hoverLift = {
  whileHover: { scale: 1.03, y: -4, transition: { duration: 0.2, ease: "easeOut" } },
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

// ─── Variant: Fade In (simple, no y movement) ───────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

// ─── Variant: Slide In from left ─────────────────────────────────────────────
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Variant: Slide In from right ────────────────────────────────────────────
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Shared Viewport Config ──────────────────────────────────────────────────
// Pass this to every motion element's `viewport` prop.
export const viewportOnce = { once: true, margin: "-100px" } as const;

// ─── Design Tokens (JS side — mirrors CSS vars) ──────────────────────────────
export const tokens = {
  // spacing rhythm
  sectionY: "py-24 md:py-32",
  container: "max-w-7xl mx-auto px-4 md:px-8",

  // card primitives
  card: "rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]",
  cardPadding: "p-6 md:p-8",

  // shadow scale
  shadowSm: "shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
  shadowMd: "shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
  shadowLg: "shadow-[0_8px_48px_rgba(0,0,0,0.65)]",
  shadowAccent: "shadow-[0_0_32px_rgba(79,156,143,0.18)]",
  shadowGold: "shadow-[0_0_32px_rgba(255,209,102,0.15)]",
} as const;
