"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { truncate, timeAgo, stripHtml } from "@/lib/utils/text";

interface Tag { id: string; name: string; }
interface NoteCardProps {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: Tag[];
  createdAt: string;
}

export function NoteCard({ id, title, content, summary, tags, createdAt }: NoteCardProps) {
  const preview = summary || truncate(stripHtml(content), 150);

  return (
    <Link href={`/notes/${id}`} className="block">
      <div
        className="rounded-xl border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold text-sm mb-2 line-clamp-1" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="text-sm line-clamp-3 mb-3" style={{ color: "var(--text-secondary)" }}>
          {preview}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
          <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
            {timeAgo(new Date(createdAt))}
          </span>
        </div>
      </div>
    </Link>
  );
}
