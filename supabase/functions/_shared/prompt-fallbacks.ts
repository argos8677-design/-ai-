import type { ChannelId } from "./constants.ts";

export const PROMPT_TEMPLATE_FALLBACKS: Record<ChannelId, { instructions: string; output_schema: string }> = {
  blog: {
    instructions:
      "네이버 블로그 SEO에 최적화된 정보형 홍보 글을 작성한다. 소제목으로 구조화하고, 검색 키워드를 자연스럽게 포함하며, 마지막에 상담 유도 문구를 넣는다.",
    output_schema:
      '{"titles":["추천 제목 3개"],"intro":"도입부","sections":[{"heading":"소제목","body":"본문"}],"keywords":["핵심 키워드"],"hashtags":["#해시태그"],"cta":"상담 유도 문구"}',
  },
  shorts: {
    instructions:
      "유튜브 쇼츠 영상 대본을 작성한다. 시작 3초 후킹이 강해야 하며 장면별 스토리보드를 시간 순서로 구성한다. 영상 길이는 요청된 길이(15/30/60초)에 맞춘다.",
    output_schema:
      '{"title":"영상 제목","duration":"30초","hook":"시작 3초 후킹 문구","scenes":[{"time":"0-3초","visual":"화면 구성","caption":"자막","narration":"내레이션"}],"description":"영상 설명","hashtags":["#해시태그"]}',
  },
  instagram: {
    instructions:
      "인스타그램 피드 게시글, 릴스 대본, 카드뉴스 문구, 이미지용 카피를 작성한다. 짧고 리듬감 있게, 이모지를 적절히 사용한다.",
    output_schema:
      '{"post":"피드 게시글","reels_script":"릴스 대본","card_news":["카드뉴스 장별 문구"],"image_copy":"이미지용 홍보 카피","hashtags":["#해시태그"],"cta":"CTA 문구"}',
  },
  facebook: {
    instructions: "페이스북 페이지용 상품 홍보 게시글과 광고 카피, 고객 유입 문구를 작성한다.",
    output_schema:
      '{"post":"상품 홍보 게시글","ad_copy":"광고 카피","image_copy":"이미지용 카피","hashtags":["#해시태그"],"cta":"고객 유입 문구"}',
  },
  kakao: {
    instructions:
      "카카오톡 고객 발송용 메시지를 작성한다. 정보성 메시지 형식으로 간결하게, 광고 표기 규정을 고려한다.",
    output_schema:
      '{"message":"고객 발송용 메시지","product_intro":"상품 소개 문구","image_copy":"이미지용 카피","hashtags":[],"cta":"상담 유도 메시지"}',
  },
};
