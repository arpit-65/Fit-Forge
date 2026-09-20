"use client";
export default function SquadsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 flex justify-center">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center space-y-5">
        <div className="text-4xl">👥</div>
        <h2 className="text-xl font-bold">Could not load squads</h2>
        <p className="text-slate-400 text-sm">{error.message}</p>
        <button onClick={reset} className="px-6 py-2.5 bg-brand rounded-full text-sm font-semibold text-white hover:bg-brand-dark transition-all">Retry</button>
      </div>
    </div>
  );
}
