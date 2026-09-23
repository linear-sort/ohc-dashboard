type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const normalized = status.trim().toLowerCase();
  let tone = "bg-[var(--surface-2)] text-[var(--foreground)]";

  if (normalized === "found") {
    tone = "bg-emerald-100 text-emerald-900";
  } else if (normalized.includes("queue") || normalized.includes("progress")) {
    tone = "bg-amber-100 text-amber-950";
  } else if (normalized.includes("fail") || normalized.includes("error")) {
    tone = "bg-red-100 text-red-900";
  }

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {status || "—"}
    </span>
  );
}
