export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function AIProcessing({ message = "AI is thinking..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: "var(--accent-light)" }}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "var(--accent)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-4 h-4 animate-pulse-glow" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{message}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}>
      <div className="h-4 w-3/4 rounded animate-shimmer" style={{ backgroundColor: "var(--bg-tertiary)" }} />
      <div className="h-3 w-full rounded animate-shimmer" style={{ backgroundColor: "var(--bg-tertiary)" }} />
      <div className="h-3 w-5/6 rounded animate-shimmer" style={{ backgroundColor: "var(--bg-tertiary)" }} />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-16 rounded-full animate-shimmer" style={{ backgroundColor: "var(--bg-tertiary)" }} />
        <div className="h-5 w-12 rounded-full animate-shimmer" style={{ backgroundColor: "var(--bg-tertiary)" }} />
      </div>
    </div>
  );
}
