import { createFileRoute } from "@tanstack/react-router";
import { FileText, Instagram, MessageCircle, PlayCircle, Facebook, CheckCircle2 } from "lucide-react";
import { BottomCta, SectionHead } from "@/components/sections";
import swap from "@/assets/battery-swap.jpg";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "마케팅 활용 방법 | BIKEBANK AI MARKETING" },
      { name: "description", content: "AI로 생성한 블로그·쇼츠·SNS 콘텐츠를 실제 마케팅에 활용하는 채널별 가이드와 사례." },
      { property: "og:title", content: "AI가 만든 콘텐츠, 이렇게 활용하세요" },
      { property: "og:description", content: "바이크뱅크 렌트 상품을 더 효과적으로 홍보하는 채널별 활용 가이드." },
    ],
  }),
  component: Guide,
});

const GUIDES = [
  {
    icon: FileText, name: "네이버 블로그",
    steps: ["AI 블로그 콘텐츠 생성", "제목과 본문 복사", "실제 차량 및 배터리 교환 이미지 추가", "네이버 블로그 게시", "고객 문의 유도"],
    recs: ["전기 이륜차 렌트의 장점", "배터리 스왑 방식 소개", "배달 라이더를 위한 렌트 가이드", "단기 렌트와 장기 렌트 비교", "전기 이륜차 이용 방법"],
  },
  {
    icon: PlayCircle, name: "유튜브 쇼츠",
    steps: ["AI 쇼츠 대본 생성", "장면별 구성 확인", "실제 차량 및 배터리 스왑 영상 촬영", "자막과 내레이션 적용", "유튜브 쇼츠 게시"],
    recs: ["배터리 교환 방법", "배달 라이더의 하루", "전기 이륜차 렌트 이용 방법", "렌트 상품 주요 장점", "고객이 궁금해하는 렌트 정보"],
  },
  {
    icon: Instagram, name: "인스타그램",
    steps: ["AI 게시글 생성", "홍보 이미지 준비", "해시태그 적용", "인스타그램 게시", "DM 및 상담 유도"],
    recs: [],
  },
  {
    icon: Facebook, name: "페이스북 및 카카오톡",
    steps: ["페이스북 페이지 상품 홍보", "지역별 배달 라이더 커뮤니티 활용", "카카오톡 고객 대상 상품 안내", "기존 고객 재계약 홍보"],
    recs: [],
  },
];

const CASES = [
  { t: "신규 배달 라이더 확보", p: "전기 이륜차 장기 렌트", a: "신규 배달 라이더", c: "네이버 블로그, 유튜브 쇼츠", g: "신규 렌트 고객 유치" },
  { t: "단기 렌트 홍보", p: "단기 렌트", a: "단기 배달업 종사자", c: "인스타그램, 카카오톡", g: "단기 렌트 문의 확대" },
  { t: "대리점 제휴 확대", p: "바이크뱅크 렌트 상품", a: "이륜차 대리점 및 제휴 파트너", c: "블로그, 페이스북", g: "제휴 파트너 확대" },
];

function Guide() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img src={swap} alt="" width={1200} height={912} className="absolute inset-0 size-full object-cover opacity-25" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24">
          <span className="text-xs font-bold tracking-[0.2em] text-primary">GUIDE</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">AI가 만든 콘텐츠, 이렇게 활용하세요.</h1>
          <p className="mt-5 max-w-2xl text-ink-foreground/75 sm:text-lg">
            콘텐츠 생성부터 고객 유입까지. 바이크뱅크의 렌트 상품을 더 효과적으로 홍보하는 방법을 안내합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHead eyebrow="CHANNEL GUIDE" title="채널별 활용 가이드" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {GUIDES.map((g, gi) => (
            <article key={g.name} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><g.icon className="size-5" /></span>
                <div>
                  <div className="text-xs font-bold text-muted-foreground">0{gi + 1}</div>
                  <h3 className="text-xl font-bold">{g.name}</h3>
                </div>
              </div>
              <h4 className="mt-6 text-xs font-bold tracking-wider text-muted-foreground">활용 절차</h4>
              <ol className="mt-3 space-y-2">
                {g.steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-primary">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {g.recs.length > 0 && (
                <>
                  <h4 className="mt-6 text-xs font-bold tracking-wider text-muted-foreground">추천 콘텐츠</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.recs.map((r) => (
                      <span key={r} className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">{r}</span>
                    ))}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHead eyebrow="USE CASES" title="실제 마케팅 활용 사례" sub="아래 사례는 활용 시나리오 예시입니다." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {CASES.map((c, i) => (
              <article key={c.t} className="rounded-3xl bg-card p-7 shadow-soft">
                <div className="text-xs font-bold text-primary-deep">사례 {i + 1}</div>
                <h3 className="mt-2 text-lg font-bold">{c.t}</h3>
                <dl className="mt-5 space-y-3 text-sm">
                  {[["상품", c.p], ["대상", c.a], ["채널", c.c], ["목적", c.g]].map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-10 shrink-0 text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary-deep" />
            게시 전에는 렌트료·보증금·혜택 등 수치 정보가 회사에 등록된 실제 상품 정보와 일치하는지 반드시 확인하세요. '회사 확인 필요'로 표시된 항목은 확인 후 수정해 사용합니다.
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary-deep" />
            카카오톡 발송 시 광고성 정보 표기 및 수신 동의 규정을 지켜야 합니다.
          </div>
        </div>
      </section>

      <div className="pt-24">
        <BottomCta title="이제 직접 AI 마케팅을 시작해 보세요." button="AI 마케팅 콘텐츠 생성하기" />
      </div>
    </>
  );
}
