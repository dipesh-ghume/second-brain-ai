"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIProcessing } from "@/components/ui/loading";
import { BrainWeek } from "@/components/dashboard/brain-week";

export default function InsightsPage() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Insights</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          AI-powered analysis of your knowledge base — patterns, trends, and connections
        </p>
      </div>

      <BrainWeek />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Knowledge Patterns</CardTitle>
          <Button size="sm" variant="secondary" onClick={loadInsights} loading={loading}>
            Refresh
          </Button>
        </div>

        {loading && <AIProcessing message="Analyzing patterns in your knowledge base..." />}

        {!loading && loaded && insights.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Add more notes and bookmarks to unlock AI-powered insights about your knowledge patterns.
          </p>
        )}

        {!loading && insights.length > 0 && (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex gap-3 p-3 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {insight}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
