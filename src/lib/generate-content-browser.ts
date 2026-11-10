import { buildDemoContent } from "./demo-content";
import type { ChannelContent, ChannelId, Product, ResultsMap, ShortsDuration, TargetId } from "./marketing";
import { fetchActiveProductById } from "./supabase-browser";

export type BrowserGenerateInput = {
  productId: string;
  targets: TargetId[];
  channels: ChannelId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
};

export type BrowserGenerateResult = {
  historyId: string;
  historySaved: boolean;
  createdAt: string;
  mode: "demo";
  channelModes: Record<ChannelId, "demo">;
  results: ResultsMap;
  errors: string[];
};

function demoCtx(product: Product, data: BrowserGenerateInput) {
  return {
    product,
    targets: data.targets,
    purposes: data.purposes,
    extra: data.extra,
    shortsDuration: data.shortsDuration,
  };
}

/** GitHub Pages static preview: demo content in the browser (no server / AI). */
export async function generateContentInBrowser(data: BrowserGenerateInput): Promise<BrowserGenerateResult> {
  const product = await fetchActiveProductById(data.productId);
  const ctx = demoCtx(product, data);
  const results: ResultsMap = {};
  for (const ch of data.channels) {
    results[ch] = buildDemoContent(ch, ctx);
  }
  const channelModes = Object.fromEntries(data.channels.map((c) => [c, "demo" as const])) as Record<ChannelId, "demo">;
  return {
    historyId: crypto.randomUUID(),
    historySaved: false,
    createdAt: new Date().toISOString(),
    mode: "demo",
    channelModes,
    results,
    errors: [],
  };
}

export async function regenerateChannelInBrowser(
  data: BrowserGenerateInput & { channel: ChannelId },
): Promise<{ content: ChannelContent; mode: "demo"; error?: string }> {
  const product = await fetchActiveProductById(data.productId);
  const content = buildDemoContent(data.channel, demoCtx(product, data));
  return { content, mode: "demo" };
}
