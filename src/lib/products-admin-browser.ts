import { createBrowserSupabase } from "./supabase-browser";
import type { AdminProduct } from "./products-admin.functions";

/** GitHub Pages: read-only product list via publishable key (RLS may hide inactive rows). */
export async function listAdminProductsInBrowser(): Promise<AdminProduct[]> {
  const sb = createBrowserSupabase();
  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[listAdminProductsInBrowser]", error.message, error.code);
    if (error.code === "PGRST205") {
      throw new Error(
        "products 테이블이 없습니다. Supabase SQL Editor에서 supabase/migrations/20260306100000_marketing_schema.sql 을 실행해 주세요.",
      );
    }
    throw new Error("상품 목록을 불러오지 못했습니다.");
  }

  return (data ?? []) as AdminProduct[];
}
