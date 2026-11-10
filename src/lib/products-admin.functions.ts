import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  applyLovableCloudEnv,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseAdminConfig,
} from "./lovable-cloud-env.server";

const rentType = z.enum(["short", "long"]);

const productFields = z.object({
  name: z.string().min(1).max(200),
  rent_type: rentType,
  vehicle_model: z.string().max(200).nullable().optional(),
  rent_period: z.string().max(200).nullable().optional(),
  monthly_fee: z.number().int().min(0).nullable().optional(),
  deposit: z.number().int().min(0).nullable().optional(),
  battery_swap_info: z.string().max(500).nullable().optional(),
  advantages: z.array(z.string().max(200)).max(20),
  is_sample: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export type AdminProduct = {
  id: string;
  name: string;
  rent_type: "short" | "long";
  vehicle_model: string | null;
  rent_period: string | null;
  monthly_fee: number | null;
  deposit: number | null;
  battery_swap_info: string | null;
  advantages: string[];
  is_sample: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

async function getSupabaseAdmin() {
  applyLovableCloudEnv();
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Lovable Cloud 백엔드에 연결되지 않아 상품을 관리할 수 없습니다.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalizeRow(p: AdminProduct): AdminProduct {
  return { ...p, rent_type: p.rent_type as "short" | "long" };
}

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) throw new Error("Supabase 연결 정보를 불러오지 못했습니다.");

  if (hasSupabaseAdminConfig()) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("is_active", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[listAdminProducts]", error.message);
      throw new Error("상품 목록을 불러오지 못했습니다.");
    }
    return (data ?? []).map(normalizeRow);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await sb.from("products").select("*").order("sort_order");
  if (error) {
    console.error("[listAdminProducts]", error.message);
    throw new Error("상품 목록을 불러오지 못했습니다. Lovable Cloud에서 관리자 권한을 확인해 주세요.");
  }
  return (data ?? []).map(normalizeRow);
});

export const createAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((d) => productFields.parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({
        ...data,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error || !row) {
      console.error("[createAdminProduct]", error?.message);
      throw new Error("상품 등록에 실패했습니다.");
    }
    return normalizeRow(row as AdminProduct);
  });

export const updateAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((d) => productFields.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) {
      console.error("[updateAdminProduct]", error?.message);
      throw new Error("상품 수정에 실패했습니다.");
    }
    return normalizeRow(row as AdminProduct);
  });

export const setAdminProductActive = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error || !row) {
      console.error("[setAdminProductActive]", error?.message);
      throw new Error("상품 상태 변경에 실패했습니다.");
    }
    return normalizeRow(row as AdminProduct);
  });
