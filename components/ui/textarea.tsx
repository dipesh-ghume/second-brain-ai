import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-muted)] resize-y ${className}`}
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: error ? "var(--error)" : "var(--border)",
            color: "var(--text-primary)",
          }}
          {...props}
        />
        {error && (
          <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
