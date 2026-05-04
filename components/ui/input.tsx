import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] placeholder:text-[var(--text-muted)] ${className}`}
          style={{
            backgroundColor: "var(--bg-primary)",
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

Input.displayName = "Input";
