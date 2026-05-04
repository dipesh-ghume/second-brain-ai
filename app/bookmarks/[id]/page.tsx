"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { extractDomain, timeAgo } from "@/lib/utils/text";

interface Tag { id: string; name: string; }
interface Bookmark {
  id: string;
  url: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  favicon: string | null;
  tags: Tag[];
  createdAt: string;
}

export default function BookmarkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/bookmarks/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setBookmark)
      .catch(() => router.push("/bookmarks"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Delete this bookmark?")) return;
    setDeleting(true);
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    router.push("/bookmarks");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!bookmark) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/bookmarks")}
        className="flex items-center gap-1 text-sm transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Bookmarks
      </button>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {bookmark.favicon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bookmark.favicon} alt="" className="w-6 h-6 rounded mt-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{bookmark.title}</h1>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
                  {extractDomain(bookmark.url)}
                </a>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>AI Summary</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{bookmark.summary}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="accent">{bookmark.category}</Badge>
            {bookmark.tags.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>

          <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Saved {timeAgo(new Date(bookmark.createdAt))}</span>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
                className="hover:underline" style={{ color: "var(--accent)" }}>
                Open Original
              </a>
            </div>
          </div>
        </div>
      </Card>

      {bookmark.content && (
        <Card>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Extracted Content
          </h3>
          <div className="text-sm leading-relaxed max-h-96 overflow-y-auto" style={{ color: "var(--text-secondary)" }}>
            {bookmark.content.slice(0, 3000)}
            {bookmark.content.length > 3000 && "..."}
          </div>
        </Card>
      )}
    </div>
  );
}
