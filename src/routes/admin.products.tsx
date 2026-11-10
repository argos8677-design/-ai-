import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Package, Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { AdminSupabaseLogin } from "@/components/admin-supabase-login";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminProduct,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProduct,
} from "@/lib/products-admin.functions";
import { fetchAdminProductsForApp } from "@/lib/fetch-admin-products";
import {
  createAdminProductInBrowser,
  getAdminBrowserSession,
  setAdminProductActiveInBrowser,
  subscribeAdminAuth,
  updateAdminProductInBrowser,
} from "@/lib/products-admin-auth-browser";
import { isGitHubPagesPreview } from "@/lib/is-github-pages";
import { formatWon, rentTypeLabel } from "@/lib/marketing";

const adminProductsQuery = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => fetchAdminProductsForApp(),
});

function formatRouteError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("<!DOCTYPE") || message.includes("<html")) {
    return "페이지를 불러오지 못했습니다. GitHub Pages에서는 메뉴에서 「상품 관리」로 들어오거나, 배포가 완료된 뒤 새로고침해 주세요.";
  }
  return message;
}

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "렌트 상품 관리 | BIKEBANK AI MARKETING" },
      { name: "description", content: "바이크뱅크 렌트 상품 등록·수정·비활성화" },
    ],
  }),
  component: AdminProductsPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <AlertTriangle className="mx-auto size-10 text-destructive" />
      <h1 className="mt-4 text-xl font-bold">상품 관리를 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">{formatRouteError(error)}</p>
      <Link to="/generate" className="mt-6 inline-block text-sm font-semibold text-primary underline">
        AI 소재 생성으로 돌아가기
      </Link>
    </div>
  ),
});

type FormState = {
  name: string;
  rent_type: "short" | "long";
  vehicle_model: string;
  rent_period: string;
  monthly_fee: string;
  deposit: string;
  battery_swap_info: string;
  advantages: string;
  is_sample: boolean;
  sort_order: string;
};

const emptyForm = (): FormState => ({
  name: "",
  rent_type: "short",
  vehicle_model: "",
  rent_period: "",
  monthly_fee: "",
  deposit: "",
  battery_swap_info: "",
  advantages: "",
  is_sample: false,
  sort_order: "10",
});

function parseFee(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function productToForm(p: AdminProduct): FormState {
  return {
    name: p.name,
    rent_type: p.rent_type,
    vehicle_model: p.vehicle_model ?? "",
    rent_period: p.rent_period ?? "",
    monthly_fee: p.monthly_fee != null ? String(p.monthly_fee) : "",
    deposit: p.deposit != null ? String(p.deposit) : "",
    battery_swap_info: p.battery_swap_info ?? "",
    advantages: p.advantages.join("\n"),
    is_sample: p.is_sample,
    sort_order: String(p.sort_order),
  };
}

function formToPayload(f: FormState) {
  const advantages = f.advantages
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!advantages.length) throw new Error("주요 장점을 한 줄 이상 입력해 주세요.");
  const sort = Number(f.sort_order);
  if (!Number.isFinite(sort) || sort < 0) throw new Error("정렬 순서는 0 이상의 숫자여야 합니다.");
  return {
    name: f.name.trim(),
    rent_type: f.rent_type,
    vehicle_model: f.vehicle_model.trim() || null,
    rent_period: f.rent_period.trim() || null,
    monthly_fee: parseFee(f.monthly_fee),
    deposit: parseFee(f.deposit),
    battery_swap_info: f.battery_swap_info.trim() || null,
    advantages,
    is_sample: f.is_sample,
    sort_order: sort,
  };
}

