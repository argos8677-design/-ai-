import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { generateForChannel } from "./ai-generate.ts";
import type { ChannelId, Product, ShortsDuration, TargetId } from "./constants.ts";

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

const CHANNELS = new Set<ChannelId>(["blog", "shorts", "instagram", "facebook", "kakao"]);
const TARGETS = new Set([
  "rider", "new_rider", "sole", "agency", "corp", "dealer", "partner", "consumer", "etc",
]);

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function firstTitle(results: Record<string, unknown>): string | null {
  const b = results.blog as { titles?: string[] } | undefined;
  const s = results.shorts as { title?: string } | undefined;
  return b?.titles?.[0] ?? s?.title ?? null;
}

export async function handleGenerate(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  const productId = String(body.productId ?? "");
  const shortsDuration = String(body.shortsDuration ?? "30초") as ShortsDuration;
  const extra = String(body.extra ?? "");
  const targets = (body.targets as unknown[]) ?? [];
  const channels = (body.channels as unknown[]) ?? [];
  const purposes = (body.purposes as unknown[]) ?? [];

  if (!isUuid(clientId) || !isUuid(productId)) throw new Error("clientId 또는 productId가 올바르지 않습니다.");
  if (targets.length < 1 || channels.length < 1 || purposes.length < 1) throw new Error("필수 항목이 비어 있습니다.");
  for (const t of targets) if (!TARGETS.has(String(t))) throw new Error("잘못된 타깃입니다.");
  for (const c of channels) if (!CHANNELS.has(c as ChannelId)) throw new Error("잘못된 채널입니다.");

  const sb = adminClient();
  const { data: product, error: pErr } = await sb
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  if (pErr || !product) throw new Error("등록된 상품을 찾을 수 없습니다.");

  const channelList = channels as ChannelId[];
  const settled = await Promise.all(
    channelList.map((ch) =>
      generateForChannel(sb, ch, {
        product: product as Product,
        targets: targets as TargetId[],
        purposes: purposes.map(String),
        extra,
        shortsDuration,
      }),
    ),
  );

  const results: Record<string, unknown> = {};
  const errors: string[] = [];
  const channelModes: Record<string, "ai" | "demo"> = {};
  settled.forEach((r, i) => {
    const ch = channelList[i]!;
    results[ch] = r.content;
    channelModes[ch] = r.mode;
    if (r.error) errors.push(r.error);
  });
  const mode = settled.every((r) => r.mode === "ai") ? "ai" : "demo";

  const { data: user } = await sb
    .from("users")
    .upsert({ client_id: clientId }, { onConflict: "client_id" })
    .select("id")
    .single();

  const { data: hist, error: hErr } = await sb
    .from("content_history")
    .insert({
      client_id: clientId,
      user_id: user?.id ?? null,
      product_id: product.id,
      product_name: product.name,
      targets,
      channels: channelList,
      purposes: purposes.map(String),
      extra_request: extra || null,
      mode,
      title: firstTitle(results),
    })
    .select("id,created_at")
    .single();

  if (hErr || !hist) {
    console.error("[handleGenerate] history", hErr?.message);
    return {
      historyId: crypto.randomUUID(),
      historySaved: false,
      createdAt: new Date().toISOString(),
      mode,
      channelModes,
      results,
      errors: Array.from(new Set(errors)),
    };
  }

  await sb.from("content_results").insert(
    channelList.map((ch, i) => ({
      history_id: hist.id,
      channel: ch,
      content: results[ch],
      mode: settled[i]!.mode,
    })),
  );

  return {
    historyId: hist.id,
    historySaved: true,
    createdAt: hist.created_at,
    mode,
    channelModes,
    results,
    errors: Array.from(new Set(errors)),
  };
}

export async function handleRegenerate(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  const historyId = String(body.historyId ?? "");
  const channel = String(body.channel ?? "") as ChannelId;
  const shortsDuration = String(body.shortsDuration ?? "30초") as ShortsDuration;
  const revision = body.revision != null ? String(body.revision) : undefined;

  if (!isUuid(clientId) || !isUuid(historyId) || !CHANNELS.has(channel)) {
    throw new Error("요청 형식이 올바르지 않습니다.");
  }

  const sb = adminClient();
  const { data: hist } = await sb
    .from("content_history")
    .select("*, products(*)")
    .eq("id", historyId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!hist || !hist.products) throw new Error("이력 또는 상품을 찾을 수 없습니다.");

  const { data: prev } = await sb
    .from("content_results")
    .select("content")
    .eq("history_id", hist.id)
    .eq("channel", channel)
    .maybeSingle();

  const r = await generateForChannel(sb, channel, {
    product: hist.products as Product,
    targets: hist.targets as TargetId[],
    purposes: hist.purposes as string[],
    extra: hist.extra_request ?? "",
    shortsDuration,
    ...(revision ? { revision } : {}),
    ...(revision && prev?.content ? { previous: prev.content as Record<string, unknown> } : {}),
  });

  await sb
    .from("content_results")
    .upsert(
      { history_id: hist.id, channel, content: r.content, mode: r.mode, updated_at: new Date().toISOString() },
      { onConflict: "history_id,channel" },
    );

  return r;
}

export async function handleListHistory(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  if (!isUuid(clientId)) return [];
  const sb = adminClient();
  const { data: rows } = await sb
    .from("content_history")
    .select("id,product_name,channels,targets,purposes,mode,rating,title,created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(30);
  return rows ?? [];
}

export async function handleGetHistory(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  const historyId = String(body.historyId ?? "");
  if (!isUuid(clientId) || !isUuid(historyId)) throw new Error("요청 형식이 올바르지 않습니다.");

  const sb = adminClient();
  const { data: hist } = await sb
    .from("content_history")
    .select("*, content_results(channel,content,mode)")
    .eq("id", historyId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!hist) throw new Error("이력을 찾을 수 없습니다.");

  const results: Record<string, unknown> = {};
  const channelModes: Record<string, "ai" | "demo"> = {};
  for (const row of hist.content_results as { channel: ChannelId; content: unknown; mode: string }[]) {
    results[row.channel] = row.content;
    channelModes[row.channel] = row.mode === "ai" ? "ai" : "demo";
  }

  return {
    historyId: hist.id,
    productId: hist.product_id,
    targets: hist.targets,
    channels: hist.channels,
    purposes: hist.purposes,
    extra: hist.extra_request ?? "",
    mode: hist.mode,
    rating: hist.rating,
    createdAt: hist.created_at,
    results,
    channelModes,
  };
}

export async function handleRateHistory(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  const historyId = String(body.historyId ?? "");
  const rating = Number(body.rating);
  if (!isUuid(clientId) || !isUuid(historyId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("요청 형식이 올바르지 않습니다.");
  }
  const sb = adminClient();
  await sb.from("content_history").update({ rating }).eq("id", historyId).eq("client_id", clientId);
  return { ok: true };
}

export async function handleDeleteHistory(body: Record<string, unknown>) {
  const clientId = String(body.clientId ?? "");
  const historyId = String(body.historyId ?? "");
  if (!isUuid(clientId) || !isUuid(historyId)) throw new Error("요청 형식이 올바르지 않습니다.");
  const sb = adminClient();
  await sb.from("content_history").delete().eq("id", historyId).eq("client_id", clientId);
  return { ok: true };
}
