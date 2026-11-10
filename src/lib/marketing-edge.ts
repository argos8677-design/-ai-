import { createBrowserSupabase } from "./supabase-browser";
import type { ChannelContent, ChannelId, ResultsMap, ShortsDuration, TargetId } from "./marketing";

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const sb = createBrowserSupabase();
  const { data, error } = await sb.functions.invoke("marketing", { body });
  if (error) {
    console.error("[marketing-edge]", error);
    throw new Error(error.message || "Edge Function 호출에 실패했습니다. Supabase에서 marketing 함수를 배포했는지 확인해 주세요.");
  }
  const payload = data as { error?: string } & T;
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(payload.error);
  }
  return data as T;
}

export type EdgeGenerateInput = {
  clientId: string;
  productId: string;
  targets: TargetId[];
  channels: ChannelId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
};

export type EdgeGenerateResult = {
  historyId: string;
  historySaved: boolean;
  createdAt: string;
  mode: "ai" | "demo";
  channelModes: Partial<Record<ChannelId, "ai" | "demo">>;
  results: ResultsMap;
  errors: string[];
};

export async function generateContentViaEdge(data: EdgeGenerateInput): Promise<EdgeGenerateResult> {
  return invoke({ action: "generate", ...data });
}

export async function regenerateChannelViaEdge(data: {
  clientId: string;
  historyId: string;
  channel: ChannelId;
  revision?: string;
  shortsDuration: ShortsDuration;
}): Promise<{ content: ChannelContent; mode: "ai" | "demo"; error?: string }> {
  return invoke({ action: "regenerateChannel", ...data });
}

export type HistoryListItem = {
  id: string;
  product_name: string;
  channels: string[];
  targets: string[];
  purposes: string[];
  mode: string;
  rating: number | null;
  title: string | null;
  created_at: string;
};

export async function listHistoryViaEdge(clientId: string): Promise<HistoryListItem[]> {
  return invoke({ action: "listHistory", clientId });
}

export async function getHistoryViaEdge(clientId: string, historyId: string) {
  return invoke<{
    historyId: string;
    productId: string | null;
    targets: TargetId[];
    channels: ChannelId[];
    purposes: string[];
    extra: string;
    mode: string;
    rating: number | null;
    createdAt: string;
    results: ResultsMap;
    channelModes: Partial<Record<ChannelId, "ai" | "demo">>;
  }>({ action: "getHistory", clientId, historyId });
}

export async function rateHistoryViaEdge(clientId: string, historyId: string, rating: number) {
  return invoke({ action: "rateHistory", clientId, historyId, rating });
}

export async function deleteHistoryViaEdge(clientId: string, historyId: string) {
  return invoke({ action: "deleteHistory", clientId, historyId });
}
