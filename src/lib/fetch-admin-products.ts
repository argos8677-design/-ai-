import { isGitHubPagesPreview } from "./is-github-pages";
import type { AdminProduct } from "./products-admin.functions";

export async function fetchAdminProductsForApp(): Promise<AdminProduct[]> {
  if (isGitHubPagesPreview()) {
    const { listAdminProductsInBrowser } = await import("./products-admin-browser");
    return listAdminProductsInBrowser();
  }
  const { listAdminProducts } = await import("./products-admin.functions");
  return listAdminProducts();
}
