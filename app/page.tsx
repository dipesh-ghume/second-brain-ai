"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BrainWeek } from "@/components/dashboard/brain-week";
import { SkeletonCard } from "@/components/ui/loading";

interface Stats {
  notes: number;
  bookmarks: number;
  tags: number;
  embeddings: number;
}

interface ActivityItem {
  id: string;
  title: string;
  type: "bookmark" | "note";
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setActivity(data.recentActivity);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity items={activity} />
        <BrainWeek />
      </div>
    </div>
  );
}
