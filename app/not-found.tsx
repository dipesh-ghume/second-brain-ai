import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl font-bold mb-2" style={{ color: "var(--text-muted)" }}>404</div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Page not found
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
