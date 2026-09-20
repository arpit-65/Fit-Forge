"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "clsx";

interface NavLinksProps {
  isAuthenticated: boolean;
}

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Athlete Dashboard" },
  { href: "/challenges", label: "Challenges" },
  { href: "/squads", label: "Squads" },
  { href: "/analytics", label: "Live Analytics" },
  { href: "/admin", label: "Admin Operations" },
];

const authedLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Athlete Dashboard" },
  { href: "/challenges", label: "Challenges" },
  { href: "/squads", label: "Squads" },
  { href: "/analytics", label: "Live Analytics" },
  { href: "/admin", label: "Admin Operations" },
];

/**
 * Client Component — active link highlighting with FitForge theme tokens.
 */
export function NavLinks({ isAuthenticated }: NavLinksProps) {
  const pathname = usePathname();
  const links = isAuthenticated ? authedLinks : publicLinks;

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map(({ href, label }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-[var(--ff-accent)]/15 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30 font-semibold"
                : "text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] hover:bg-[var(--ff-bg-secondary)]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
