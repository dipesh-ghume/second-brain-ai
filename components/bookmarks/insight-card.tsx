import { Card } from "@/components/ui/card";

interface InsightCardProps {
  insights: string[];
}

export function InsightCard({ insights }: InsightCardProps) {
  if (!insights.length) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
          <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          Instant Insights
        </h4>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>
              {i + 1}.
            </span>
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  );
}
