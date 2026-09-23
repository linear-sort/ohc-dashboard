"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  getErrorPayload,
  ohcFetch,
  type ApiErrorPayload,
} from "@/lib/ohc/api-browser";
import type { ListWordlistsResponse, Wordlist, WordlistQuota } from "@/lib/ohc/types";

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function WordlistsPanel() {
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [quota, setQuota] = useState<WordlistQuota | null>(null);
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorPayload | { message: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ohcFetch<ListWordlistsResponse>("list_wordlists");
      setWordlists(data.wordlists ?? []);
      setQuota(data.wordlist_quota);
      setRequestId(data.request_id);
      setError(null);
    } catch (err) {
      const payload = getErrorPayload(err);
      setError(
        payload ?? {
          message: err instanceof Error ? err.message : "Failed to load wordlists.",
        },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const used = quota?.used_bytes ?? 0;
  const max = quota?.max_bytes;
  const pct =
    !quota?.unlimited && max && max > 0
      ? Math.min(100, Math.round((used / max) * 100))
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Wordlists</h2>
          <p className="text-sm text-[var(--muted)]">
            Custom wordlists uploaded to your OHC account and storage quota.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {quota && (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">Storage quota</p>
            <p className="text-xs text-[var(--muted)]">
              {quota.unlimited
                ? `Unlimited · used ${formatBytes(used)}`
                : `${formatBytes(used)} / ${formatBytes(max)} · ${formatBytes(quota.remaining_bytes)} remaining`}
            </p>
          </div>
          {pct !== null && (
            <div className="mt-3 h-2 overflow-hidden rounded bg-[var(--surface-2)]">
              <div
                className="h-full bg-[var(--accent)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          {quota.upgrade_url && !quota.unlimited && (
            <a
              href={quota.upgrade_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-[var(--link)] underline"
            >
              Upgrade storage
            </a>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Passwords</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {wordlists.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-[var(--muted)]"
                >
                  No custom wordlists on this account.
                </td>
              </tr>
            )}
            {wordlists.map((wl) => (
              <tr
                key={`${wl.name}-${wl.created_at}`}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-3 py-2 font-medium">{wl.name}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {wl.count.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs">
                  {formatBytes(wl.size_bytes)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{wl.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requestId && (
        <p className="text-xs text-[var(--muted)]">request_id {requestId}</p>
      )}
    </div>
  );
}
