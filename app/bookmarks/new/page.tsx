import { BookmarkForm } from "@/components/bookmarks/bookmark-form";

export default function NewBookmarkPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Add Bookmark
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Paste a URL and let AI extract key insights, tags, and a summary
        </p>
      </div>
      <BookmarkForm />
    </div>
  );
}
