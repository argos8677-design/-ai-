import type { Session } from "@supabase/supabase-js";
import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAdminBrowserSession,
  signInAdminBrowser,
  signOutAdminBrowser,
} from "@/lib/products-admin-auth-browser";

type Props = {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  onSignedIn?: () => void;
};

export function AdminSupabaseLogin({ session, onSessionChange, onSignedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInAdminBrowser(email, password);
      const s = await getAdminBrowserSession();
      onSessionChange(s);
      onSignedIn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await signOutAdminBrowser();
      onSessionChange(null);
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-card px-4 py-3 text-sm">
        <p>
          Supabase 관리자로 로그인됨 <span className="text-muted-foreground">({session.user.email})</span>
        </p>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={busy} onClick={logout}>
          <LogOut className="size-3.5" /> 로그아웃
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card px-4 py-4">
      <p className="text-sm font-semibold">Supabase 관리자 로그인</p>
      <p className="mt-1 text-xs text-muted-foreground">
        GitHub Pages에서는 서버가 없어 Supabase Authentication 계정으로 등록·수정합니다. 대시보드 → Authentication →
        Users에서 관리자를 만든 뒤, SQL Editor에서{" "}
        <code className="rounded bg-muted px-1">20260310150000_products_authenticated_admin_rls.sql</code> 마이그레이션을
        실행해 주세요.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit}>
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="admin-email">이메일</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="admin-password">비밀번호</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="rounded-xl font-bold" disabled={busy}>
          <LogIn className="size-4" /> 로그인
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
