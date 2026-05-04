"use client";

import { useState, useRef, useCallback } from "react";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";

interface Source {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  type: "bookmark" | "note";
  similarity: number;
  snippet?: string;
}

interface SearchEntry {
  query: string;
  answer: string;
  sources: Source[];
  totalMatches: number;
  streaming: boolean;
}

export function ChatInterface() {
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const entryIndex = 0;

    setHistory((prev) => [
      { query, answer: "", sources: [], totalMatches: 0, streaming: true },
      ...prev,
    ]);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&mode=stream`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const contentType = res.headers.get("Content-Type") ?? "";

      if (contentType.includes("text/event-stream") && res.body) {
        // SSE streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);

            try {
              const event = JSON.parse(payload);

              if (event.type === "sources") {
                setHistory((prev) => {
                  const updated = [...prev];
                  updated[entryIndex] = {
                    ...updated[entryIndex],
                    sources: event.sources,
                    totalMatches: event.totalMatches,
                  };
                  return updated;
                });
                setLoading(false);
              } else if (event.type === "token") {
                setHistory((prev) => {
                  const updated = [...prev];
                  updated[entryIndex] = {
                    ...updated[entryIndex],
                    answer: updated[entryIndex].answer + event.token,
                  };
                  return updated;
                });
              } else if (event.type === "done") {
                setHistory((prev) => {
                  const updated = [...prev];
                  updated[entryIndex] = {
                    ...updated[entryIndex],
                    streaming: false,
                  };
                  return updated;
                });
              }
            } catch {
              // malformed event, skip
            }
          }
        }
      } else {
        // Non-streaming JSON fallback (e.g. empty results)
        const data = await res.json();
        setHistory((prev) => {
          const updated = [...prev];
          updated[entryIndex] = {
            query,
            answer: data.answer ?? "",
            sources: data.sources ?? [],
            totalMatches: data.totalMatches ?? (data.sources?.length ?? 0),
            streaming: false,
          };
          return updated;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setHistory((prev) => {
        const updated = [...prev];
        if (updated[entryIndex]) {
          updated[entryIndex] = { ...updated[entryIndex], streaming: false };
        }
        return updated;
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <SearchBar onSearch={handleSearch} loading={loading} />

      {loading && history.length > 0 && history[0].sources.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "300ms" }} />
          </div>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Searching your knowledge base...
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border" style={{ borderColor: "var(--error)" }}>
          <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {history.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <h3 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            Chat with your knowledge
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
            Ask questions about your notes and bookmarks. The AI will search through
            your knowledge base using semantic understanding and provide answers with sources.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {history.map((entry, i) => (
          <div key={i}>
            <div className="mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>
                Q
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {entry.query}
              </span>
            </div>
            <SearchResults
              answer={entry.answer}
              sources={entry.sources}
              query={entry.query}
              totalMatches={entry.totalMatches}
              streaming={entry.streaming}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
