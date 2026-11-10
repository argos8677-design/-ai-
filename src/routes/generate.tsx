import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  History,
  Loader2,
  PencilLine,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import shortImg from "@/assets/scooter-short.jpg";
import longImg from "@/assets/scooter-long.jpg";
import { BlogView, ShortsView, SnsView } from "@/components/result-views";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  CHANNELS,
  EXTRA_EXAMPLES,
  PURPOSES,
  TARGETS,
  blogToText,
  channelToText,
  formatWon,
  rentTypeLabel,
  shortsToText,
  snsToText,
  type BlogContent,
  type ChannelId,
  type Product,
  type ResultsMap,
  type ShortsContent,
  type ShortsDuration,
  type SnsContent,
  type TargetId,
} from "@/lib/marketing";
import {
  deleteHistory,
  generateContent,
  getHistory,
  listHistory,
  rateHistory,
  regenerateChannel,
  regenerateChannelInline,
} from "@/lib/marketing.functions";
import { fetchProductsForApp } from "@/lib/fetch-products";

const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => fetchProductsForApp() });

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "AI 마케팅 콘텐츠 생성 | BIKEBANK AI MARKETING" },
      { name: "description", content: "렌트 상품·타깃·채널·목적을 선택하면 AI가 채널별 마케팅 콘텐츠를 제작합니다." },
      { property: "og:title", content: "AI 마케팅 콘텐츠 생성" },
      { property: "og:description", content: "바이크뱅크 렌트 상품으로 블로그·쇼츠·SNS 콘텐츠를 자동 생성하세요." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: GeneratePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <AlertTriangle className="mx-auto size-10 text-destructive" />
      <h1 className="mt-4 text-xl font-bold">상품 정보를 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message} 잠시 후 새로고침해 주세요.</p>
    </div>
  ),
});

function useClientId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let v = localStorage.getItem("bb_client_id");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("bb_client_id", v);
    }
    setId(v);
  }, []);
  return id;
}

const PROGRESS = ["상품 데이터 조회", "타깃 고객 분석", "마케팅 목적 분석", "채널별 프롬프트 구성", "AI 콘텐츠 생성 중", "결과 정리"];

type Generated = {
  historyId: string;
  historySaved: boolean;
  productId: string;
  mode: string;
  channelModes: Partial<Record<ChannelId, "ai" | "demo">>;
  results: ResultsMap;
  errors: string[];
  channels: ChannelId[];
  rating: number | null;
  productName: string;
};

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

async function copy(text: string, label = "복사되었습니다") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
  }
}

