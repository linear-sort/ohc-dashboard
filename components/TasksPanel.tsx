"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getErrorPayload,
  ohcFetch,
  type ApiErrorPayload,
} from "@/lib/ohc/api-browser";
import type { ListTasksResponse, TaskItem } from "@/lib/ohc/types";

const REFRESH_MS = 60_000;

type SortKey =
  | "created_at"
  | "hash"
  | "algorithm"
  | "status"
  | "lastAttack"
  | "usernote";

type SortDir = "asc" | "desc";

/** Lower rank sorts first when direction is asc (FOUND on top). */
function statusRank(status: string): number {
  const normalized = status.trim().toLowerCase();
  if (normalized === "found") return 0;
  if (normalized.includes("progress") || normalized.includes("running")) return 1;
  if (normalized.includes("queue") || normalized.includes("pending")) return 2;
  if (!normalized) return 4;
  return 3;
}

function compareTasks(a: TaskItem, b: TaskItem, key: SortKey): number {
  if (key === "status") {
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return (a.status || "").localeCompare(b.status || "", undefined, {
      sensitivity: "base",
    });
  }

  if (key === "created_at") {
    const ta = Date.parse(a.created_at.replace(" ", "T")) || 0;
    const tb = Date.parse(b.created_at.replace(" ", "T")) || 0;
    if (ta !== tb) return ta - tb;
  }

  if (key === "algorithm") {
    const byName = (a.algorithm || "").localeCompare(b.algorithm || "", undefined, {
      sensitivity: "base",
    });
    if (byName !== 0) return byName;
    const modeA = Number(a.algomode);
    const modeB = Number(b.algomode);
    if (!Number.isNaN(modeA) && !Number.isNaN(modeB) && modeA !== modeB) {
      return modeA - modeB;
    }
  }

  const left = String(a[key] ?? "");
  const right = String(b[key] ?? "");
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function SortableTh({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  const indicator = active ? (sortDir === "asc" ? "↑" : "↓") : "";

  return (
    <th className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-[var(--foreground)] ${
          active ? "text-[var(--foreground)]" : ""
        }`}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {indicator && <span aria-hidden="true">{indicator}</span>}
      </button>
    </th>
  );
}

export function TasksPanel() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [requestId, setRequestId] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorPayload | { message: string } | null>(
    null,
  );
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Status defaults to FOUND-first; created_at to newest-first.
    if (key === "status") setSortDir("asc");
    else if (key === "created_at") setSortDir("desc");
    else setSortDir("asc");
  }

  const load = useCallback(async () => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      return;
    }

    setLoading(true);
    try {
      const data = await ohcFetch<ListTasksResponse>("list_tasks");
      setTasks(data.tasks ?? []);
      setRequestId(data.request_id);
      setError(null);
      setRateLimitedUntil(null);
      setUpdatedAt(new Date());
    } catch (err) {
      const payload = getErrorPayload(err);
      if (payload) {
        setError(payload);
        if (payload.status === 429 && payload.retry_after) {
          setRateLimitedUntil(Date.now() + payload.retry_after * 1000);
        }
      } else {
        setError({
          message: err instanceof Error ? err.message : "Failed to load tasks.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [rateLimitedUntil]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) return;
    const id = window.setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load, rateLimitedUntil]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filteredTasks = !q
      ? tasks
      : tasks.filter((task) =>
          [task.status, task.hash, task.algorithm, task.algomode, task.usernote]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );

    const sorted = [...filteredTasks].sort((a, b) => {
      const result = compareTasks(a, b, sortKey);
      return sortDir === "asc" ? result : -result;
    });
    return sorted;
  }, [filter, tasks, sortKey, sortDir]);

  const paused =
    rateLimitedUntil !== null && Date.now() < rateLimitedUntil;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-[var(--muted)]">
            Live view of your OHC recovery jobs. Cleartext is never returned by
            the API — use the OHC link when status is FOUND.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter status, hash, algo…"
            className="min-w-[14rem] rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || paused}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {paused && (
        <p className="text-sm text-amber-800">
          Auto-refresh paused due to rate limiting.
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <SortableTh label="Created" column="created_at" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Hash" column="hash" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Algorithm" column="algorithm" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Last attack" column="lastAttack" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Notes" column="usernote" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-[var(--muted)]"
                >
                  {tasks.length === 0
                    ? "No tasks yet. Submit hashes from the Submit page."
                    : "No tasks match this filter."}
                </td>
              </tr>
            )}
            {filtered.map((task) => (
              <tr
                key={`${task.hash}-${task.created_at}-${task.algomode}`}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {task.created_at || "—"}
                </td>
                <td className="max-w-[16rem] truncate px-3 py-2 font-mono text-xs" title={task.hash}>
                  {task.hash}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="font-medium">{task.algorithm || "—"}</span>
                  <span className="ml-1 text-xs text-[var(--muted)]">
                    ({task.algomode})
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={task.status} />
                    {task.status === "FOUND" && task.cleartext_location && (
                      <a
                        href={task.cleartext_location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[var(--link)] underline"
                      >
                        Open in OHC
                      </a>
                    )}
                    {task.pending_tier_upgrade && (
                      <span className="text-xs text-amber-800">
                        Pending tier upgrade
                      </span>
                    )}
                    {task.pending_quota_upgrade && (
                      <span className="text-xs text-amber-800">
                        Pending quota
                      </span>
                    )}
                  </div>
                </td>
                <td className="max-w-[14rem] px-3 py-2 text-xs text-[var(--muted)]">
                  {task.lastAttack || "—"}
                </td>
                <td className="max-w-[10rem] truncate px-3 py-2 text-xs text-[var(--muted)]">
                  {task.usernote || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--muted)]">
        {updatedAt
          ? `Updated ${updatedAt.toLocaleTimeString()} · ${filtered.length}/${tasks.length} shown`
          : "Not loaded yet"}
        {requestId ? ` · request_id ${requestId}` : ""}
        {" · auto-refresh 60s"}
      </p>
    </div>
  );
}
