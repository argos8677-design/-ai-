/** True on the static GitHub Pages preview (no server functions). */
export function isGitHubPagesPreview(): boolean {
  if (import.meta.env.VITE_GITHUB_PAGES === "true") return true;
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.endsWith(".github.io") &&
    window.location.pathname.startsWith("/-ai-/")
  );
}
