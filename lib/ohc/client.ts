import type {
  ClientOhcInput,
  OhcErrorBody,
  OhcSuccessResponse,
} from "./types";

const OHC_API_URL = "https://api.onlinehashcrack.com/v2";
const DEFAULT_TIMEOUT_MS = 30_000;

export class OhcError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly requestId: string;
  readonly retryAfter?: number;
  readonly limit?: number;
  readonly body: OhcErrorBody | null;

  constructor(
    status: number,
    body: OhcErrorBody | null,
    fallbackMessage: string,
  ) {
    super(body?.message ?? fallbackMessage);
    this.name = "OhcError";
    this.status = status;
    this.errorCode = body?.error_code ?? "unknown_error";
    this.requestId = body?.request_id ?? "";
    this.retryAfter = body?.retry_after;
    this.limit = body?.limit;
    this.body = body;
  }

  toJSON() {
    return {
      success: false as const,
      error_code: this.errorCode,
      message: this.message,
      request_id: this.requestId,
      retry_after: this.retryAfter,
      limit: this.limit,
      status: this.status,
    };
  }
}

function getApiKey(): string {
  const key = process.env.OHC_API_KEY?.trim();
  if (!key) {
    throw new OhcError(500, null, "OHC_API_KEY is not configured on the server.");
  }
  if (!/^sk_[A-Za-z0-9]{32,64}$/.test(key)) {
    throw new OhcError(
      500,
      null,
      "OHC_API_KEY format is invalid. Expected sk_ plus 32–64 alphanumeric characters.",
    );
  }
  return key;
}

export async function callOhcApi(
  input: ClientOhcInput,
  options?: { timeoutMs?: number },
): Promise<OhcSuccessResponse> {
  const apiKey = getApiKey();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const payload: Record<string, unknown> = {
    api_key: apiKey,
    agree_terms: "yes",
    action: input.action,
  };

  if (input.action === "add_tasks") {
    payload.algo_mode = input.algo_mode;
    payload.hashes = input.hashes;
  } else if (input.action === "identify_hash") {
    payload.hashes = input.hashes;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OHC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    const retryAfterHeader = response.headers.get("Retry-After");
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const body =
        data && typeof data === "object"
          ? (data as OhcErrorBody)
          : null;

      if (response.status === 429 && body && retryAfterHeader && !body.retry_after) {
        body.retry_after = Number(retryAfterHeader) || undefined;
      }

      throw new OhcError(
        response.status,
        body?.success === false ? body : null,
        `OHC API request failed with HTTP ${response.status}`,
      );
    }

    return data as OhcSuccessResponse;
  } catch (error) {
    if (error instanceof OhcError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OhcError(504, null, "OHC API request timed out.");
    }
    throw new OhcError(
      502,
      null,
      error instanceof Error ? error.message : "Failed to reach OHC API.",
    );
  } finally {
    clearTimeout(timer);
  }
}
