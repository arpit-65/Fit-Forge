"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "clsx";

interface NavLinksProps {
  isAuthenticated: boolean;
}

const publicLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/dashboard", label: "Student Tracking", icon: "🔥" },
  { href: "/workout", label: "AI Camera", icon: "📷", badge: "Live AI" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/squads", label: "Squads", icon: "👥" },
  { href: "/analytics", label: "Live Analytics", icon: "📊" },
  { href: "/admin", label: "Admin Operations", icon: "⚙️" },
];

const authedLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/dashboard", label: "Student Tracking", icon: "🔥" },
  { href: "/workout", label: "AI Camera", icon: "📷", badge: "Live AI" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/squads", label: "Squads", icon: "👥" },
  { href: "/analytics", label: "Live Analytics", icon: "📊" },
  { href: "/admin", label: "Admin Operations", icon: "⚙️" },
];

/**
 * Client Component — active link highlighting with FitForge theme tokens.
 * Supports both desktop navigation and responsive mobile drawer.
 */
export function NavLinks({ isAuthenticated }: NavLinksProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = isAuthenticated ? authedLinks : publicLinks;

  // Close mobile drawer upon route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Desktop Navigation">
        {links.map(({ href, label, badge }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all inline-flex items-center gap-1.5",
                isActive
                  ? "bg-[var(--ff-accent)]/15 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30 font-semibold shadow-sm"
                  : "text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] hover:bg-[var(--ff-bg-secondary)]",
              )}
            >
              <span>{label}</span>
              {badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--ff-accent)]/20 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Button (Phone / Tablet Viewports) */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 text-[var(--ff-text-primary)] hover:border-[var(--ff-accent)]/50 transition-colors"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 border-b border-[var(--ff-border)] bg-[var(--ff-bg-primary)]/95 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-[10px] font-mono uppercase text-[var(--ff-text-secondary)] mb-2 px-3 tracking-wider">
              Campus Navigation
            </div>
            <div className="space-y-1">
              {links.map(({ href, label, icon, badge }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--ff-accent)]/15 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30 font-semibold"
                        : "text-[var(--ff-text-primary)] hover:bg-[var(--ff-bg-secondary)] border border-transparent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{icon}</span>
                      <span>{label}</span>
                    </div>
                    {badge ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ff-accent)]/20 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30 font-bold">
                        {badge}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--ff-text-secondary)]">→</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
