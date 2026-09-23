import { NextResponse } from "next/server";
import { callOhcApi, OhcError } from "@/lib/ohc/client";
import { parseHashList, validateHashBatch } from "@/lib/ohc/hashes";
import { OHC_ACTIONS, type OhcAction } from "@/lib/ohc/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ action: string }>;
};

function isOhcAction(value: string): value is OhcAction {
  return (OHC_ACTIONS as readonly string[]).includes(value);
}

export async function POST(request: Request, context: RouteContext) {
  const { action: rawAction } = await context.params;

  if (!isOhcAction(rawAction)) {
    return NextResponse.json(
      {
        success: false,
        error_code: "invalid_action",
        message: `Unknown action "${rawAction}".`,
        request_id: "",
      },
      { status: 400 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // Never accept client-supplied secrets or terms flags.
  if ("api_key" in body || "agree_terms" in body) {
    return NextResponse.json(
      {
        success: false,
        error_code: "invalid_field_combination",
        message: "api_key and agree_terms are server-managed and must not be sent by the client.",
        request_id: "",
      },
      { status: 400 },
    );
  }

  try {
    if (rawAction === "list_tasks") {
      const data = await callOhcApi({ action: "list_tasks" });
      return NextResponse.json(data);
    }

    if (rawAction === "list_wordlists") {
      const data = await callOhcApi({ action: "list_wordlists" });
      return NextResponse.json(data);
    }

    if (rawAction === "add_tasks") {
      if (body.confirmed !== true) {
        return NextResponse.json(
          {
            success: false,
            error_code: "terms_not_accepted",
            message:
              "Confirm you are authorized to test these hashes and accept OHC terms before submitting.",
            request_id: "",
          },
          { status: 400 },
        );
      }

      const algoMode = Number(body.algo_mode);
      if (!Number.isInteger(algoMode) || algoMode < 0) {
        return NextResponse.json(
          {
            success: false,
            error_code: "invalid_algo_mode",
            message: "algo_mode must be a non-negative integer.",
            request_id: "",
          },
          { status: 400 },
        );
      }

      const hashes = Array.isArray(body.hashes)
        ? body.hashes.map(String)
        : parseHashList(String(body.hashes_text ?? ""));
      const validated = validateHashBatch(hashes);
      if (!validated.ok) {
        return NextResponse.json(
          {
            success: false,
            error_code: "invalid_hashes",
            message: validated.message,
            request_id: "",
          },
          { status: 400 },
        );
      }

      const data = await callOhcApi({
        action: "add_tasks",
        algo_mode: algoMode,
        hashes: validated.hashes,
      });
      return NextResponse.json(data);
    }

    // identify_hash
    const hashes = Array.isArray(body.hashes)
      ? body.hashes.map(String)
      : parseHashList(String(body.hashes_text ?? ""));
    const validated = validateHashBatch(hashes);
    if (!validated.ok) {
      return NextResponse.json(
        {
          success: false,
          error_code: "invalid_hashes",
          message: validated.message,
          request_id: "",
        },
        { status: 400 },
      );
    }

    const data = await callOhcApi({
      action: "identify_hash",
      hashes: validated.hashes,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof OhcError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }
    return NextResponse.json(
      {
        success: false,
        error_code: "internal_error",
        message: "Unexpected server error.",
        request_id: "",
      },
      { status: 500 },
    );
  }
}
