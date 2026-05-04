"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-muted)" }}
          fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your knowledge base..."
          disabled={loading}
          className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--text-muted)]"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <Button type="submit" loading={loading} disabled={!query.trim()} size="lg">
        Search
      </Button>
    </form>
  );
}
