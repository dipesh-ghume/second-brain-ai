"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { extractDomain, timeAgo } from "@/lib/utils/text";

interface Tag {
  id: string;
  name: string;
}

interface BookmarkCardProps {
  id: string;
  url: string;
  title: string;
  summary: string;
  category: string;
  favicon: string | null;
  tags: Tag[];
  createdAt: string;
}

export function BookmarkCard({ id, url, title, summary, category, favicon, tags, createdAt }: BookmarkCardProps) {
  return (
    <Link href={`/bookmarks/${id}`} className="block">
      <div
        className="rounded-xl border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start gap-3 mb-3">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {extractDomain(url)}
            </p>
          </div>
          <Badge variant="accent">{category}</Badge>
        </div>

        <p className="text-sm line-clamp-3 mb-3" style={{ color: "var(--text-secondary)" }}>
          {summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
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
