"use client";

interface StatsCardsProps {
  stats: {
    notes: number;
    bookmarks: number;
    tags: number;
    embeddings: number;
  };
}

const statConfig = [
  {
    key: "notes" as const,
    label: "Notes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "#6366f1",
  },
  {
    key: "bookmarks" as const,
    label: "Bookmarks",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
    color: "#22c55e",
  },
  {
    key: "tags" as const,
    label: "Tags",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
    color: "#f59e0b",
  },
  {
    key: "embeddings" as const,
    label: "Embeddings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    color: "#ec4899",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((cfg) => (
        <div
          key={cfg.key}
          className="rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {cfg.label}
            </p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
            >
              {cfg.icon}
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {stats[cfg.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
