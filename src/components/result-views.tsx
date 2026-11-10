import type { BlogContent, ShortsContent, SnsContent } from "@/lib/marketing";

export function Tags({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {t}
        </span>
      ))}
    </div>
  );
}

export function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</h4>
      {children}
    </section>
  );
}

const para = "whitespace-pre-line text-[15px] leading-relaxed";

export function BlogView({ c }: { c: BlogContent }) {
  return (
    <div className="space-y-6">
      <Block label="추천 제목">
        <ol className="space-y-2">
          {c.titles?.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 font-semibold">
              <span className="text-primary-deep">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Block>
      <Block label="SEO 최적화 본문">
        <div className="space-y-5 rounded-2xl border border-border p-5">
          <p className={para}>{c.intro}</p>
          {c.sections?.map((s, i) => (
            <div key={i}>
              <h5 className="mb-1.5 border-l-4 border-primary pl-3 text-base font-bold">{s.heading}</h5>
              <p className={para}>{s.body}</p>
            </div>
          ))}
        </div>
      </Block>
      <Block label="핵심 키워드">
        <Tags items={c.keywords ?? []} />
      </Block>
      <Block label="해시태그">
        <Tags items={c.hashtags ?? []} />
      </Block>
      <Block label="상담 유도 문구">
        <p className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-ink-foreground">{c.cta}</p>
      </Block>
    </div>
  );
}

export function ShortsView({ c }: { c: ShortsContent }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Block label="영상 제목">
          <p className="text-lg font-bold">{c.title}</p>
        </Block>
        <Block label="영상 길이">
          <span className="inline-block rounded-lg bg-ink px-3 py-1.5 text-sm font-bold text-primary">{c.duration}</span>
        </Block>
      </div>
      <Block label="시작 3초 후킹">
        <p className="rounded-xl border-2 border-primary bg-accent px-4 py-3 text-base font-bold">“{c.hook}”</p>
      </Block>
      <Block label="장면별 구성">
        <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-5">
          {c.scenes?.map((s, i) => (
            <li key={i} className="relative rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="absolute -left-[31px] top-4 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="mb-2 text-xs font-bold text-primary-deep">{s.time}</div>
              <dl className="grid gap-1.5 text-sm sm:grid-cols-[72px_1fr]">
                <dt className="text-muted-foreground">화면</dt>
                <dd>{s.visual}</dd>
                <dt className="text-muted-foreground">자막</dt>
                <dd className="font-semibold">{s.caption}</dd>
                <dt className="text-muted-foreground">내레이션</dt>
                <dd>{s.narration}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </Block>
      <Block label="영상 설명">
        <p className={para}>{c.description}</p>
      </Block>
      <Block label="해시태그">
        <Tags items={c.hashtags ?? []} />
      </Block>
    </div>
  );
}

export function SnsView({ c }: { c: SnsContent }) {
  return (
    <div className="space-y-6">
      {c.message && (
        <Block label="고객 발송용 메시지">
          <div className="max-w-md rounded-2xl rounded-tl-sm bg-primary/90 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-primary-foreground">
            {c.message}
          </div>
        </Block>
      )}
      {c.post && (
        <Block label="게시글 문구">
          <p className={`${para} rounded-2xl border border-border p-5`}>{c.post}</p>
        </Block>
      )}
      {c.product_intro && (
        <Block label="상품 소개 문구">
          <p className={para}>{c.product_intro}</p>
        </Block>
      )}
      {c.ad_copy && (
        <Block label="광고 카피">
          <p className={`${para} font-semibold`}>{c.ad_copy}</p>
        </Block>
      )}
      {c.reels_script && (
        <Block label="릴스 대본">
          <p className={`${para} rounded-xl bg-muted p-4 text-sm`}>{c.reels_script}</p>
        </Block>
      )}
      {!!c.card_news?.length && (
        <Block label="카드뉴스 문구">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {c.card_news.map((t, i) => (
              <div key={i} className="flex aspect-square flex-col justify-between rounded-xl bg-ink p-3 text-ink-foreground">
                <span className="text-[10px] font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-bold leading-snug">{t}</span>
              </div>
            ))}
          </div>
        </Block>
      )}
      <Block label="이미지용 카피">
        <p className="rounded-2xl bg-ink px-5 py-6 text-center text-lg font-extrabold whitespace-pre-line text-primary">{c.image_copy}</p>
      </Block>
      <Block label="CTA 문구">
        <p className="font-semibold">{c.cta}</p>
      </Block>
      <Block label="해시태그">
        <Tags items={c.hashtags ?? []} />
      </Block>
    </div>
  );
}
