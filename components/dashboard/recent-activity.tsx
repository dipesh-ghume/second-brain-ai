"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils/text";

interface ActivityItem {
  id: string;
  title: string;
  type: "bookmark" | "note";
  createdAt: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          No recent activity. Start by saving a bookmark or creating a note.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Recent Activity</CardTitle>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.type === "bookmark" ? `/bookmarks/${item.id}` : `/notes/${item.id}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant={item.type === "bookmark" ? "accent" : "success"} className="flex-shrink-0">
                {item.type}
              </Badge>
              <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {item.title}
              </span>
            </div>
            <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
              {timeAgo(new Date(item.createdAt))}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
