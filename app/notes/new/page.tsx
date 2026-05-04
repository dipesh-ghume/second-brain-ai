"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NoteEditor } from "@/components/notes/note-editor";
import { Button } from "@/components/ui/button";
import { AIProcessing } from "@/components/ui/loading";

export default function NewNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save note");
      }

      const note = await res.json();
      router.push(`/notes/${note.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>New Note</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Capture your thoughts — AI will summarize and tag automatically
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push("/notes")}>Cancel</Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim() || !content.trim()}>
            Save Note
          </Button>
        </div>
      </div>

      {saving && <AIProcessing message="Saving note and generating AI summary..." />}

      {error && (
        <div className="mb-4 p-4 rounded-xl border" style={{ borderColor: "var(--error)", backgroundColor: "rgba(239,68,68,0.08)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Give your note a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      <NoteEditor content={content} onChange={setContent} placeholder="Start writing your thoughts..." />
    </div>
  );
}
