import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  CHECK_NEEDED,
  TARGETS,
  formatWon,
  rentTypeLabel,
  type ChannelId,
  type Product,
  type ShortsDuration,
  type TargetId,
} from "./constants.ts";
import { buildDemoContent } from "./demo-content.ts";
import { PROMPT_TEMPLATE_FALLBACKS } from "./prompt-fallbacks.ts";

const COMPLIANCE = `[광고 준수사항 - 반드시 지킬 것]
1. 제공된 상품 데이터 외의 렌트 상품을 만들지 않는다.
2. 렌트료·보증금은 제공된 값만 사용한다. 값이 없으면 "${CHECK_NEEDED}"로 표기한다.
3. 확정되지 않은 할인·혜택·이벤트를 사실처럼 쓰지 않는다.
4. 배터리 교환소 위치·운영시간을 만들어내지 않는다.
5. 확인되지 않은 차량 성능·주행거리·속도 수치를 쓰지 않는다.
6. 경쟁사를 언급하거나 비방하지 않는다.
7. "최고", "업계 1위", "무조건", "100%" 등 허위·과장 표현을 쓰지 않는다.
8. 확인되지 않은 정보는 "${CHECK_NEEDED}"로 표시한다.`;

type Ctx = {
  product: Product;
  targets: TargetId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
  revision?: string;
  previous?: Record<string, unknown>;
};

async function loadTemplate(sb: SupabaseClient, channel: ChannelId) {
  const { data } = await sb.from("prompt_templates").select("instructions,output_schema").eq("channel", channel).maybeSingle();
  if (data) return data;
  return PROMPT_TEMPLATE_FALLBACKS[channel];
}

function productBlock(p: Product) {
  return [
    `상품명: ${p.name}`,
    `상품 유형: ${rentTypeLabel(p.rent_type)}`,
    `차량 모델: ${p.vehicle_model ?? CHECK_NEEDED}`,
    `렌트 기간: ${p.rent_period ?? CHECK_NEEDED}`,
    `월 렌트료: ${formatWon(p.monthly_fee)}`,
    `보증금: ${formatWon(p.deposit)}`,
    `배터리 스왑: ${p.battery_swap_info ?? CHECK_NEEDED}`,
    `주요 장점: ${p.advantages.join(" / ")}`,
    p.is_sample ? "※ 이 상품은 테스트용 샘플 데이터이므로 수치를 임의로 채우지 말 것." : "",
  ].join("\n");
}

function friendly(status: number, body: string): string {
  if (status === 402) return "AI 사용 크레딧이 부족하여 데모 콘텐츠로 대체되었습니다.";
  if (status === 429) return "AI 요청이 많아 잠시 제한되었습니다. 데모 콘텐츠로 대체되었습니다.";
  if (status >= 500) return "AI 서비스 오류로 데모 콘텐츠로 대체되었습니다.";
  if (status === 401) return "Edge Function에 LOVABLE_API_KEY 또는 OPENAI_API_KEY 시크릿을 설정해 주세요.";
  return "AI 응답을 받지 못해 데모 콘텐츠로 대체되었습니다.";
}

async function callGateway(system: string, user: string): Promise<{ text: string; error?: string }> {
  const lovable = Deno.env.get("LOVABLE_API_KEY")?.trim();
  const openai = Deno.env.get("OPENAI_API_KEY")?.trim();
  const key = lovable || openai;
  if (!key) return { text: "", error: "LOVABLE_API_KEY 또는 OPENAI_API_KEY가 설정되지 않았습니다." };

  const url = lovable
    ? "https://ai.gateway.lovable.dev/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = lovable ? "openai/gpt-6-astra" : "gpt-4o-mini";

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user + "\n\nReturn JSON." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[ai-generate] gateway", res.status, errBody.slice(0, 300));
    return { text: "", error: friendly(res.status, errBody) };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) return { text: "", error: "AI 응답이 비어 있습니다." };
  return { text };
}

export async function generateForChannel(
  sb: SupabaseClient,
  channel: ChannelId,
  ctx: Ctx,
): Promise<{ content: Record<string, unknown>; mode: "ai" | "demo"; error?: string }> {
  const demo = () => buildDemoContent(channel, ctx);
  try {
    const tpl = await loadTemplate(sb, channel);
    if (!tpl) return { content: demo(), mode: "demo", error: "채널 프롬프트가 등록되지 않아 데모 콘텐츠로 대체되었습니다." };

    const tones = ctx.targets
      .map((id) => TARGETS.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => `- ${t!.label}: ${t!.tone}`)
      .join("\n");

    const userMsg = [
      `[상품 데이터]\n${productBlock(ctx.product)}`,
      `[타깃 고객 및 문체 가이드]\n${tones}`,
      `[마케팅 목적]\n${ctx.purposes.join(", ")}`,
      ctx.extra ? `[추가 요청사항]\n${ctx.extra}` : "",
      channel === "shorts" ? `[영상 길이]\n${ctx.shortsDuration}` : "",
      ctx.previous ? `[기존 결과]\n${JSON.stringify(ctx.previous)}` : "",
      ctx.revision ? `[수정 요청]\n${ctx.revision}` : "",
      `[출력 형식]\n다음 JSON 구조와 키를 정확히 따르는 JSON 객체 하나만 반환.\n${tpl.output_schema}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const system = `당신은 바이크뱅크(주) 마케팅 카피라이터다.\n[채널 지침]\n${tpl.instructions}\n\n${COMPLIANCE}`;
    const { text, error } = await callGateway(system, userMsg);
    if (error || !text) return { content: demo(), mode: "demo", error: error ?? "AI 실패" };

    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid");
    if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
    return { content: parsed, mode: "ai" };
  } catch (e) {
    console.error("[generateForChannel]", channel, e);
    return { content: demo(), mode: "demo", error: "AI 응답을 해석하지 못해 데모 콘텐츠로 대체되었습니다." };
  }
}
