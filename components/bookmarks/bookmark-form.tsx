"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AIProcessing } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";

interface BookmarkResult {
  id: string;
  title: string;
  summary: string;
  tags: { id: string; name: string }[];
  insights?: string[];
}

export function BookmarkForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookmarkResult | null>(null);
  const router = useRouter();

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: Record<string, unknown> = { url: url.trim() };
      if (title.trim()) payload.title = title.trim();
      if (tags.length > 0) payload.tags = tags;
      if (notes.trim()) payload.notes = notes.trim();

      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save bookmark");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setUrl("");
    setTitle("");
    setTags([]);
    setTagInput("");
    setNotes("");
    setShowOptional(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="Paste a URL (webpage, YouTube video, article...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" loading={loading} disabled={!url.trim()}>
            {loading ? "Analyzing..." : "Save & Analyze"}
          </Button>
        </div>

        {!showOptional && url.trim() && (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="text-sm flex items-center gap-1 transition-colors"
            style={{ color: "var(--accent)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add title, tags, or notes
          </button>
        )}

        {showOptional && (
          <div
            className="space-y-4 p-4 rounded-xl border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-primary)" }}
          >
            <Input
              label="Custom Title (optional)"
              placeholder="Override the auto-detected title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Tags (optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Type a tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={loading}
                  />
                </div>
                <Button type="button" variant="secondary" size="md" onClick={addTag} disabled={!tagInput.trim()}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors"
                      style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                      onClick={() => removeTag(tag)}
                      title="Click to remove"
                    >
                      {tag}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                AI will also auto-generate tags. Your tags will be added alongside them.
              </p>
            </div>

            <Textarea
              label="Your Notes (optional)"
              placeholder="Add your own thoughts, context, or why this is important..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        )}
      </form>

      {loading && <AIProcessing message="Fetching content and generating AI insights..." />}

      {error && (
        <div className="p-4 rounded-xl border" style={{ borderColor: "var(--error)", backgroundColor: "rgba(239,68,68,0.05)" }}>
          <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {result && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Bookmark saved!
              </h3>
              <Badge variant="success">Saved</Badge>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1" style={{ color: "var(--text-primary)" }}>{result.title}</h4>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{result.summary}</p>
            </div>

            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <Badge key={tag.id} variant="accent">{tag.name}</Badge>
                ))}
              </div>
            )}

            {result.insights && result.insights.length > 0 && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--accent-light)" }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--accent)" }}>
                  Key Insights
                </h4>
                <ul className="space-y-1.5">
                  {result.insights.map((insight, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)" }}>-</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push(`/bookmarks/${result.id}`)}>
                View Details
              </Button>
              <Button size="sm" variant="secondary" onClick={resetForm}>
                Add Another
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
