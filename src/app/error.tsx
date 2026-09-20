"use client";

/**
 * Root error boundary — catches unhandled errors across the app.
 * Styled with FitForge tokens: --ff-bg-secondary, --ff-risk-high, --ff-accent.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 animate-slide-up border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/85">
        {/* Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--ff-risk-high)]/10 border border-[var(--ff-risk-high)]/30 flex items-center justify-center mx-auto text-[var(--ff-risk-high)]">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--ff-text-primary)]">
            Something went wrong
          </h2>
          <p className="text-[var(--ff-text-secondary)] text-sm leading-relaxed">
            {error.message || "An unexpected error occurred while loading this view."}
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--ff-text-secondary)]/60 font-mono">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--ff-accent)] hover:brightness-110 rounded-full text-sm font-semibold text-[var(--ff-bg-primary)] transition-all glow-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
