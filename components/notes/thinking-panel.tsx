"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AIProcessing } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

interface ThinkingPanelProps {
  noteId: string;
  summary: string | null;
  actionItems: string[] | null;
  tags: { id: string; name: string }[];
}

export function ThinkingPanel({ noteId, summary, actionItems, tags }: ThinkingPanelProps) {
  const [relatedNotes, setRelatedNotes] = useState<Array<{ id: string; title: string; distance: number }>>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const findRelated = async () => {
    setLoadingRelated(true);
    try {
      const res = await fetch(`/api/search?q=related:${noteId}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRelatedNotes(data.sources || []);
      }
    } finally {
      setLoadingRelated(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
          <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          AI Assistant
        </h3>
      </div>

      {summary && (
        <Card className="!p-4">
          <h4 className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Summary
          </h4>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{summary}</p>
        </Card>
      )}

      {actionItems && actionItems.length > 0 && (
        <Card className="!p-4">
          <h4 className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Action Items
          </h4>
          <ul className="space-y-1">
            {actionItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tags.length > 0 && (
        <Card className="!p-4">
          <h4 className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="accent">{tag.name}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="!p-4">
        <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Related Notes
        </h4>
        {loadingRelated ? (
          <AIProcessing message="Finding related notes..." />
        ) : relatedNotes.length > 0 ? (
          <ul className="space-y-1.5">
            {relatedNotes.map((n) => (
              <li key={n.id}>
                <a href={`/notes/${n.id}`} className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
                  {n.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Button size="sm" variant="secondary" onClick={findRelated}>
            Find Related
          </Button>
        )}
      </Card>
    </div>
  );
}
