"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  type: "bookmark" | "note";
  similarity: number;
  snippet?: string;
}

interface SearchResultsProps {
  answer: string;
  sources: Source[];
  query: string;
  totalMatches?: number;
  streaming?: boolean;
}

function similarityColor(sim: number): string {
  if (sim >= 0.7) return "var(--success)";
  if (sim >= 0.4) return "var(--warning)";
  return "var(--text-muted)";
}

export function SearchResults({ answer, sources, totalMatches, streaming }: SearchResultsProps) {
  return (
    <div className="space-y-6">
      {/* Sources appear first and instantly */}
      {sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Sources ({sources.length})
          </h3>
          <div className="space-y-2">
            {sources.map((source) => {
              const simPercent = Math.max(0, Math.round(source.similarity * 100));
              return (
                <Link
                  key={source.id}
                  href={source.type === "bookmark" ? `/bookmarks/${source.id}` : `/notes/${source.id}`}
                  className="block"
                >
                  <div
                    className="rounded-lg border p-3 transition-colors hover:border-[var(--accent)]"
                    style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={source.type === "bookmark" ? "accent" : "success"}>
                        {source.type}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${simPercent}%`,
                              backgroundColor: similarityColor(source.similarity),
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: similarityColor(source.similarity) }}>
                          {simPercent}%
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {source.title}
                    </h4>
                    {source.snippet && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {source.snippet}
                      </p>
                    )}
                    {!source.snippet && source.summary && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {source.summary}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Answer streams in after sources */}
      {(answer || streaming) && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-light)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              AI Answer
            </h3>
            {(totalMatches ?? sources.length) > 0 && (
              <Badge variant="accent">
                {totalMatches ?? sources.length} source{(totalMatches ?? sources.length) !== 1 ? "s" : ""} matched
              </Badge>
            )}
            {streaming && (
              <span
                className="text-xs animate-pulse"
                style={{ color: "var(--accent)" }}
              >
                thinking...
              </span>
            )}
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {answer}
            {streaming && (
              <span
                className="inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm"
                style={{ backgroundColor: "var(--accent)" }}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
