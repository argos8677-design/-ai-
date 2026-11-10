// Shared, browser-safe marketing constants and content types.

export const TARGETS = [
  { id: "rider", label: "배달 라이더", tone: "친근하고 실용적인 말투. 배달 업무 편의성, 배터리 교환으로 인한 운행 효율성, 하루 운행 흐름을 강조." },
  { id: "new_rider", label: "신규 배달업 종사자", tone: "쉽고 친절한 안내형 말투. 처음 시작하는 부담 완화, 이용 절차의 간편함을 강조." },
  { id: "sole", label: "개인사업자", tone: "신뢰감 있는 존댓말. 비용 구조의 예측 가능성, 차량 관리 부담 경감을 강조." },
  { id: "agency", label: "배달대행업체", tone: "비즈니스 제안형 말투. 다수 차량 운용 효율, 라이더 수급, 운영 관리 일원화를 강조." },
  { id: "corp", label: "법인 및 사업자", tone: "공식적이고 정제된 B2B 문체. 도입 절차, 운영 안정성, 친환경 경영 측면을 강조." },
  { id: "dealer", label: "이륜차 대리점", tone: "파트너 제안형 말투. 렌트 상품의 사업적 활용성, 고객 설명 용이성, 제휴 가능성을 강조." },
  { id: "partner", label: "제휴 파트너", tone: "협업 제안형 말투. 상호 성장, 제휴 구조(세부 조건은 회사 확인 필요)를 강조." },
  { id: "consumer", label: "일반 소비자", tone: "가볍고 친근한 말투. 전기 이륜차의 편리함과 친환경 이동을 강조." },
  { id: "etc", label: "기타", tone: "중립적이고 명확한 안내형 말투." },
] as const;

export const CHANNELS = [
  { id: "blog", label: "네이버 블로그", short: "블로그", items: ["SEO 최적화 제목", "블로그 본문·소제목", "핵심 키워드·해시태그", "상담 유도 문구"] },
  { id: "shorts", label: "유튜브 쇼츠", short: "유튜브 쇼츠", items: ["15/30/60초 대본", "3초 후킹·스토리보드", "자막·내레이션", "제목·설명·해시태그"] },
  { id: "instagram", label: "인스타그램", short: "인스타그램", items: ["피드 게시글", "릴스 대본", "카드뉴스 문구", "이미지 카피·해시태그"] },
  { id: "facebook", label: "페이스북", short: "페이스북", items: ["상품 홍보 게시글", "광고 카피", "고객 유입 문구"] },
  { id: "kakao", label: "카카오톡", short: "카카오톡", items: ["고객 발송용 메시지", "상품 소개 문구", "상담 유도 메시지"] },
] as const;

export const PURPOSES = [
  "신규 고객 유치",
  "렌트 상품 홍보",
  "장기 렌트 계약 유도",
  "단기 렌트 홍보",
  "신규 배달 라이더 모집",
  "기존 고객 재계약 유도",
  "대리점 및 제휴점 모집",
  "브랜드 인지도 향상",
] as const;

export const EXTRA_EXAMPLES = [
  "배터리 교환 방식의 장점을 강조해 주세요.",
  "초기 비용 부담에 관심 있는 고객을 대상으로 작성해 주세요.",
  "신규 배달 라이더에게 적합한 홍보 문구를 작성해 주세요.",
  "대리점에서 고객에게 설명하기 쉬운 콘텐츠로 작성해 주세요.",
];

export type ChannelId = (typeof CHANNELS)[number]["id"];
export type TargetId = (typeof TARGETS)[number]["id"];
export type ShortsDuration = "15초" | "30초" | "60초";

export type Product = {
  id: string;
  name: string;
  rent_type: "short" | "long";
  vehicle_model: string | null;
  rent_period: string | null;
  monthly_fee: number | null;
  deposit: number | null;
  battery_swap_info: string | null;
  advantages: string[];
  is_sample: boolean;
  image_url?: string | null;
};

