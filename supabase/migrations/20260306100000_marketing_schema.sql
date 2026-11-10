CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rent_type text NOT NULL CHECK (rent_type IN ('short','long')),
  vehicle_model text,
  rent_period text,
  monthly_fee integer,
  deposit integer,
  battery_swap_info text,
  advantages text[] NOT NULL DEFAULT '{}',
  is_sample boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are public" ON public.product_images FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL UNIQUE,
  label text NOT NULL,
  instructions text NOT NULL,
  output_schema text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prompt_templates TO authenticated;
GRANT ALL ON public.prompt_templates TO service_role;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  targets text[] NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{}',
  purposes text[] NOT NULL DEFAULT '{}',
  extra_request text,
  mode text NOT NULL DEFAULT 'demo' CHECK (mode IN ('ai','demo')),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.content_history (client_id, created_at DESC);
GRANT ALL ON public.content_history TO service_role;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.content_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id uuid NOT NULL REFERENCES public.content_history(id) ON DELETE CASCADE,
  channel text NOT NULL,
  content jsonb NOT NULL,
  mode text NOT NULL DEFAULT 'demo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (history_id, channel)
);
GRANT ALL ON public.content_results TO service_role;
ALTER TABLE public.content_results ENABLE ROW LEVEL SECURITY;

INSERT INTO public.products (name, rent_type, vehicle_model, rent_period, battery_swap_info, advantages, sort_order) VALUES
('[샘플] 단기 렌트 베이직', 'short', '전기 이륜차 (모델 회사 확인 필요)', '1개월 ~ 11개월', '배터리 스왑 방식 · 교환소 위치/운영시간 회사 확인 필요', ARRAY['짧은 기간 부담 없이 이용','배터리 교환 방식으로 충전 대기 최소화','배달 업무 시작 전 체험용으로 적합'], 1),
('[샘플] 단기 렌트 플렉스', 'short', '전기 이륜차 (모델 회사 확인 필요)', '1개월 단위 (회사 확인 필요)', '배터리 스왑 방식 · 세부 조건 회사 확인 필요', ARRAY['계절·성수기 등 단기 수요 대응','유연한 이용 기간','차량 관리 부담 경감 (세부 범위 회사 확인 필요)'], 2),
('[샘플] 장기 렌트 스탠다드', 'long', '전기 이륜차 (모델 회사 확인 필요)', '12개월 이상', '배터리 스왑 방식 · 교환소 위치/운영시간 회사 확인 필요', ARRAY['장기간 안정적인 차량 운용','초기 차량 구매 비용 부담 완화','배달 전업 라이더에게 적합'], 3),
('[샘플] 장기 렌트 비즈니스', 'long', '전기 이륜차 (모델 회사 확인 필요)', '12개월 ~ 36개월 (회사 확인 필요)', '배터리 스왑 방식 · 다수 차량 운용 조건 회사 확인 필요', ARRAY['배달대행업체·법인 다수 차량 운용','차량 운영 관리 일원화','대리점·제휴 파트너 영업 활용'], 4);

INSERT INTO public.prompt_templates (channel, label, instructions, output_schema) VALUES
('blog','네이버 블로그','네이버 블로그 SEO에 최적화된 정보형 홍보 글을 작성한다. 소제목으로 구조화하고, 검색 키워드를 자연스럽게 포함하며, 마지막에 상담 유도 문구를 넣는다.','{"titles":["추천 제목 3개"],"intro":"도입부","sections":[{"heading":"소제목","body":"본문"}],"keywords":["핵심 키워드"],"hashtags":["#해시태그"],"cta":"상담 유도 문구"}'),
('shorts','유튜브 쇼츠','유튜브 쇼츠 영상 대본을 작성한다. 시작 3초 후킹이 강해야 하며 장면별 스토리보드를 시간 순서로 구성한다. 영상 길이는 요청된 길이(15/30/60초)에 맞춘다.','{"title":"영상 제목","duration":"30초","hook":"시작 3초 후킹 문구","scenes":[{"time":"0-3초","visual":"화면 구성","caption":"자막","narration":"내레이션"}],"description":"영상 설명","hashtags":["#해시태그"]}'),
('instagram','인스타그램','인스타그램 피드 게시글, 릴스 대본, 카드뉴스 문구, 이미지용 카피를 작성한다. 짧고 리듬감 있게, 이모지를 적절히 사용한다.','{"post":"피드 게시글","reels_script":"릴스 대본","card_news":["카드뉴스 장별 문구"],"image_copy":"이미지용 홍보 카피","hashtags":["#해시태그"],"cta":"CTA 문구"}'),
('facebook','페이스북','페이스북 페이지용 상품 홍보 게시글과 광고 카피, 고객 유입 문구를 작성한다.','{"post":"상품 홍보 게시글","ad_copy":"광고 카피","image_copy":"이미지용 카피","hashtags":["#해시태그"],"cta":"고객 유입 문구"}'),
('kakao','카카오톡','카카오톡 고객 발송용 메시지를 작성한다. 정보성 메시지 형식으로 간결하게, 광고 표기 규정을 고려한다.','{"message":"고객 발송용 메시지","product_intro":"상품 소개 문구","image_copy":"이미지용 카피","hashtags":[],"cta":"상담 유도 메시지"}');