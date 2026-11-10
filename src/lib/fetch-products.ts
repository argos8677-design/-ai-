import type { Product } from "./marketing";
import { createBrowserSupabase } from "./supabase-browser";

async function listActiveProductsInBrowser(): Promise<Product[]> {
  const sb = createBrowserSupabase();

  const { data, error } = await sb
    .from("products")
    .select("id,name,rent_type,vehicle_model,rent_period,monthly_fee,deposit,battery_swap_info,advantages,is_sample,product_images(image_url,sort_order)")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[listActiveProductsInBrowser]", error.message, error.code);
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase 프로젝트에 products 테이블이 없습니다. 대시보드 SQL Editor에서 supabase/migrations/20260306100000_marketing_schema.sql 파일 내용을 실행해 주세요.",
      );
    }
    throw new Error("상품 정보를 불러오지 못했습니다.");
  }

  return (data ?? []).map((p) => {
    const { product_images, ...rest } = p as typeof p & { product_images: { image_url: string }[] };
    return { ...rest, image_url: product_images?.[0]?.image_url ?? null } as Product;
  });
}

export async function fetchProductsForApp(): Promise<Product[]> {
  const useBrowserSupabase =
    import.meta.env.VITE_GITHUB_PAGES === "true" && typeof window !== "undefined";

  if (useBrowserSupabase) {
    return listActiveProductsInBrowser();
  }

  const { listProducts } = await import("./marketing.functions");
  return listProducts();
}
