export type ApiErrorPayload = {
  success: false;
  error_code: string;
  message: string;
  request_id: string;
  retry_after?: number;
  limit?: number;
  status?: number;
};

export async function ohcFetch<T>(
  action: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`/api/ohc/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = (await response.json()) as T | ApiErrorPayload;

  if (!response.ok || (data && typeof data === "object" && "success" in data && data.success === false)) {
    const err = data as ApiErrorPayload;
    const error = new Error(err.message || `Request failed (${response.status})`) as Error & {
      payload: ApiErrorPayload;
    };
    error.payload = {
      ...err,
      status: err.status ?? response.status,
    };
    throw error;
  }

  return data as T;
}

export function getErrorPayload(error: unknown): ApiErrorPayload | null {
  if (
    error &&
    typeof error === "object" &&
    "payload" in error &&
    error.payload &&
    typeof error.payload === "object"
  ) {
    return error.payload as ApiErrorPayload;
  }
  return null;
}
