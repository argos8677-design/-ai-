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

type Ctx = {
  product: Product;
  targets: TargetId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
};

const targetLabel = (ids: TargetId[]) =>
  ids.map((id) => TARGETS.find((t) => t.id === id)?.label).filter(Boolean).join("·") || "고객";

function blog({ product: p, targets, purposes }: Ctx) {
  const who = targetLabel(targets);
  const kind = p.rent_type === "short" ? "단기 렌트" : "장기 렌트";
  return {
    titles: [
      `${who}를 위한 전기 이륜차 ${kind}, 바이크뱅크 이용 가이드`,
      `충전 대기 없이 배터리만 교환! 바이크뱅크 ${kind} 알아보기`,
      `${purposes[0] ?? "렌트 상품 홍보"} | 바이크뱅크 전기 이륜차 ${kind} 정리`,
    ],
    intro: `전기 이륜차를 알아보고 계신 ${who} 분들께 바이크뱅크의 '${p.name}' 상품을 소개합니다. 배터리 스왑 방식으로 운영되는 바이크뱅크 렌트는 충전 시간을 기다리는 대신 배터리를 교환해 바로 운행을 이어갈 수 있도록 설계되었습니다.`,
    sections: [
      {
        heading: "1. 상품 한눈에 보기",
        body: `· 상품 유형: ${rentTypeLabel(p.rent_type)}\n· 차량 모델: ${p.vehicle_model ?? CHECK_NEEDED}\n· 렌트 기간: ${p.rent_period ?? CHECK_NEEDED}\n· 월 렌트료: ${formatWon(p.monthly_fee)}\n· 보증금: ${formatWon(p.deposit)}`,
      },
      {
        heading: "2. 배터리 스왑 방식이란?",
        body: `방전된 배터리를 충전된 배터리로 교환하는 방식입니다. ${p.battery_swap_info ?? ""}\n교환소 위치와 운영시간은 지역별로 다를 수 있어 상담 시 안내드립니다(${CHECK_NEEDED}).`,
      },
      { heading: "3. 이런 점이 좋아요", body: p.advantages.map((a) => `✔ ${a}`).join("\n") },
      {
        heading: "4. 이용 절차",
        body: "① 상담 신청 → ② 상품 및 조건 안내 → ③ 계약 → ④ 차량 인도 및 배터리 교환 방법 안내\n세부 서류와 절차는 회사 확인 후 안내드립니다.",
      },
    ],
    keywords: ["전기 이륜차 렌트", "배터리 스왑", "배달 오토바이 렌트", kind, "바이크뱅크"],
    hashtags: ["#바이크뱅크", "#전기이륜차", "#전기오토바이렌트", "#배터리교환", "#배달라이더", `#${kind.replace(" ", "")}`],
    cta: "정확한 렌트료·보증금·이용 조건은 바이크뱅크 상담을 통해 확인하실 수 있습니다. 지금 문의 남겨 주세요!",
  };
}

export function buildDemoContent(ch: ChannelId, ctx: Ctx): Record<string, unknown> {
  if (ch === "blog") return blog(ctx);
  if (ch === "shorts") {
    return {
      title: `충전 대기 없는 배달? 바이크뱅크 ${ctx.product.rent_type === "short" ? "단기" : "장기"} 렌트`,
      duration: ctx.shortsDuration,
      hook: "충전 기다리는 시간, 이제 배터리 교환으로 줄이세요!",
      scenes: [{ time: "0-3초", visual: "배터리 교환", caption: "교환하고 출발", narration: "바이크뱅크 배터리 스왑" }],
      description: `${ctx.product.name} 소개`,
      hashtags: ["#바이크뱅크", "#전기이륜차"],
    };
  }
  const who = targetLabel(ctx.targets);
  const p = ctx.product;
  return {
    post: `${who}를 위한 '${p.name}' 안내`,
    hashtags: ["#바이크뱅크", "#전기이륜차"],
    cta: "상담 문의",
    image_copy: "바이크뱅크 전기 이륜차 렌트",
    message: ch === "kakao" ? `(광고) 바이크뱅크 '${p.name}' 안내` : undefined,
  };
}
