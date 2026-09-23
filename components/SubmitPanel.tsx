"use client";

import { useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  getErrorPayload,
  ohcFetch,
  type ApiErrorPayload,
} from "@/lib/ohc/api-browser";
import { MAX_HASHES, parseHashList } from "@/lib/ohc/hashes";
import type { AddTasksResponse } from "@/lib/ohc/types";

export function SubmitPanel({
  initialAlgoMode,
  initialHashes,
}: {
  initialAlgoMode?: string;
  initialHashes?: string;
}) {
  const [algoMode, setAlgoMode] = useState(initialAlgoMode ?? "0");
  const [hashesText, setHashesText] = useState(initialHashes ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorPayload | { message: string } | null>(
    null,
  );
  const [result, setResult] = useState<AddTasksResponse | null>(null);

  const parsedCount = parseHashList(hashesText).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await ohcFetch<AddTasksResponse>("add_tasks", {
        algo_mode: Number(algoMode),
        hashes_text: hashesText,
        confirmed,
      });
      setResult(data);
    } catch (err) {
      const payload = getErrorPayload(err);
      setError(
        payload ?? {
          message: err instanceof Error ? err.message : "Submit failed.",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Submit hashes</h2>
        <p className="text-sm text-[var(--muted)]">
          Submit up to {MAX_HASHES} authorized hashes for a single Hashcat{" "}
          <code className="font-mono text-xs">algo_mode</code>.
        </p>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">algo_mode</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={algoMode}
            onChange={(e) => setAlgoMode(e.target.value)}
            className="w-full max-w-xs rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Hashes{" "}
            <span className="font-normal text-[var(--muted)]">
              ({parsedCount}/{MAX_HASHES}, one per line)
            </span>
          </span>
          <textarea
            required
            rows={10}
            value={hashesText}
            onChange={(e) => setHashesText(e.target.value)}
            placeholder={"8124BC0A5335C27F086F24BA2C7A4810"}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I own these systems or have written authorization to test them, and I
            accept the{" "}
            <a
              href="https://www.onlinehashcrack.com/terms-conditions.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--link)] underline"
            >
              OnlineHashCrack Terms
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !confirmed}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit tasks"}
        </button>
      </form>

      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Bucket title="Accepted" bucket={result.accepted} tone="ok" />
          <Bucket
            title="Pending"
            pending={result.pending}
            tone="warn"
          />
          <Bucket title="Skipped" bucket={result.skipped} tone="muted" />
          <Bucket title="Rejected" bucket={result.rejected} tone="bad" />
          <p className="sm:col-span-2 text-xs text-[var(--muted)]">
            request_id {result.request_id}
          </p>
        </div>
      )}
    </div>
  );
}

function Bucket({
  title,
  bucket,
  pending,
  tone,
}: {
  title: string;
  bucket?: { count: number; reason?: string; hashes: string[] };
  pending?: { count: number; hashes: Array<{ hash: string; reasons: string[] }> };
  tone: "ok" | "warn" | "muted" | "bad";
}) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    muted: "border-[var(--border)] bg-[var(--surface-2)]",
    bad: "border-red-200 bg-red-50",
  };

  const count = pending?.count ?? bucket?.count ?? 0;
  const reason = bucket?.reason;

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}>
      <p className="font-medium">
        {title}: {count}
        {reason ? ` (${reason})` : ""}
      </p>
      {bucket && bucket.hashes.length > 0 && (
        <ul className="mt-1 space-y-0.5 font-mono text-xs">
          {bucket.hashes.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {pending && pending.hashes.length > 0 && (
        <ul className="mt-1 space-y-0.5 font-mono text-xs">
          {pending.hashes.map((item) => (
            <li key={item.hash}>
              {item.hash}{" "}
              <span className="font-sans text-[var(--muted)]">
                [{item.reasons.join(", ")}]
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
