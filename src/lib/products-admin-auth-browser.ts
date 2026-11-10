import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabase } from "./supabase-browser";
import type { AdminProduct } from "./products-admin.functions";

function adminSupabase() {
  return createBrowserSupabase({ persistAuth: true });
}

export async function getAdminBrowserSession(): Promise<Session | null> {
  const { data } = await adminSupabase().auth.getSession();
  return data.session;
}

export function subscribeAdminAuth(onChange: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = adminSupabase().auth.onAuthStateChange((_event, session) => onChange(session));
  return () => subscription.unsubscribe();
}

export async function signInAdminBrowser(email: string, password: string): Promise<void> {
  const { error } = await adminSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    console.error("[signInAdminBrowser]", error.message);
    if (error.message.toLowerCase().includes("invalid login")) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    throw new Error("관리자 로그인에 실패했습니다. Supabase Authentication에서 사용자를 만들었는지 확인해 주세요.");
  }
}

export async function signOutAdminBrowser(): Promise<void> {
  const { error } = await adminSupabase().auth.signOut();
  if (error) throw new Error("로그아웃에 실패했습니다.");
}

type ProductWritePayload = Omit<
  AdminProduct,
  "id" | "is_active" | "created_at" | "updated_at"
>;

function requireSession(session: Session | null): asserts session is Session {
  if (!session) {
    throw new Error("관리자 로그인이 필요합니다.");
  }
}

export async function createAdminProductInBrowser(
  session: Session | null,
  data: ProductWritePayload,
): Promise<AdminProduct> {
  requireSession(session);
  const sb = adminSupabase();
  const { data: row, error } = await sb
    .from("products")
    .insert({ ...data, is_active: true, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error || !row) {
    console.error("[createAdminProductInBrowser]", error?.message, error?.code);
    if (error?.code === "42501") {
      throw new Error(
        "등록 권한이 없습니다. Supabase SQL Editor에서 supabase/migrations/20260310150000_products_authenticated_admin_rls.sql 을 실행해 주세요.",
      );
    }
    throw new Error("상품 등록에 실패했습니다.");
  }
  return row as AdminProduct;
}

export async function updateAdminProductInBrowser(
  session: Session | null,
  id: string,
  data: ProductWritePayload,
): Promise<AdminProduct> {
  requireSession(session);
  const sb = adminSupabase();
  const { data: row, error } = await sb
    .from("products")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !row) {
    console.error("[updateAdminProductInBrowser]", error?.message, error?.code);
    if (error?.code === "42501") {
      throw new Error(
        "수정 권한이 없습니다. Supabase SQL Editor에서 supabase/migrations/20260310150000_products_authenticated_admin_rls.sql 을 실행해 주세요.",
      );
    }
    throw new Error("상품 수정에 실패했습니다.");
  }
  return row as AdminProduct;
}

export async function setAdminProductActiveInBrowser(
  session: Session | null,
  id: string,
  is_active: boolean,
): Promise<AdminProduct> {
  requireSession(session);
  const sb = adminSupabase();
  const { data: row, error } = await sb
    .from("products")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !row) {
    console.error("[setAdminProductActiveInBrowser]", error?.message, error?.code);
    if (error?.code === "42501") {
      throw new Error(
        "상태 변경 권한이 없습니다. Supabase SQL Editor에서 supabase/migrations/20260310150000_products_authenticated_admin_rls.sql 을 실행해 주세요.",
      );
    }
    throw new Error("상품 상태 변경에 실패했습니다.");
  }
  return row as AdminProduct;
}
