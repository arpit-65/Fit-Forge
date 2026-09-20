import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Component — reads auth session on the server.
 * Styled with FitForge tokens: --ff-bg-primary, --ff-border, --ff-accent.
 */
export async function Navbar() {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Supabase env vars not set yet — safe to ignore during development
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ff-border)] bg-[var(--ff-bg-primary)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ff-accent)] text-[var(--ff-bg-primary)] text-sm font-black">
            F
          </div>
          <span className="gradient-text font-black text-xl tracking-tight">FitForge</span>
        </Link>

        {/* Navigation links (client for active state) */}
        <NavLinks isAuthenticated={!!userEmail} />

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-[var(--ff-text-secondary)] sm:block">
                {userEmail}
              </span>
              <Link
                href="/api/auth/logout"
                className="rounded-full border border-[var(--ff-border)] px-4 py-1.5 text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] hover:border-[var(--ff-accent)]/50 transition-colors"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-4 py-1.5 text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--ff-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--ff-bg-primary)] hover:brightness-110 transition-all glow-accent"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
