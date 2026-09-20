import Link from "next/link";

/**
 * 404 Not Found Page — FitForge.
 * Uses FitForge color tokens and font-display (Playfair Display) for the title.
 */
export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 animate-slide-up border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/85">
        <div className="w-16 h-16 rounded-2xl bg-[var(--ff-accent)]/10 border border-[var(--ff-accent)]/30 flex items-center justify-center mx-auto text-[var(--ff-accent)]">
          <span className="text-2xl font-black">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--ff-text-primary)] font-display">
            Page Not Found
          </h1>
          <p className="text-[var(--ff-text-secondary)] text-sm leading-relaxed">
            The fitness cohort, challenge, or dashboard link could not be located.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-[var(--ff-accent)] hover:brightness-110 rounded-full text-sm font-semibold text-[var(--ff-bg-primary)] transition-all glow-accent"
          >
            Return to FitForge
          </Link>
        </div>
      </div>
    </div>
  );
}
