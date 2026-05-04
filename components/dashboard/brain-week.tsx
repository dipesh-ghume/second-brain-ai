"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIProcessing } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

interface WeeklyReport {
  report: string;
  stats: { bookmarks: number; notes: number };
  topTopics: Array<{ name: string; count: number }>;
}

export function BrainWeek() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/weekly");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Your Brain This Week</CardTitle>
        <Button size="sm" variant={report ? "secondary" : "primary"} onClick={generateReport} loading={loading}>
          {report ? "Refresh" : "Generate Report"}
        </Button>
      </div>

      {loading && <AIProcessing message="Analyzing your weekly brain activity..." />}

      {report && !loading && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: "var(--accent-light)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{report.stats.bookmarks}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>bookmarks</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
              <p className="text-lg font-bold text-green-500">{report.stats.notes}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>notes</p>
            </div>
          </div>

          {report.topTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.topTopics.map((topic) => (
                <Badge key={topic.name} variant="accent">
                  {topic.name} ({topic.count})
                </Badge>
              ))}
            </div>
          )}

          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {report.report}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border" style={{ borderColor: "var(--error)", backgroundColor: "rgba(239,68,68,0.05)" }}>
          <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {!report && !loading && !error && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Click &ldquo;Generate Report&rdquo; to get an AI-powered summary of your knowledge activity this week.
        </p>
      )}
    </Card>
  );
}
