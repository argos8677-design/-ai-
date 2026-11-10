// Demo content used when the AI service is unavailable. Built only from
// registered product data; unknown facts are marked "회사 확인 필요".
import {
  CHECK_NEEDED,
  TARGETS,
  formatWon,
  rentTypeLabel,
  type BlogContent,
  type ChannelContent,
  type ChannelId,
  type Product,
  type ShortsContent,
  type ShortsDuration,
  type SnsContent,
  type TargetId,
} from "./marketing";

type Ctx = {
  product: Product;
  targets: TargetId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
};

const targetLabel = (ids: TargetId[]) =>
  ids.map((id) => TARGETS.find((t) => t.id === id)?.label).filter(Boolean).join("·") || "고객";

function blog({ product: p, targets, purposes }: Ctx): BlogContent {
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
      {
        heading: "3. 이런 점이 좋아요",
        body: p.advantages.map((a) => `✔ ${a}`).join("\n"),
      },
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

function shorts({ product: p, shortsDuration }: Ctx): ShortsContent {
  const scenesBy: Record<ShortsDuration, ShortsContent["scenes"]> = {
    "15초": [
      { time: "0-3초", visual: "배터리 잔량 경고가 뜬 계기판 클로즈업", caption: "배터리 다 됐다고요?", narration: "배터리 다 됐다고요? 충전 기다리지 마세요." },
      { time: "3-10초", visual: "교환소에서 배터리를 꺼내 바로 장착하는 장면", caption: "교환하고 바로 출발", narration: "바이크뱅크는 배터리를 교환하고 바로 출발합니다." },
      { time: "10-15초", visual: "출발하는 라이더 + 로고·상담 안내 자막", caption: `${p.name} 상담 문의`, narration: "지금 바이크뱅크에 문의하세요." },
    ],
    "30초": [
      { time: "0-3초", visual: "배달 앱 알림이 연달아 울리는 화면", caption: "콜은 밀리는데 충전 중?", narration: "콜은 밀리는데 충전 중이라면?" },
      { time: "3-10초", visual: "라이더가 교환소로 이동, 배터리 교체", caption: "배터리 스왑으로 해결", narration: "바이크뱅크 전기 이륜차는 배터리를 교환하는 방식이에요." },
      { time: "10-20초", visual: "상품 정보 카드 그래픽", caption: `${rentTypeLabel(p.rent_type)} · ${p.rent_period ?? CHECK_NEEDED}`, narration: `${p.name}, 기간과 조건은 상담으로 정확히 안내드려요.` },
      { time: "20-30초", visual: "도심 주행 + 상담 CTA", caption: "지금 상담 신청", narration: "자세한 조건은 바이크뱅크 상담으로 확인하세요." },
    ],
    "60초": [
      { time: "0-3초", visual: "새벽, 헬멧을 쓰는 라이더", caption: "배달 라이더의 하루", narration: "배달 라이더의 하루, 전기 이륜차로 시작합니다." },
      { time: "3-15초", visual: "차량 인도 장면, 차량 외관", caption: p.vehicle_model ?? CHECK_NEEDED, narration: `바이크뱅크 ${p.name}으로 하루를 시작해요.` },
      { time: "15-30초", visual: "운행 중 배터리 교환소 방문", caption: "충전 대신 교환", narration: "배터리가 부족하면 교환소에서 바로 교체합니다." },
      { time: "30-45초", visual: "장점 리스트 모션 그래픽", caption: p.advantages[0] ?? "", narration: p.advantages.join(", ") + "." },
      { time: "45-60초", visual: "로고 + 상담 문의 안내", caption: "렌트 조건은 상담으로 확인", narration: "렌트료와 보증금은 상담에서 정확하게 안내드립니다." },
    ],
  };
  return {
    title: `충전 대기 없는 배달? 바이크뱅크 ${p.rent_type === "short" ? "단기" : "장기"} 렌트`,
    duration: shortsDuration,
    hook: "충전 기다리는 시간, 이제 배터리 교환으로 줄이세요!",
    scenes: scenesBy[shortsDuration],
    description: `바이크뱅크 '${p.name}' 소개 영상입니다. 배터리 스왑 방식 전기 이륜차 렌트로 운행을 이어가세요. 렌트료·보증금 등 상세 조건은 상담을 통해 확인하실 수 있습니다.`,
    hashtags: ["#shorts", "#바이크뱅크", "#전기이륜차", "#배터리교환", "#배달라이더"],
  };
}

function sns(ch: ChannelId, { product: p, targets }: Ctx): SnsContent {
  const who = targetLabel(targets);
  const base = {
    image_copy: "충전은 기다림, 교환은 출발.\n바이크뱅크 전기 이륜차 렌트",
    hashtags: ["#바이크뱅크", "#전기이륜차", "#배터리스왑", "#배달라이더", "#전기오토바이"],
    cta: "프로필 링크 또는 DM으로 상담 신청하세요 👉",
  };
  if (ch === "instagram")
    return {
      ...base,
      post: `${who} 여러분, 충전 기다리느라 콜 놓친 적 있으신가요? ⚡\n\n바이크뱅크 '${p.name}'은 배터리 스왑 방식이라 교환소에서 배터리만 바꾸면 바로 출발!\n\n✔ ${p.advantages.join("\n✔ ")}\n\n렌트료·보증금은 상담으로 정확히 안내드려요.`,
      reels_script: "(0-3초) 방전 경고 화면 → \"충전 기다리지 마세요\"\n(3-8초) 배터리 교환 장면 → \"교환하고 바로 출발\"\n(8-15초) 주행 + 상담 안내",
      card_news: ["충전 기다리는 시간, 아깝지 않나요?", "바이크뱅크는 배터리 교환 방식", `${p.name}`, ...p.advantages.slice(0, 2), "상담 신청은 DM으로!"],
    };
  if (ch === "facebook")
    return {
      ...base,
      post: `[바이크뱅크 전기 이륜차 렌트 안내]\n\n${who}를 위한 '${p.name}' 상품을 소개합니다.\n· 유형: ${rentTypeLabel(p.rent_type)}\n· 기간: ${p.rent_period ?? CHECK_NEEDED}\n· 배터리: 스왑(교환) 방식\n\n${p.advantages.map((a) => `- ${a}`).join("\n")}\n\n렌트료와 보증금 등 세부 조건은 상담 시 안내드립니다.`,
      ad_copy: "충전 대신 교환. 배달은 멈추지 않게.\n바이크뱅크 전기 이륜차 렌트, 지금 상담 받아보세요.",
      cta: "아래 '문의하기' 버튼을 눌러 상담을 신청하세요.",
    };
  return {
    ...base,
    hashtags: [],
    post: "",
    message: `(광고) 바이크뱅크\n\n안녕하세요, 고객님!\n배터리 교환 방식 전기 이륜차 렌트 '${p.name}' 상품을 안내드립니다.\n\n■ 유형: ${rentTypeLabel(p.rent_type)}\n■ 기간: ${p.rent_period ?? CHECK_NEEDED}\n■ 렌트료/보증금: 상담 시 안내 (${CHECK_NEEDED})\n\n무료수신거부 080-XXX-XXXX (${CHECK_NEEDED})`,
    product_intro: `${p.name}은 ${p.advantages[0] ?? "배터리 교환 방식"}을(를) 원하는 ${who}께 적합한 상품입니다.`,
    cta: "상담을 원하시면 이 메시지에 '상담'이라고 답장해 주세요.",
  };
}

export function buildDemoContent(ch: ChannelId, ctx: Ctx): ChannelContent {
  if (ch === "blog") return blog(ctx);
  if (ch === "shorts") return shorts(ctx);
  return sns(ch, ctx);
}
