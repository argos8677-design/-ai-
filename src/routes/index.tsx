import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  Bike,
  Copy,
  Download,
  FileText,
  Layers,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import hero from "@/assets/hero-rider.jpg";
import swap from "@/assets/battery-swap.jpg";
import { BottomCta, SectionHead } from "@/components/sections";
import { BlogView, ShortsView, SnsView } from "@/components/result-views";
import { buildDemoContent } from "@/lib/demo-content";
import type { BlogContent, Product, ShortsContent, SnsContent } from "@/lib/marketing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BIKEBANK AI MARKETING | 렌트 상품만 선택하세요" },
      { name: "description", content: "바이크뱅크 전기 이륜차 렌트 상품으로 블로그·쇼츠·SNS 마케팅 콘텐츠를 AI가 자동 제작합니다." },
      { property: "og:title", content: "BIKEBANK AI MARKETING" },
      { property: "og:description", content: "렌트 상품만 선택하세요. 마케팅은 AI가 완성합니다." },
    ],
  }),
  component: Home,
});

const sample: Product = {
  id: "sample",
  name: "[샘플] 장기 렌트 스탠다드",
  rent_type: "long",
  vehicle_model: null,
  rent_period: "12개월 이상",
  monthly_fee: null,
  deposit: null,
  battery_swap_info: "배터리 스왑 방식",
  advantages: ["장기간 안정적인 차량 운용", "초기 차량 구매 비용 부담 완화", "배달 전업 라이더에게 적합"],
  is_sample: true,
};
const ctx = { product: sample, targets: ["rider" as const], purposes: ["신규 고객 유치"], extra: "", shortsDuration: "30초" as const };

function Home() {
  const [tab, setTab] = useState<"blog" | "shorts" | "instagram">("blog");
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img src={hero} alt="배터리 교환 스테이션에서 배터리를 교체하는 배달 라이더" width={1600} height={1104} className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/10" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_1fr] lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BatteryCharging className="size-3.5" /> 배터리 스왑 전기 이륜차 렌트 × AI
            </span>
            <h1 className="mt-6 text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              렌트 상품만 선택하세요.
              <br />
              <span className="text-primary">마케팅 콘텐츠</span>는<br className="sm:hidden" /> AI가 만들어 드립니다.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-foreground/75 sm:text-lg">
              바이크뱅크의 전기 이륜차 렌트 상품을 기반으로 블로그부터 쇼츠, SNS까지. AI가 고객별 맞춤형 마케팅 콘텐츠를 자동으로 제작합니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/generate" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-lift transition hover:bg-primary-deep">
                <Sparkles className="size-5" /> AI 마케팅 소재 만들기
              </Link>
              <Link to="/guide" className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-foreground/25 px-6 py-4 font-semibold transition hover:bg-ink-foreground/10">
                서비스 이용 방법 보기 <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          {/* Content-creation mock */}
          <div className="hidden self-end lg:block">
            <div className="ml-auto max-w-sm rounded-2xl border border-ink-foreground/10 bg-background/95 p-5 text-foreground shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">AI 콘텐츠 생성 완료</span>
                <span className="rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground">5개 채널</span>
              </div>
              <div className="mt-4 space-y-2">
                {["네이버 블로그", "유튜브 쇼츠", "인스타그램", "페이스북", "카카오톡"].map((c, i) => (
                  <div key={c} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
                    <span className="size-2 rounded-full bg-primary" />
                    <span className="flex-1 font-medium">{c}</span>
                    <span className="text-xs text-muted-foreground">{["2,140자", "30초", "피드+릴스", "광고 카피", "메시지"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHead eyebrow="SERVICE" title="마케팅이 어려운 렌트 영업, 이제 AI가 해결합니다." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { icon: Bike, n: "01", t: "상품 기반 AI 콘텐츠 생성", d: ["바이크뱅크의 실제 렌트 상품 정보 반영", "상품별 특징과 장점 자동 분석", "고객 유형에 따른 맞춤형 홍보 문구 생성"] },
            { icon: Layers, n: "02", t: "다양한 채널 콘텐츠 제작", d: ["네이버 블로그", "유튜브 쇼츠", "인스타그램", "페이스북", "카카오톡"] },
            { icon: MousePointerClick, n: "03", t: "간편한 콘텐츠 활용", d: ["원클릭 콘텐츠 생성", "생성 결과 복사", "콘텐츠 다운로드", "수정 및 재생성"] },
          ].map((f) => (
            <article key={f.n} className="group rounded-3xl border border-border bg-card p-8 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <f.icon className="size-6" />
                </span>
                <span className="text-3xl font-extrabold text-border">{f.n}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold">{f.t}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {f.d.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary-deep" />
                    {x}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-muted">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="PROCESS" title="단 3단계로 완성하는 AI 마케팅" align="left" />
            <div className="mt-10 space-y-4">
              {[
                { icon: Bike, t: "렌트 상품 선택", d: "단기·장기 렌트 상품 중 홍보할 상품을 선택합니다." },
                { icon: Target, t: "타깃 고객 및 마케팅 채널 선택", d: "라이더, 대리점 등 고객 유형과 게시할 채널을 고릅니다." },
                { icon: Wand2, t: "AI 마케팅 콘텐츠 자동 생성", d: "채널별로 최적화된 콘텐츠가 즉시 완성됩니다." },
              ].map((s, i) => (
                <div key={s.t} className="flex gap-5 rounded-2xl bg-card p-6 shadow-soft">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-primary-deep">STEP 0{i + 1}</div>
                    <h3 className="mt-1 text-lg font-bold">{s.t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <img src={swap} alt="배터리 교환 스테이션" width={1200} height={912} loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
        </div>
      </section>

      {/* PREVIEW */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <SectionHead eyebrow="PREVIEW" title="이런 콘텐츠가 만들어집니다" sub="샘플 상품 기준 예시 결과입니다. 실제 결과는 등록된 상품 정보에 따라 달라집니다." />
        <div className="mt-10 flex justify-center gap-2">
          {([
            ["blog", "블로그", FileText],
            ["shorts", "유튜브 쇼츠", Sparkles],
            ["instagram", "인스타그램", MessageCircle],
          ] as const).map(([id, l, I]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-ink text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <I className="size-4" /> {l}
            </button>
          ))}
        </div>
        <div className="mt-8 max-h-[560px] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          {tab === "blog" && <BlogView c={buildDemoContent("blog", ctx) as BlogContent} />}
          {tab === "shorts" && <ShortsView c={buildDemoContent("shorts", ctx) as ShortsContent} />}
          {tab === "instagram" && <SnsView c={buildDemoContent("instagram", ctx) as SnsContent} />}
        </div>
        <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Copy className="size-3.5" /> 복사</span>
          <span className="inline-flex items-center gap-1"><Download className="size-3.5" /> TXT 다운로드</span>
          <span className="inline-flex items-center gap-1"><RefreshCw className="size-3.5" /> 수정·재생성</span>
        </div>
      </section>

      <BottomCta title="지금 바로 바이크뱅크의 상품을 홍보해 보세요." button="AI 마케팅 콘텐츠 만들기" />
    </>
  );
}

