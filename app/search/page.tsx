import { ChatInterface } from "@/components/search/chat-interface";

export default function SearchPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Knowledge Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Ask natural language questions — AI will search your notes and bookmarks semantically
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