function downloadTxt(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function GeneratePage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const clientId = useClientId();
  const generateFn = useServerFn(generateContent);
  const regenFn = useServerFn(regenerateChannel);
  const regenInlineFn = useServerFn(regenerateChannelInline);
  const historyFn = useServerFn(listHistory);
  const getFn = useServerFn(getHistory);
  const rateFn = useServerFn(rateHistory);
  const delFn = useServerFn(deleteHistory);

  const [productId, setProductId] = useState<string | null>(null);
  const [rentFilter, setRentFilter] = useState<"all" | "short" | "long">("all");
  const [targets, setTargets] = useState<TargetId[]>([]);
  const [channels, setChannels] = useState<ChannelId[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [extra, setExtra] = useState("");
  const [duration, setDuration] = useState<ShortsDuration>("30초");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState<Generated | null>(null);
  const [tab, setTab] = useState<ChannelId>("blog");
  const [busyChannel, setBusyChannel] = useState<ChannelId | null>(null);
  const [revOpen, setRevOpen] = useState(false);
  const [revText, setRevText] = useState("");
  const [histOpen, setHistOpen] = useState(false);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listHistory>>>([]);
  const [histLoading, setHistLoading] = useState(false);

  const product = products.find((p) => p.id === productId) ?? null;
  const visible = products.filter((p) => rentFilter === "all" || p.rent_type === rentFilter);
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!productId) m.push("렌트 상품");
    if (!targets.length) m.push("타깃 고객");
    if (!channels.length) m.push("마케팅 채널");
    if (!purposes.length) m.push("마케팅 목적");
    return m;
  }, [productId, targets, channels, purposes]);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS.length - 2)), 1400);
    return () => clearInterval(t);
  }, [loading]);

  async function run() {
    if (missing.length || !clientId || !productId) {
      toast.error(`${missing.join(", ")}을(를) 선택해 주세요.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await generateFn({ data: { clientId, productId, targets, channels, purposes, extra, shortsDuration: duration } });
      setGen({
        ...r,
        historySaved: r.historySaved,
        productId,
        channels,
        rating: null,
        productName: product?.name ?? "",
      });
      setTab(channels[0] ?? "blog");
      if (r.errors.length) toast.warning(r.errors[0]);
      else if (r.mode === "ai") toast.success("AI 마케팅 콘텐츠가 생성되었습니다.");
      else toast.success("데모 콘텐츠가 생성되었습니다.");
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "콘텐츠 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function regen(revision?: string) {
    if (!gen || !clientId || !productId) return;
    setBusyChannel(tab);
    try {
      const previous = gen.results[tab];
      const r = gen.historySaved
        ? await regenFn({
            data: {
              clientId,
              historyId: gen.historyId,
              channel: tab,
              revision,
              shortsDuration: duration,
            },
          })
        : await regenInlineFn({
            data: {
              productId,
              targets,
              purposes,
              extra,
              shortsDuration: duration,
              channel: tab,
              revision,
              ...(revision && previous ? { previous } : {}),
            },
          });
      setGen({
        ...gen,
        results: { ...gen.results, [tab]: r.content },
        channelModes: { ...gen.channelModes, [tab]: r.mode },
      });
      if (r.error) toast.warning(r.error);
      else toast.success(revision ? "수정 요청이 반영되었습니다." : "다시 생성되었습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "재생성에 실패했습니다.");
    } finally {
      setBusyChannel(null);
    }
  }

  async function openHistory() {
    if (!clientId) return;
    setHistOpen(true);
    setHistLoading(true);
    try {
      setHistory(await historyFn({ data: { clientId } }));
    } catch {
      toast.error("이력을 불러오지 못했습니다.");
    } finally {
      setHistLoading(false);
    }
  }

  async function loadHistory(id: string) {
    if (!clientId) return;
    try {
      const h = await getFn({ data: { clientId, historyId: id } });
      if (h.productId) setProductId(h.productId);
      setTargets(h.targets as TargetId[]);
      setChannels(h.channels);
      setPurposes(h.purposes);
      setExtra(h.extra);
      const p = products.find((x) => x.id === h.productId);
      setGen({
        historyId: h.historyId,
        historySaved: true,
        productId: h.productId ?? "",
        mode: h.mode,
        channelModes: h.channelModes,
        results: h.results,
        errors: [],
        channels: h.channels,
        rating: h.rating,
        productName: p?.name ?? "",
      });
      setTab(h.channels[0] ?? "blog");
      setHistOpen(false);
      toast.success("이전 콘텐츠를 불러왔습니다.");
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "불러오기에 실패했습니다.");
    }
  }

  async function removeHistory(id: string) {
    if (!clientId) return;
    await delFn({ data: { clientId, historyId: id } });
    setHistory((h) => h.filter((x) => x.id !== id));
    if (gen?.historyId === id) setGen(null);
    toast.success("삭제되었습니다.");
  }

  async function rate(n: number) {
    if (!gen || !clientId) return;
    setGen({ ...gen, rating: n });
    if (!gen.historySaved) {
      toast.message("만족도는 이 세션에만 표시됩니다. Lovable Cloud에 저장된 이력에서만 평가가 기록됩니다.");
      return;
    }
    await rateFn({ data: { clientId, historyId: gen.historyId, rating: n } });
    toast.success("만족도 평가가 저장되었습니다. 감사합니다!");
  }

  const current = gen?.results[tab];
  const fileBase = `bikebank_${tab}_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-primary-deep">AI STUDIO</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">AI 마케팅 콘텐츠 생성</h1>
            <p className="mt-2 text-muted-foreground">바이크뱅크의 렌트 상품과 홍보 목적을 선택하면 AI가 채널별 최적화 콘텐츠를 제작합니다.</p>
          </div>
          <button onClick={openHistory} className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-soft hover:bg-accent sm:self-auto">
            <History className="size-4" /> 생성 이력
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* LEFT: inputs */}
          <div className="space-y-5">
            <Step n={1} title="렌트 상품 선택" hint="1개 선택">
              <div className="mb-4 flex gap-2">
                {([["all", "전체"], ["short", "단기 렌트 (1년 미만)"], ["long", "장기 렌트 (1년 이상)"]] as const).map(([k, l]) => (
                  <Chip key={k} active={rentFilter === k} onClick={() => setRentFilter(k)}>{l}</Chip>
                ))}
              </div>
              {visible.length === 0 ? (
                <Empty text="등록된 렌트 상품이 없습니다. 관리자가 상품을 등록하면 이곳에 표시됩니다." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visible.map((p) => (
                    <ProductCard key={p.id} p={p} active={p.id === productId} onClick={() => setProductId(p.id)} />
                  ))}
                </div>
              )}
              {products.some((p) => p.is_sample) && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary-deep" />
                  현재 표시된 상품은 테스트용 샘플 데이터입니다. 렌트료·보증금·차량 사양은 실제 상품 등록 후 반영됩니다.
                </p>
              )}
            </Step>

            <Step n={2} title="타깃 고객 선택" hint="복수 선택">
              <div className="flex flex-wrap gap-2">
                {TARGETS.map((t) => (
                  <Chip key={t.id} active={targets.includes(t.id)} onClick={() => setTargets(toggle(targets, t.id))} check>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </Step>

            <Step n={3} title="마케팅 채널 선택" hint="복수 선택">
              <div className="grid gap-3 sm:grid-cols-2">
                {CHANNELS.map((c) => {
                  const on = channels.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => setChannels(toggle(channels, c.id))} className={`relative rounded-2xl border-2 p-4 text-left transition ${on ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50"}`}>
                      <Checkmark on={on} />
                      <div className="font-bold">{c.label}</div>
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {c.items.map((i) => <li key={i}>· {i}</li>)}
                      </ul>
                    </button>
                  );
                })}
              </div>
              {channels.includes("shorts") && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="font-semibold">쇼츠 영상 길이</span>
                  {(["15초", "30초", "60초"] as const).map((d) => (
                    <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>{d}</Chip>
                  ))}
                </div>
              )}
            </Step>

            <Step n={4} title="마케팅 목적 선택" hint="복수 선택">
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map((p) => (
                  <Chip key={p} active={purposes.includes(p)} onClick={() => setPurposes(toggle(purposes, p))} check>{p}</Chip>
                ))}
              </div>
            </Step>

            <Step n={5} title="추가 요청사항" hint="선택">
              <Textarea value={extra} onChange={(e) => setExtra(e.target.value.slice(0, 1000))} rows={4} placeholder="강조하고 싶은 상품 특징이나 원하는 홍보 방향을 입력하세요." className="bg-card" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {EXTRA_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setExtra((v) => (v ? `${v}\n${ex}` : ex))} className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
                    + {ex}
                  </button>
                ))}
              </div>
            </Step>

            <div className="sticky bottom-3 z-10 rounded-2xl bg-card p-3 shadow-lift lg:static lg:bg-transparent lg:p-0 lg:shadow-none">
              <button onClick={run} disabled={loading || !clientId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-extrabold text-primary-foreground shadow-lift transition hover:bg-primary-deep disabled:opacity-60">
                {loading ? <Loader2 className="size-5 animate-spin" /> : <Wand2 className="size-5" />}
                {loading ? "생성 중..." : "AI 마케팅 콘텐츠 생성하기"}
              </button>
              {missing.length > 0 && !loading && (
                <p className="mt-2 text-center text-xs text-muted-foreground">선택 필요: {missing.join(" · ")}</p>
              )}
            </div>
          </div>

          {/* RIGHT: result */}
          <div id="result" className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
            <div className="flex min-h-[560px] flex-col rounded-3xl border border-border bg-card shadow-soft">
              {loading ? (
                <LoadingPanel step={step} />
              ) : error ? (
                <div className="m-auto max-w-sm p-8 text-center">
                  <AlertTriangle className="mx-auto size-10 text-destructive" />
                  <h3 className="mt-4 font-bold">콘텐츠를 생성하지 못했습니다</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                  <button onClick={run} className="mt-5 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-primary">다시 시도</button>
                </div>
              ) : !gen ? (
                <div className="m-auto max-w-sm p-8 text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-primary-deep"><Sparkles className="size-7" /></span>
                  <h3 className="mt-5 text-lg font-bold">아직 생성된 콘텐츠가 없습니다</h3>
                  <p className="mt-2 text-sm text-muted-foreground">왼쪽에서 상품·고객·채널·목적을 선택한 후 생성 버튼을 눌러주세요. 결과가 이곳에 채널별로 표시됩니다.</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-border p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs text-muted-foreground">{gen.productName}</div>
                        <div className="font-bold">생성 결과</div>
                      </div>
                      <ModeBadge mode={gen.channelModes[tab] ?? "demo"} />
                    </div>
                    <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
                      {CHANNELS.filter((c) => gen.channels.includes(c.id)).map((c) => (
                        <button key={c.id} onClick={() => setTab(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === c.id ? "bg-ink text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                          {c.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  {gen.channelModes[tab] === "demo" && (
                    <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs text-accent-foreground sm:mx-5">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      데모 콘텐츠입니다. AI 연결 문제로 등록된 상품 정보를 바탕으로 한 예시 결과가 표시되고 있습니다. '다시 생성'으로 AI 생성을 재시도할 수 있습니다.
                    </div>
                  )}
                  <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:max-h-[62vh]">
                    {busyChannel === tab && (
                      <div className="absolute inset-0 z-10 grid place-items-center bg-card/80 backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin text-primary-deep" />
                      </div>
                    )}
                    {current && tab === "blog" && <BlogView c={current as BlogContent} />}
                    {current && tab === "shorts" && <ShortsView c={current as ShortsContent} />}
                    {current && tab !== "blog" && tab !== "shorts" && <SnsView c={current as SnsContent} />}
                  </div>
                  <div className="space-y-3 border-t border-border p-4 sm:p-5">
                    <div className="flex flex-wrap gap-2">
                      {current && tab === "blog" && (
                        <>
                          <Act icon={Copy} onClick={() => copy(blogToText(current as BlogContent), "전체 내용이 복사되었습니다")}>전체 복사</Act>
                          <Act icon={Copy} onClick={() => copy(blogToText(current as BlogContent, "title"), "제목이 복사되었습니다")}>제목 복사</Act>
                          <Act icon={Copy} onClick={() => copy(blogToText(current as BlogContent, "body"), "본문이 복사되었습니다")}>본문 복사</Act>
                        </>
                      )}
                      {current && tab === "shorts" && (
                        <>
                          <Act icon={Copy} onClick={() => copy(shortsToText(current as ShortsContent), "대본이 복사되었습니다")}>대본 복사</Act>
                          <Act icon={Copy} onClick={() => copy(shortsToText(current as ShortsContent, "captions"), "자막이 복사되었습니다")}>자막 복사</Act>
                        </>
                      )}
                      {current && tab !== "blog" && tab !== "shorts" && (
                        <Act icon={Copy} onClick={() => copy(snsToText(current as SnsContent), "전체 내용이 복사되었습니다")}>전체 복사</Act>
                      )}
                      <Act icon={PencilLine} onClick={() => { setRevText(""); setRevOpen(true); }}>수정 요청</Act>
                      <Act icon={RefreshCw} onClick={() => regen()} disabled={!!busyChannel}>다시 생성</Act>
                      {current && (
                        <Act icon={Download} onClick={() => downloadTxt(fileBase, channelToText(tab, current))}>TXT 다운로드</Act>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
                      <span className="text-xs font-semibold text-muted-foreground">이 결과가 만족스러우신가요?</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => rate(n)} aria-label={`${n}점`}>
                            <Star className={`size-5 ${gen.rating && n <= gen.rating ? "fill-primary text-primary-deep" : "text-border"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {gen.historySaved
                        ? "결과는 자동 저장됩니다. '회사 확인 필요' 항목은 게시 전 반드시 확인하세요."
                        : "이 결과는 현재 세션에만 표시됩니다. Lovable Cloud 배포·미리보기에서 생성하면 이력에 저장됩니다."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={revOpen} onOpenChange={setRevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수정 요청</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">현재 {CHANNELS.find((c) => c.id === tab)?.label} 결과에서 바꾸고 싶은 내용을 알려주세요.</p>
          <Textarea rows={4} value={revText} onChange={(e) => setRevText(e.target.value.slice(0, 1000))} placeholder="예: 더 짧고 임팩트 있게, 초기 비용 부담 완화를 더 강조해 주세요." />
          <DialogFooter>
            <button onClick={() => setRevOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">취소</button>
            <button
              disabled={!revText.trim()}
              onClick={() => { setRevOpen(false); regen(revText.trim()); }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              수정 반영하기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={histOpen} onOpenChange={setHistOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>콘텐츠 생성 이력</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 px-4 pb-6">
            {histLoading ? (
              <div className="py-12 text-center"><Loader2 className="mx-auto size-6 animate-spin" /></div>
            ) : history.length === 0 ? (
              <Empty text="아직 저장된 생성 이력이 없습니다. 콘텐츠를 생성하면 자동으로 저장됩니다." />
            ) : (
              history.map((h) => (
                <div key={h.id} className="group rounded-2xl border border-border p-4 hover:border-primary">
                  <button className="w-full text-left" onClick={() => loadHistory(h.id)}>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{new Date(h.created_at).toLocaleString("ko-KR")}</span>
                      <ModeBadge mode={h.mode === "ai" ? "ai" : "demo"} small />
                    </div>
                    <div className="mt-1.5 line-clamp-1 font-semibold">{h.title ?? h.product_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {h.product_name} · {h.channels.map((c) => CHANNELS.find((x) => x.id === c)?.short).join(", ")}
                    </div>
                    {h.rating && <div className="mt-1 text-xs text-primary-deep">{"★".repeat(h.rating)}</div>}
                  </button>
                  <button onClick={() => removeHistory(h.id)} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" /> 삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg bg-ink px-2 py-1 text-[11px] font-extrabold text-primary">STEP 0{n}</span>
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children, check }: { active: boolean; onClick: () => void; children: React.ReactNode; check?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${active ? "border-ink bg-ink text-primary" : "border-border bg-card text-foreground hover:border-primary"}`}>
      {check && active && <Check className="size-3.5" />}
      {children}
    </button>
  );
}

function Checkmark({ on }: { on: boolean }) {
  return (
    <span className={`absolute top-3 right-3 grid size-5 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

function ProductCard({ p, active, onClick }: { p: Product; active: boolean; onClick: () => void }) {
  const img = p.image_url ?? (p.rent_type === "short" ? shortImg : longImg);
  return (
    <button onClick={onClick} aria-pressed={active} className={`relative overflow-hidden rounded-2xl border-2 text-left transition ${active ? "border-primary shadow-lift" : "border-border hover:border-primary/50"}`}>
      <div className="relative bg-muted">
        <img src={img} alt={p.vehicle_model ?? p.name} width={1024} height={768} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        {p.is_sample && <span className="absolute top-2 left-2 rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-primary">SAMPLE 데이터</span>}
        <Checkmark on={active} />
      </div>
      <div className="space-y-2 p-4">
        <div className="text-[11px] font-bold text-primary-deep">{rentTypeLabel(p.rent_type)}</div>
        <div className="font-bold leading-snug">{p.name}</div>
        <dl className="grid grid-cols-[64px_1fr] gap-x-2 gap-y-1 text-xs">
          <dt className="text-muted-foreground">차량 모델</dt><dd>{p.vehicle_model ?? "회사 확인 필요"}</dd>
          <dt className="text-muted-foreground">렌트 기간</dt><dd>{p.rent_period ?? "회사 확인 필요"}</dd>
          <dt className="text-muted-foreground">월 렌트료</dt><dd className="font-semibold">{formatWon(p.monthly_fee)}</dd>
          <dt className="text-muted-foreground">보증금</dt><dd className="font-semibold">{formatWon(p.deposit)}</dd>
          <dt className="text-muted-foreground">배터리</dt><dd>{p.battery_swap_info ?? "회사 확인 필요"}</dd>
        </dl>
        <ul className="space-y-0.5 border-t border-border pt-2 text-xs text-muted-foreground">
          {p.advantages.map((a) => <li key={a}>✓ {a}</li>)}
        </ul>
      </div>
    </button>
  );
}

function LoadingPanel({ step }: { step: number }) {
  return (
    <div className="m-auto w-full max-w-sm p-8">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-ink">
        <Sparkles className="size-7 animate-pulse text-primary" />
      </div>
      <h3 className="mt-5 text-center text-lg font-bold">AI가 콘텐츠를 만들고 있어요</h3>
      <ol className="mt-6 space-y-2.5">
        {PROGRESS.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 text-sm ${i <= step ? "text-foreground" : "text-muted-foreground/60"}`}>
            {i < step ? (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" strokeWidth={3} /></span>
            ) : i === step ? (
              <Loader2 className="size-5 animate-spin text-primary-deep" />
            ) : (
              <span className="size-5 rounded-full border-2 border-border" />
            )}
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all duration-700" style={{ width: `${((step + 1) / PROGRESS.length) * 100}%` }} />
      </div>
    </div>
  );
}

function ModeBadge({ mode, small }: { mode: "ai" | "demo"; small?: boolean }) {
  return mode === "ai" ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ink font-bold text-primary ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}>
      <Sparkles className="size-3" /> AI 생성
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full border border-primary-deep font-bold text-primary-deep ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}>
      데모 콘텐츠
    </span>
  );
}

function Act({ icon: I, onClick, children, disabled }: { icon: typeof Copy; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-ink hover:bg-ink hover:text-primary disabled:opacity-50">
      <I className="size-3.5" /> {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
