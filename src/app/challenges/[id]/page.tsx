/** Challenge detail — Server Component stub (Step 1). */
export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black text-slate-100 mb-2">Challenge</h1>
      <p className="text-slate-500 font-mono text-sm mb-8">ID: {params.id}</p>
      <div className="glass rounded-2xl border border-white/5 p-12 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-xl font-bold text-slate-200 mb-2">Coming in Step 3</h2>
        <p className="text-slate-400 text-sm">Challenge details, leaderboard, and join flow.</p>
      </div>
    </div>
  );
}
