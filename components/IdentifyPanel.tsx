"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  getErrorPayload,
  ohcFetch,
  type ApiErrorPayload,
} from "@/lib/ohc/api-browser";
import { MAX_HASHES, parseHashList } from "@/lib/ohc/hashes";
import type { IdentifyHashResponse } from "@/lib/ohc/types";

export function IdentifyPanel() {
  const [hashesText, setHashesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorPayload | { message: string } | null>(
    null,
  );
  const [result, setResult] = useState<IdentifyHashResponse | null>(null);

  const parsedCount = parseHashList(hashesText).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await ohcFetch<IdentifyHashResponse>("identify_hash", {
        hashes_text: hashesText,
      });
      setResult(data);
    } catch (err) {
      const payload = getErrorPayload(err);
      setError(
        payload ?? {
          message: err instanceof Error ? err.message : "Identify failed.",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Identify hash</h2>
        <p className="text-sm text-[var(--muted)]">
          Guess matching Hashcat <code className="font-mono text-xs">algo_mode</code>{" "}
          values for up to {MAX_HASHES} hashes.
        </p>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Hashes{" "}
            <span className="font-normal text-[var(--muted)]">
              ({parsedCount}/{MAX_HASHES})
            </span>
          </span>
          <textarea
            required
            rows={8}
            value={hashesText}
            onChange={(e) => setHashesText(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
        >
          {loading ? "Identifying…" : "Identify"}
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          {result.hashes.map((item) => (
            <div
              key={item.hash}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <p className="truncate font-mono text-xs" title={item.hash}>
                {item.hash}
              </p>
              {item.candidates.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">No candidates.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.candidates.map((c) => {
                    const href = `/submit?algo_mode=${c.algo_mode}&hashes=${encodeURIComponent(item.hash)}`;
                    return (
                      <li key={`${item.hash}-${c.algo_mode}`}>
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs hover:border-[var(--accent)]"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="font-mono text-[var(--muted)]">
                            {c.algo_mode}
                          </span>
                          <span className="text-[var(--link)]">Use on Submit</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {item.ambiguous && (
                <p className="mt-2 text-xs text-amber-800">
                  Ambiguous — more than one algorithm matched.
                </p>
              )}
            </div>
          ))}
          <p className="text-xs text-[var(--muted)]">
            request_id {result.request_id}
          </p>
        </div>
      )}
    </div>
  );
}
