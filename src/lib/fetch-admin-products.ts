import type { AdminProduct } from "./products-admin.functions";

export async function fetchAdminProductsForApp(): Promise<AdminProduct[]> {
  if (import.meta.env.VITE_GITHUB_PAGES === "true" && typeof window !== "undefined") {
    const { listAdminProductsInBrowser } = await import("./products-admin-browser");
    return listAdminProductsInBrowser();
  }
  const { listAdminProducts } = await import("./products-admin.functions");
  return listAdminProducts();
}
