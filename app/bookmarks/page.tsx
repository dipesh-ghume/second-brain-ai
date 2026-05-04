"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loading";

interface Tag { id: string; name: string; }
interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  category: string;
  favicon: string | null;
  tags: Tag[];
  createdAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then(setBookmarks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Bookmarks</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Save URLs and let AI analyze them for you
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/bookmarks/import">
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import
            </Button>
          </Link>
          <Link href="/bookmarks/new">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Bookmark
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>No bookmarks yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Save your first URL to get AI-powered insights
          </p>
          <Link href="/bookmarks/new">
            <Button>Add Your First Bookmark</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((b) => (
            <BookmarkCard key={b.id} {...b} />
          ))}
        </div>
      )}
    </div>
  );
}
