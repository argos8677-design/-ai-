import { generateResponse, ConfigurationError, GatewayError, PaymentRequiredError, RateLimitError } from "@lovable.dev/ai-gateway";
import { hasSupabaseAdminConfig, applyLovableCloudEnv } from "./lovable-cloud-env.server";
import { buildDemoContent } from "./demo-content";
import {
  CHECK_NEEDED,
  TARGETS,
  formatWon,
  rentTypeLabel,
  type ChannelContent,
  type ChannelId,
  type Product,
  type ShortsDuration,
  type TargetId,
} from "./marketing";

type Ctx = {
  product: Product;
  targets: TargetId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
  revision?: string;
  previous?: ChannelContent;
};

const COMPLIANCE = `[광고 준수사항 - 반드시 지킬 것]
1. 제공된 상품 데이터 외의 렌트 상품을 만들지 않는다.
2. 렌트료·보증금은 제공된 값만 사용한다. 값이 없으면 "${CHECK_NEEDED}"로 표기한다.
3. 확정되지 않은 할인·혜택·이벤트를 사실처럼 쓰지 않는다.
4. 배터리 교환소 위치·운영시간을 만들어내지 않는다.
5. 확인되지 않은 차량 성능·주행거리·속도 수치를 쓰지 않는다.
6. 경쟁사를 언급하거나 비방하지 않는다.
7. "최고", "업계 1위", "무조건", "100%" 등 허위·과장 표현을 쓰지 않는다.
8. 확인되지 않은 정보는 "${CHECK_NEEDED}"로 표시한다.`;

async function loadTemplate(channel: ChannelId) {
  applyLovableCloudEnv();
  const { PROMPT_TEMPLATE_FALLBACKS } = await import("./prompt-template-fallbacks");

  if (hasSupabaseAdminConfig()) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("prompt_templates")
        .select("instructions,output_schema")
        .eq("channel", channel)
        .maybeSingle();
      if (data) return data;
    } catch (e) {
      console.error("[loadTemplate] prompt_templates query failed", channel, e);
    }
  }

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

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}

function friendly(e: unknown): string {
  if (e instanceof ConfigurationError) {
    return "Lovable AI Gateway를 사용할 수 없어 데모 콘텐츠로 대체되었습니다. Lovable Cloud 미리보기 또는 배포 환경에서 다시 시도해 주세요.";
  }
  if (e instanceof PaymentRequiredError) return "AI 사용 크레딧이 부족하여 데모 콘텐츠로 대체되었습니다.";
  if (e instanceof RateLimitError) return "AI 요청이 많아 잠시 제한되었습니다. 데모 콘텐츠로 대체되었습니다. 잠시 후 다시 생성해 주세요.";
  if (e instanceof GatewayError) return `AI 서비스 오류(${e.code})로 데모 콘텐츠로 대체되었습니다.`;
  return "AI 응답을 해석하지 못해 데모 콘텐츠로 대체되었습니다.";
}

export async function generateForChannel(
  channel: ChannelId,
  ctx: Ctx,
): Promise<{ content: ChannelContent; mode: "ai" | "demo"; error?: string }> {
  const demo = () => buildDemoContent(channel, ctx);
  try {
    const tpl = await loadTemplate(channel);
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
      channel === "shorts" ? `[영상 길이]\n${ctx.shortsDuration} (장면 time 값 합계가 이 길이에 맞도록)` : "",
      ctx.previous ? `[기존 결과]\n${JSON.stringify(ctx.previous)}` : "",
      ctx.revision ? `[수정 요청]\n${ctx.revision}\n위 수정 요청을 반영해 기존 결과를 개선하라.` : "",
      `[출력 형식]\n다음 JSON 구조와 키를 정확히 따르는 JSON 객체 하나만 반환하라. 모든 문자열은 자연스러운 한국어로 작성.\n${tpl.output_schema}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: `당신은 대한민국 전기 이륜차 렌트 기업 바이크뱅크(주)의 전문 마케팅 카피라이터다. 배터리 스왑 방식 전기 이륜차 렌트를 홍보한다.\n\n[채널 지침]\n${tpl.instructions}\n\n${COMPLIANCE}`,
      input: [{ role: "user", content: userMsg + "\n\nReturn JSON." }],
      text: { format: { type: "json_object" } },
      reasoning: { effort: "low" },
    });
    const text = extractText(res);
    const parsed = JSON.parse(text) as ChannelContent;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid");
    if (channel === "shorts" && !Array.isArray((parsed as { scenes?: unknown }).scenes)) throw new Error("invalid");
    if (channel === "blog" && !Array.isArray((parsed as { sections?: unknown }).sections)) throw new Error("invalid");
    const p = parsed as { hashtags?: unknown };
    if (!Array.isArray(p.hashtags)) (parsed as { hashtags: string[] }).hashtags = [];
    return { content: parsed, mode: "ai" };
  } catch (e) {
    console.error("AI generation failed", channel, e);
    return { content: demo(), mode: "demo", error: friendly(e) };
  }
}
