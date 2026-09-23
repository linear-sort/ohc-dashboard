"use client";

import type { ApiErrorPayload } from "@/lib/ohc/api-browser";

type Props = {
  error: ApiErrorPayload | { message: string } | null;
  onDismiss?: () => void;
};

export function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  const payload = "error_code" in error ? error : null;

  return (
    <div
      role="alert"
      className="rounded-md border border-red-300/80 bg-red-50 px-4 py-3 text-sm text-red-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{error.message}</p>
          {payload && (
            <p className="font-mono text-xs text-red-800/80">
              {payload.error_code}
              {payload.request_id ? ` · request_id ${payload.request_id}` : ""}
              {payload.retry_after
                ? ` · retry after ${payload.retry_after}s`
                : ""}
              {payload.limit ? ` · limit ${payload.limit}/hr` : ""}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-red-800/70 hover:text-red-950"
          >
            Dismiss
          </button>
        )}
      </div>
      {payload?.request_id && (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-red-900 underline"
          onClick={() => navigator.clipboard.writeText(payload.request_id)}
        >
          Copy request_id
        </button>
      )}
    </div>
  );
}
