interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  accent: "bg-[var(--accent-light)] text-[var(--accent)]",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-amber-500/10 text-amber-500",
  error: "bg-red-500/10 text-red-500",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
