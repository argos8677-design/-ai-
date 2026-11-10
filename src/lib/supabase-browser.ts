import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "./marketing";

export type BrowserSupabaseOptions = {
  /** Keep session in localStorage — use on /admin/products (GitHub Pages CRUD via RLS). */
  persistAuth?: boolean;
};

export function createBrowserSupabase(options?: BrowserSupabaseOptions) {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase URL 또는 publishable key가 빌드에 포함되지 않았습니다. .env.production 또는 GitHub Actions Variables를 확인해 주세요.",
    );
  }

  const persistAuth = options?.persistAuth === true;

  return createClient<Database>(url, key, {
    auth: persistAuth
      ? { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      : { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function fetchActiveProductById(productId: string): Promise<Product> {
  const sb = createBrowserSupabase();
  const { data, error } = await sb.from("products").select("*").eq("id", productId).eq("is_active", true).maybeSingle();
  if (error || !data) throw new Error("등록된 상품을 찾을 수 없습니다.");
  return data as Product;
}
