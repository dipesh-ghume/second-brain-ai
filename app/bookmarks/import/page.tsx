"use client";

import { useRouter } from "next/navigation";
import { BookmarkImport } from "@/components/bookmarks/bookmark-import";

export default function ImportBookmarksPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.push("/bookmarks")}
          className="flex items-center gap-1 text-sm transition-colors mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Bookmarks
        </button>

        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Import Browser Bookmarks
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Upload your browser&apos;s bookmark export file. Duplicates are automatically skipped
          and AI will summarize each new bookmark in the background.
        </p>
      </div>

      <BookmarkImport onComplete={() => router.refresh()} />
    </div>
  );
}
