import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SectionHead({ eyebrow, title, sub, align = "center" }: { eyebrow: string; title: string; sub?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <span className="text-xs font-bold tracking-[0.2em] text-primary-deep">{eyebrow}</span>
      <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function BottomCta({ title, button }: { title: string; button: string }) {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        <Link to="/generate" className="inline-flex items-center gap-2 rounded-xl bg-ink px-7 py-4 font-bold text-primary transition hover:opacity-90">
          <Sparkles className="size-5" /> {button}
        </Link>
      </div>
    </section>
  );
}
