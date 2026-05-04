"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImportedItem {
  url: string;
  title: string;
  status: "imported" | "duplicate" | "failed";
  error?: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
  folders: string[];
  results: ImportedItem[];
}

export function BookmarkImport({ onComplete }: { onComplete?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setError("Please upload an HTML bookmark export file. Go to your browser's Bookmark Manager and choose 'Export bookmarks'.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bookmarks/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
      if (data.imported > 0) onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="relative rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer"
        style={{
          borderColor: dragging ? "var(--accent)" : "var(--border)",
          backgroundColor: dragging ? "var(--accent-light)" : "var(--bg-secondary)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={handleInputChange}
        />

        <svg className="w-12 h-12 mx-auto mb-3" style={{ color: dragging ? "var(--accent)" : "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>

        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
          {dragging ? "Drop your bookmark file here" : "Drag & drop your bookmark export file"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          or click to browse &middot; Accepts HTML bookmark exports from Chrome, Firefox, Edge, Brave, Safari
        </p>
      </div>

      {/* How to export instructions */}
      <details className="text-sm" style={{ color: "var(--text-secondary)" }}>
        <summary className="cursor-pointer font-medium" style={{ color: "var(--text-primary)" }}>
          How to export bookmarks from your browser
        </summary>
        <div className="mt-2 space-y-2 pl-4">
          <p><strong>Chrome / Brave / Edge:</strong> Open Bookmark Manager (Ctrl+Shift+O) → click the ⋮ menu → &quot;Export bookmarks&quot;</p>
          <p><strong>Firefox:</strong> Open Bookmarks (Ctrl+Shift+O) → &quot;Import and Backup&quot; → &quot;Export Bookmarks to HTML&quot;</p>
          <p><strong>Safari:</strong> File → &quot;Export Bookmarks…&quot;</p>
        </div>
      </details>

      {uploading && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)", animationDelay: "300ms" }} />
            </div>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Parsing and importing bookmarks...
            </span>
          </div>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-xl border" style={{ borderColor: "var(--error)", backgroundColor: "rgba(239,68,68,0.05)" }}>
          <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {result && (
        <Card>
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Import Complete
              </h3>
              <Badge variant="success">{result.imported} imported</Badge>
              {result.duplicates > 0 && (
                <Badge>{result.duplicates} already exist</Badge>
              )}
              {result.failed > 0 && (
                <Badge variant="accent">{result.failed} failed</Badge>
              )}
            </div>

            {result.imported > 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                AI is summarizing and generating tags for imported bookmarks in the background. Refresh the page in a few minutes to see the results.
              </p>
            )}

            {/* Stat blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                <p className="text-xl font-bold text-green-500">{result.imported}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>New</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--text-secondary)" }}>{result.duplicates}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Duplicates</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: result.failed > 0 ? "rgba(239,68,68,0.1)" : "var(--bg-secondary)" }}>
                <p className="text-xl font-bold" style={{ color: result.failed > 0 ? "var(--error)" : "var(--text-secondary)" }}>{result.failed}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Failed</p>
              </div>
            </div>

            {/* Imported items list (collapsed by default if many) */}
            {result.results.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  View all {result.results.length} bookmarks
                </summary>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
                  {result.results.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded text-xs"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === "imported"
                          ? "bg-green-500"
                          : item.status === "duplicate"
                            ? "bg-gray-400"
                            : "bg-red-500"
                      }`} />
                      <span
                        className="truncate flex-1"
                        style={{ color: "var(--text-secondary)" }}
                        title={item.url}
                      >
                        {item.title || item.url}
                      </span>
                      <span className="flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setResult(null); setError(null); }}>
                Import More
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
