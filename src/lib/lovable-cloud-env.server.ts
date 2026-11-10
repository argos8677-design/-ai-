/** Resolve Lovable Cloud / Supabase server env (never expose secrets to the client). */

let applied = false;

const SERVICE_KEY_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_KEY",
] as const;

/** Map Cloud-injected aliases onto names used by generated Supabase clients. */
export function applyLovableCloudEnv(): void {
  if (applied) return;
  applied = true;

  if (!process.env["SUPABASE_URL"]?.trim() && process.env["VITE_SUPABASE_URL"]?.trim()) {
    process.env["SUPABASE_URL"] = process.env["VITE_SUPABASE_URL"]!.trim();
  }
  if (!process.env["SUPABASE_PUBLISHABLE_KEY"]?.trim() && process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim()) {
    process.env["SUPABASE_PUBLISHABLE_KEY"] = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!.trim();
  }
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim()) {
    for (const name of SERVICE_KEY_NAMES) {
      const value = process.env[name]?.trim();
      if (value) {
        process.env["SUPABASE_SERVICE_ROLE_KEY"] = value;
        break;
      }
    }
  }
}

export function getSupabaseUrl(): string | undefined {
  applyLovableCloudEnv();
  return process.env["SUPABASE_URL"]?.trim() || undefined;
}

export function getSupabasePublishableKey(): string | undefined {
  applyLovableCloudEnv();
  return process.env["SUPABASE_PUBLISHABLE_KEY"]?.trim() || undefined;
}

export function hasSupabaseAdminConfig(): boolean {
  applyLovableCloudEnv();
  return Boolean(getSupabaseUrl() && process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim());
}

export function isLovableCloudRuntime(): boolean {
  return (
    process.env["LOVABLE_SANDBOX"] === "1" ||
    Boolean(process.env["LOVABLE_PREVIEW_HOST"]?.trim()) ||
    Boolean(process.env["LOVABLE_SPAWN_GENERATION"]?.trim())
  );
}