export type BlogContent = {
  titles: string[];
  intro: string;
  sections: { heading: string; body: string }[];
  keywords: string[];
  hashtags: string[];
  cta: string;
};
export type ShortsContent = {
  title: string;
  duration: string;
  hook: string;
  scenes: { time: string; visual: string; caption: string; narration: string }[];
  description: string;
  hashtags: string[];
};
export type SnsContent = {
  post: string;
  reels_script?: string;
  card_news?: string[];
  ad_copy?: string;
  message?: string;
  product_intro?: string;
  image_copy: string;
  hashtags: string[];
  cta: string;
};
export type ChannelContent = BlogContent | ShortsContent | SnsContent;
export type ResultsMap = Partial<Record<ChannelId, ChannelContent>>;

export type GenerateInput = {
  clientId: string;
  productId: string;
  targets: TargetId[];
  channels: ChannelId[];
  purposes: string[];
  extra: string;
  shortsDuration: ShortsDuration;
};

export const CHECK_NEEDED = "회사 확인 필요";

export function formatWon(v: number | null) {
  return v == null ? CHECK_NEEDED : `${v.toLocaleString("ko-KR")}원`;
}

export function rentTypeLabel(t: Product["rent_type"]) {
  return t === "short" ? "단기 렌트 (1년 미만)" : "장기 렌트 (1년 이상)";
}

// ---------- Plain-text serialization for copy / download ----------

const tags = (h: string[]) => h.join(" ");

export function blogToText(c: BlogContent, part: "all" | "title" | "body" = "all") {
  const title = c.titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const body = [c.intro, ...c.sections.map((s) => `■ ${s.heading}\n${s.body}`), c.cta].join("\n\n");
  if (part === "title") return title;
  if (part === "body") return body;
  return `[추천 제목]\n${title}\n\n[본문]\n${body}\n\n[키워드]\n${c.keywords.join(", ")}\n\n[해시태그]\n${tags(c.hashtags)}`;
}

export function shortsToText(c: ShortsContent, part: "script" | "captions" = "script") {
  if (part === "captions") return c.scenes.map((s) => `[${s.time}] ${s.caption}`).join("\n");
  return [
    `[영상 제목] ${c.title}`,
    `[영상 길이] ${c.duration}`,
    `[후킹] ${c.hook}`,
    "",
    ...c.scenes.map((s) => `[${s.time}]\n화면: ${s.visual}\n자막: ${s.caption}\n내레이션: ${s.narration}`),
    "",
    `[영상 설명]\n${c.description}`,
    `[해시태그] ${tags(c.hashtags)}`,
  ].join("\n");
}

export function snsToText(c: SnsContent) {
  const parts: string[] = [];
  if (c.message) parts.push(`[발송 메시지]\n${c.message}`);
  if (c.post) parts.push(`[게시글]\n${c.post}`);
  if (c.product_intro) parts.push(`[상품 소개]\n${c.product_intro}`);
  if (c.ad_copy) parts.push(`[광고 카피]\n${c.ad_copy}`);
  if (c.reels_script) parts.push(`[릴스 대본]\n${c.reels_script}`);
  if (c.card_news?.length) parts.push(`[카드뉴스]\n${c.card_news.map((t, i) => `${i + 1}장: ${t}`).join("\n")}`);
  parts.push(`[이미지 카피]\n${c.image_copy}`);
  parts.push(`[CTA]\n${c.cta}`);
  if (c.hashtags.length) parts.push(`[해시태그]\n${tags(c.hashtags)}`);
  return parts.join("\n\n");
}

export function channelToText(ch: ChannelId, c: ChannelContent) {
  if (ch === "blog") return blogToText(c as BlogContent);
  if (ch === "shorts") return shortsToText(c as ShortsContent);
  return snsToText(c as SnsContent);
}
