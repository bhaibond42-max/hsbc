import { clsx } from "clsx";

export function MetricGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>;
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "brand" | "muted";
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={clsx(
          "mt-1 text-xl font-semibold tabular-nums tracking-tight",
          tone === "brand" && "text-brand",
          tone === "muted" && "text-muted",
          tone === "default" && "text-charcoal",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-md border border-line bg-mist px-3 py-2 text-xs leading-relaxed text-muted">
      {children}
    </p>
  );
}
