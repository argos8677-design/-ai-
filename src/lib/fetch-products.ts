import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "./marketing";

async function listActiveProductsInBrowser(): Promise<Product[]> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase URL 또는 publishable key가 빌드에 포함되지 않았습니다. .env.production 또는 GitHub Actions Variables를 확인해 주세요.",
    );
  }

  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await sb
    .from("products")
    .select("id,name,rent_type,vehicle_model,rent_period,monthly_fee,deposit,battery_swap_info,advantages,is_sample,product_images(image_url,sort_order)")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[listActiveProductsInBrowser]", error.message, error.code);
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
