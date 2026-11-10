export const CHECK_NEEDED = "회사 확인 필요";

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

export type ChannelId = "blog" | "shorts" | "instagram" | "facebook" | "kakao";
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
};

export function formatWon(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return CHECK_NEEDED;
  return `${n.toLocaleString("ko-KR")}원`;
}

export function rentTypeLabel(t: "short" | "long"): string {
  return t === "short" ? "단기 렌트 (1년 미만)" : "장기 렌트 (1년 이상)";
}