function AdminProductsPage() {
  const { data: products } = useSuspenseQuery(adminProductsQuery);
  const qc = useQueryClient();
  const createFn = useServerFn(createAdminProduct);
  const updateFn = useServerFn(updateAdminProduct);
  const activeFn = useServerFn(setAdminProductActive);

  const ghPages = isGitHubPagesPreview();
  const [adminSession, setAdminSession] = useState<Session | null | undefined>(ghPages ? undefined : null);
  const ghPagesWrite = ghPages && !!adminSession;
  const ghPagesReadOnly = ghPages && !adminSession;

  useEffect(() => {
    if (!ghPages) return;
    let cancelled = false;
    getAdminBrowserSession()
      .then((s) => {
        if (!cancelled) setAdminSession(s);
      })
      .catch((e) => {
        console.error("[admin/products] session check failed", e);
        if (!cancelled) setAdminSession(null);
      });
    const unsub = subscribeAdminAuth((s) => {
      if (!cancelled) setAdminSession(s);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [ghPages]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const activeCount = useMemo(() => products.filter((p) => p.is_active).length, [products]);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    await qc.invalidateQueries({ queryKey: ["products"] });
  }

  function openCreate() {
    if (ghPagesReadOnly) {
      toast.message("먼저 Supabase 관리자로 로그인해 주세요.");
      return;
    }
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(p: AdminProduct) {
    if (ghPagesReadOnly) {
      toast.message("먼저 Supabase 관리자로 로그인해 주세요.");
      return;
    }
    setEditing(p);
    setForm(productToForm(p));
    setDialogOpen(true);
  }

  async function save() {
    if (ghPages && !ghPagesWrite) return;
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (ghPagesWrite) {
        if (editing) {
          await updateAdminProductInBrowser(adminSession, editing.id, payload);
          toast.success("상품이 수정되었습니다.");
        } else {
          await createAdminProductInBrowser(adminSession, payload);
          toast.success("상품이 등록되었습니다.");
        }
      } else if (editing) {
        await updateFn({ data: { id: editing.id, ...payload } });
        toast.success("상품이 수정되었습니다.");
      } else {
        await createFn({ data: payload });
        toast.success("상품이 등록되었습니다.");
      }
      setDialogOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: AdminProduct) {
    if (ghPagesReadOnly) {
      toast.message("먼저 Supabase 관리자로 로그인해 주세요.");
      return;
    }
    try {
      if (ghPagesWrite) {
        await setAdminProductActiveInBrowser(adminSession, p.id, !p.is_active);
      } else {
        await activeFn({ data: { id: p.id, is_active: !p.is_active } });
      }
      toast.success(p.is_active ? "상품을 비활성화했습니다." : "상품을 다시 활성화했습니다.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    }
  }

  return (
    <div className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-primary-deep">ADMIN</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">렌트 상품 관리</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              등록·수정·비활성화한 내용은 AI 소재 생성 화면의 상품 목록에 반영됩니다. (활성 {activeCount}건 / 전체{" "}
              {products.length}건)
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-xl bg-primary font-bold text-primary-foreground shadow-lift"
            disabled={ghPagesReadOnly}
          >
            <Plus className="size-4" /> 새 상품 등록
          </Button>
        </div>

        {ghPages && (
          <div className="mt-4 space-y-3">
            {!ghPagesWrite && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary-deep" />
                <p>
                  GitHub Pages 미리보기입니다. 로그인 전에는 <strong>활성 상품만</strong> 보입니다. 아래에서 Supabase
                  관리자로 로그인하면 등록·수정·비활성화가 가능합니다.
                </p>
              </div>
            )}
            <AdminSupabaseLogin
              session={adminSession ?? null}
              onSessionChange={setAdminSession}
              onSignedIn={() => void refresh()}
            />
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">상품명</th>
                  <th className="px-4 py-3 font-semibold">유형</th>
                  <th className="px-4 py-3 font-semibold">월 렌트료</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">정렬</th>
                  <th className="px-4 py-3 font-semibold text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-4">
                      <div className="font-semibold">{p.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{p.vehicle_model ?? "차량 모델 미입력"}</div>
                    </td>
                    <td className="px-4 py-4">{rentTypeLabel(p.rent_type)}</td>
                    <td className="px-4 py-4">{formatWon(p.monthly_fee)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          p.is_active ? "bg-primary/15 text-primary-deep" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "활성" : "비활성"}
                      </span>
                      {p.is_sample && (
                        <span className="ml-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          SAMPLE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">{p.sort_order}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          disabled={ghPagesReadOnly}
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          disabled={ghPagesReadOnly}
                          onClick={() => toggleActive(p)}
                        >
                          {p.is_active ? (
                            <>
                              <PowerOff className="size-3.5" /> 비활성화
                            </>
                          ) : (
                            <>
                              <Power className="size-3.5" /> 활성화
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!products.length && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Package className="size-10 text-muted-foreground" />
              <p className="font-semibold">등록된 상품이 없습니다.</p>
              <Button onClick={openCreate} className="rounded-xl">
                첫 상품 등록하기
              </Button>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          비활성화된 상품은 AI 소재 생성 화면에 표시되지 않습니다. 가격·보증금 미입력 시 생성 콘텐츠에「회사 확인 필요」로 표시됩니다.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "상품 수정" : "새 상품 등록"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">상품명 *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>렌트 유형 *</Label>
              <div className="flex gap-2">
                {(["short", "long"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, rent_type: t })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      form.rent_type === t ? "bg-ink text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {rentTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicle_model">차량 모델</Label>
                <Input
                  id="vehicle_model"
                  value={form.vehicle_model}
                  onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rent_period">렌트 기간</Label>
                <Input
                  id="rent_period"
                  value={form.rent_period}
                  onChange={(e) => setForm({ ...form, rent_period: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthly_fee">월 렌트료 (원, 숫자)</Label>
                <Input
                  id="monthly_fee"
                  inputMode="numeric"
                  placeholder="미입력 시 회사 확인 필요"
                  value={form.monthly_fee}
                  onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deposit">보증금 (원, 숫자)</Label>
                <Input
                  id="deposit"
                  inputMode="numeric"
                  placeholder="미입력 시 회사 확인 필요"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="battery">배터리 스왑 안내</Label>
              <Textarea
                id="battery"
                rows={2}
                value={form.battery_swap_info}
                onChange={(e) => setForm({ ...form, battery_swap_info: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="advantages">주요 장점 * (한 줄에 하나)</Label>
              <Textarea
                id="advantages"
                rows={4}
                placeholder="짧은 기간 부담 없이 이용"
                value={form.advantages}
                onChange={(e) => setForm({ ...form, advantages: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sort">목록 정렬 순서</Label>
                <Input
                  id="sort"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
              <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_sample}
                  onChange={(e) => setForm({ ...form, is_sample: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                테스트용 샘플 상품으로 표시
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim()} className="font-bold">
              {saving ? "저장 중…" : editing ? "수정 저장" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
