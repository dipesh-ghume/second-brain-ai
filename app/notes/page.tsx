"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NoteCard } from "@/components/notes/note-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loading";

interface Tag { id: string; name: string; }
interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: Tag[];
  createdAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Notes</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your second brain — write, think, and let AI help you organize
          </p>
        </div>
        <Link href="/notes/new">
          <Button>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Note
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>No notes yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Create your first note and let AI help organize your thoughts
          </p>
          <Link href="/notes/new">
            <Button>Create Your First Note</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => (
            <NoteCard key={n.id} {...n} />
          ))}
        </div>
      )}
    </div>
  );
}
