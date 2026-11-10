import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  handleDeleteHistory,
  handleGenerate,
  handleGetHistory,
  handleListHistory,
  handleRateHistory,
  handleRegenerate,
} from "../_shared/handlers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    let result: unknown;
    switch (action) {
      case "generate":
        result = await handleGenerate(body);
        break;
      case "regenerateChannel":
        result = await handleRegenerate(body);
        break;
      case "listHistory":
        result = await handleListHistory(body);
        break;
      case "getHistory":
        result = await handleGetHistory(body);
        break;
      case "rateHistory":
        result = await handleRateHistory(body);
        break;
      case "deleteHistory":
        result = await handleDeleteHistory(body);
        break;
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }

    return jsonResponse(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "요청 처리 중 오류가 발생했습니다.";
    console.error("[marketing]", message, e);
    return jsonResponse({ error: message }, 400);
  }
});
