"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { ThinkingPanel } from "@/components/notes/thinking-panel";
import { timeAgo } from "@/lib/utils/text";

interface Tag { id: string; name: string; }
interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  actionItems: string[] | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setNote)
      .catch(() => router.push("/notes"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Delete this note?")) return;
    setDeleting(true);
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/notes");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/notes")}
        className="flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Notes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{note.title}</h1>
              <div className="flex gap-2 flex-shrink-0 ml-4">
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                  Delete
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              <span>Created {timeAgo(new Date(note.createdAt))}</span>
              {note.createdAt !== note.updatedAt && (
                <span>Updated {timeAgo(new Date(note.updatedAt))}</span>
              )}
            </div>

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {note.tags.map((tag) => (
                  <Badge key={tag.id} variant="accent">{tag.name}</Badge>
                ))}
              </div>
            )}

            <div
              className="text-sm leading-relaxed prose-content"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ThinkingPanel
            noteId={note.id}
            summary={note.summary}
            actionItems={note.actionItems}
            tags={note.tags}
          />
        </div>
      </div>
    </div>
  );
}
