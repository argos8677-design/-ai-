import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  applyLovableCloudEnv,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseAdminConfig,
} from "./lovable-cloud-env.server";
import type { ChannelContent, ChannelId, Product, ResultsMap } from "./marketing";

const channelEnum = z.enum(["blog", "shorts", "instagram", "facebook", "kakao"]);
const targetEnum = z.enum(["rider", "new_rider", "sole", "agency", "corp", "dealer", "partner", "consumer", "etc"]);
const clientId = z.string().uuid();

const CLOUD_BACKEND_HINT = "Lovable Cloud 백엔드 연결을 확인해 주세요.";

function publicClient() {
  applyLovableCloudEnv();
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) throw new Error("Supabase 연결 정보를 불러오지 못했습니다. Lovable Cloud에서 Supabase를 연결해 주세요.");

  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    }),
  );
}

async function getSupabaseAdmin() {
  applyLovableCloudEnv();
  if (!hasSupabaseAdminConfig()) throw new Error(CLOUD_BACKEND_HINT);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await publicClient();
  const { data, error } = await sb
    .from("products")
    .select("id,name,rent_type,vehicle_model,rent_period,monthly_fee,deposit,battery_swap_info,advantages,is_sample,product_images(image_url,sort_order)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("[listProducts]", error.message, error.code);
    throw new Error("상품 정보를 불러오지 못했습니다.");
  }
  return (data ?? []).map((p) => {
    const { product_images, ...rest } = p as typeof p & { product_images: { image_url: string }[] };
    return { ...rest, image_url: product_images?.[0]?.image_url ?? null } as Product;
  });
});

