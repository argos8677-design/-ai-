import { Link } from "@tanstack/react-router";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import bikeBankLogo from "@/assets/bike-bank-logo.png";

const NAV = [
  { to: "/", label: "서비스 소개" },
  { to: "/generate", label: "AI 소재 생성" },
  { to: "/guide", label: "활용 방법" },
  { to: "/admin/products", label: "상품 관리" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img
        src={bikeBankLogo}
        alt="BIKE BANK"
        className="h-8 w-auto max-w-[9.5rem] object-contain object-left sm:h-9 sm:max-w-[11rem]"
        width={176}
        height={36}
        decoding="async"
      />
      <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground sm:text-xs">
        AI
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:font-semibold"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/generate"
            className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lift transition hover:bg-primary-deep sm:inline-flex"
          >
            <Sparkles className="size-4" /> AI 소재 만들기
          </Link>
          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="메뉴 열기">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium">
              {n.label}
            </Link>
          ))}
          <Link
            to="/generate"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <Sparkles className="size-4" /> AI 소재 만들기
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-lg bg-white px-3 py-1.5">
              <img
                src={bikeBankLogo}
                alt="BIKE BANK"
                className="h-7 w-auto max-w-[9rem] object-contain object-left"
                width={152}
                height={28}
                decoding="async"
              />
            </div>
            <span className="text-sm font-bold tracking-tight text-ink-foreground/90">AI MARKETING</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-ink-foreground/60">
            렌트 상품만 선택하세요. 마케팅은 AI가 완성합니다.
            <br />
            운영: 바이크뱅크(주) · 배터리 스왑 방식 전기 이륜차 렌트
          </p>
        </div>
        <p className="text-xs text-ink-foreground/40">© 2026 BIKEBANK Co., Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
