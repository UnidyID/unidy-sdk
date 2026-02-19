export function extractSidFromUrl(): string | null {
  const url = new URL(window.location.href);
  const sid = url.searchParams.get("sid");
  if (!sid) return null;
  url.searchParams.delete("sid");
  window.history.replaceState({}, "", url.toString());
  return sid;
}
