import type { QueryClient } from "@tanstack/react-query";

export interface SavedPostEdit {
  id: string;
  content: string | null;
  updatedAt?: string | Date | null;
}

/** React Query owns freshness for post data; a second SWR layer hides edits. */
export function isPostDataUrl(url: string): boolean {
  try {
    const path = new URL(url, "https://cache.invalid").pathname;
    return path === "/api/kliq-feed" || path === "/api/posts" || path.startsWith("/api/posts/");
  } catch {
    return false;
  }
}

/** Patch edited fields only, preserving authors, media, likes and pagination. */
export function mergeSavedPostEdit(data: any, saved: SavedPostEdit): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    const next = data.map(item => mergeSavedPostEdit(item, saved));
    return next.some((item, index) => item !== data[index]) ? next : data;
  }
  if (data.id === saved.id) {
    return {
      ...data,
      content: saved.content,
      ...(saved.updatedAt !== undefined ? { updatedAt: saved.updatedAt } : {}),
    };
  }
  let result = data;
  for (const key of ["pages", "items", "posts"]) {
    if (!Array.isArray(data[key])) continue;
    const next = mergeSavedPostEdit(data[key], saved);
    if (next !== data[key]) result = { ...result, [key]: next };
  }
  return result;
}

export async function applySavedPostEdit(client: QueryClient, saved: SavedPostEdit): Promise<void> {
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    typeof query.queryKey[0] === "string" && isPostDataUrl(query.queryKey[0]);

  // Ignore a feed request started before the save, rather than letting its old
  // snapshot overwrite the confirmed edit when it completes.
  const current = client.getQueriesData({ predicate });
  await client.cancelQueries({ predicate });
  // Cancellation can revert to the fetch-start snapshot. Preserve newer local
  // likes/comments and apply only the server-confirmed edited fields.
  for (const [key, data] of current) {
    client.setQueryData(key, mergeSavedPostEdit(data, saved));
  }
  // No full-feed refetch is needed to display a successful edit. The existing
  // polling/focus/mount refreshes will reconcile other fields with the server.
  await client.invalidateQueries({ predicate, refetchType: "none" });
}