const generateSchema = z.object({
  clientId,
  productId: z.string().uuid(),
  targets: z.array(targetEnum).min(1),
  channels: z.array(channelEnum).min(1),
  purposes: z.array(z.string().max(50)).min(1).max(8),
  extra: z.string().max(1000),
  shortsDuration: z.enum(["15초", "30초", "60초"]),
});

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((d) => generateSchema.parse(d))
  .handler(async ({ data }) => {
    const { generateForChannel } = await import("./ai-generate.server");
    const sb = await publicClient();

    const { data: product, error: pErr } = await sb
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .eq("is_active", true)
      .maybeSingle();
    if (pErr || !product) throw new Error("등록된 상품을 찾을 수 없습니다.");

    const settled = await Promise.all(
      data.channels.map((ch) => generateForChannel(ch, { ...data, product: product as Product })),
    );
    const results: ResultsMap = {};
    const errors: string[] = [];
    settled.forEach((r, i) => {
      results[data.channels[i]!] = r.content;
      if (r.error) errors.push(r.error);
    });
    const mode = settled.every((r) => r.mode === "ai") ? "ai" : "demo";
    const channelModes = Object.fromEntries(data.channels.map((c, i) => [c, settled[i]!.mode])) as Record<
      ChannelId,
      "ai" | "demo"
    >;

    if (!hasSupabaseAdminConfig()) {
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

    try {
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: user } = await supabaseAdmin
        .from("users")
        .upsert({ client_id: data.clientId }, { onConflict: "client_id" })
        .select("id")
        .single();

      const { data: hist, error: hErr } = await supabaseAdmin
        .from("content_history")
        .insert({
          client_id: data.clientId,
          user_id: user?.id ?? null,
          product_id: product.id,
          product_name: product.name,
          targets: data.targets,
          channels: data.channels,
          purposes: data.purposes,
          extra_request: data.extra || null,
          mode,
          title: firstTitle(results),
        })
        .select("id,created_at")
        .single();
      if (hErr || !hist) throw new Error("생성 결과 저장에 실패했습니다.");

      await supabaseAdmin.from("content_results").insert(
        data.channels.map((ch, i) => ({
          history_id: hist.id,
          channel: ch,
          content: results[ch] as never,
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
    } catch (e) {
      console.error("[generateContent] history save failed", e);
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
  });

function firstTitle(r: ResultsMap): string | null {
  const b = r.blog as { titles?: string[] } | undefined;
  const s = r.shorts as { title?: string } | undefined;
  return b?.titles?.[0] ?? s?.title ?? null;
}

export const regenerateChannel = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        clientId,
        historyId: z.string().uuid(),
        channel: channelEnum,
        revision: z.string().max(1000).optional(),
        shortsDuration: z.enum(["15초", "30초", "60초"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { generateForChannel } = await import("./ai-generate.server");
    const { data: hist } = await supabaseAdmin
      .from("content_history")
      .select("*, products(*)")
      .eq("id", data.historyId)
      .eq("client_id", data.clientId)
      .maybeSingle();
    if (!hist || !hist.products) throw new Error("이력 또는 상품을 찾을 수 없습니다.");
    const { data: prev } = await supabaseAdmin
      .from("content_results")
      .select("content")
      .eq("history_id", hist.id)
      .eq("channel", data.channel)
      .maybeSingle();

    const r = await generateForChannel(data.channel, {
      product: hist.products as unknown as Product,
      targets: hist.targets as never,
      purposes: hist.purposes,
      extra: hist.extra_request ?? "",
      shortsDuration: data.shortsDuration,
      ...(data.revision ? { revision: data.revision } : {}),
      ...(data.revision && prev?.content ? { previous: prev.content as ChannelContent } : {}),
    });
    await supabaseAdmin
      .from("content_results")
      .upsert(
        { history_id: hist.id, channel: data.channel, content: r.content as never, mode: r.mode, updated_at: new Date().toISOString() },
        { onConflict: "history_id,channel" },
      );
    return r;
  });

/** Session-only regen when history was not persisted (e.g. local preview without Cloud secrets). */
export const regenerateChannelInline = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        productId: z.string().uuid(),
        targets: z.array(targetEnum).min(1),
        purposes: z.array(z.string().max(50)).min(1).max(8),
        extra: z.string().max(1000),
        shortsDuration: z.enum(["15초", "30초", "60초"]),
        channel: channelEnum,
        revision: z.string().max(1000).optional(),
        previous: z.unknown().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { generateForChannel } = await import("./ai-generate.server");
    const sb = await publicClient();
    const { data: product, error: pErr } = await sb
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .eq("is_active", true)
      .maybeSingle();
    if (pErr || !product) throw new Error("등록된 상품을 찾을 수 없습니다.");
    return generateForChannel(data.channel, {
      product: product as Product,
      targets: data.targets as never,
      purposes: data.purposes,
      extra: data.extra,
      shortsDuration: data.shortsDuration,
      ...(data.revision ? { revision: data.revision } : {}),
      ...(data.revision && data.previous ? { previous: data.previous as ChannelContent } : {}),
    });
  });

export const listHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ clientId }).parse(d))
  .handler(async ({ data }) => {
    if (!hasSupabaseAdminConfig()) return [];
    try {
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: rows } = await supabaseAdmin
        .from("content_history")
        .select("id,product_name,channels,targets,purposes,mode,rating,title,created_at")
        .eq("client_id", data.clientId)
        .order("created_at", { ascending: false })
        .limit(30);
      return rows ?? [];
    } catch (e) {
      console.error("[listHistory]", e);
      return [];
    }
  });

export const getHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ clientId, historyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: hist } = await supabaseAdmin
      .from("content_history")
      .select("*, content_results(channel,content,mode)")
      .eq("id", data.historyId)
      .eq("client_id", data.clientId)
      .maybeSingle();
    if (!hist) throw new Error("이력을 찾을 수 없습니다.");
    const results: ResultsMap = {};
    const channelModes: Partial<Record<ChannelId, "ai" | "demo">> = {};
    for (const r of hist.content_results as { channel: ChannelId; content: unknown; mode: string }[]) {
      results[r.channel] = r.content as ChannelContent;
      channelModes[r.channel] = r.mode === "ai" ? "ai" : "demo";
    }
    return {
      historyId: hist.id,
      productId: hist.product_id,
      targets: hist.targets,
      channels: hist.channels as ChannelId[],
      purposes: hist.purposes,
      extra: hist.extra_request ?? "",
      mode: hist.mode,
      rating: hist.rating,
      createdAt: hist.created_at,
      results,
      channelModes,
    };
  });

export const rateHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ clientId, historyId: z.string().uuid(), rating: z.number().int().min(1).max(5) }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("content_history")
      .update({ rating: data.rating })
      .eq("id", data.historyId)
      .eq("client_id", data.clientId);
    return { ok: true };
  });

export const deleteHistory = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ clientId, historyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin.from("content_history").delete().eq("id", data.historyId).eq("client_id", data.clientId);
    return { ok: true };
  });
