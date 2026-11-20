import type { QueryClient } from "@tanstack/react-query";
import { enhancedCache } from "./enterprise/enhancedCache";

export async function applyProfileImageUpdate(
  client: QueryClient,
  field: "profileImageUrl" | "backgroundImageUrl",
  saved: any,
) {
  if (!saved?.id || !saved[field]) throw new Error("Image save was not confirmed");
  const key = ["/api/auth/user"];
  const current: any = client.getQueryData(key);
  // Do not revive a logged-out profile or overwrite another signed-in member.
  if (current === null || (current?.id && current.id !== saved.id)) return;
  await client.cancelQueries({ queryKey: key });
  const latest: any = client.getQueryData(key);
  if (latest === null || (latest?.id && latest.id !== saved.id)) return;
  const timestamp = (value: any) => new Date(value?.updatedAt || 0).getTime() || 0;
  // Cancellation may revert a fetch snapshot; alternatively another image save
  // may have completed while cancellation awaited. Keep the newer profile.
  const base = timestamp(latest) > timestamp(current) ? latest : (current || latest);
  client.setQueryData(key, {
    ...saved,
    ...base,
    [field]: saved[field],
    updatedAt: timestamp(saved) >= timestamp(base) ? saved.updatedAt : base.updatedAt,
  });
  // Clear both tiers for BOTH kinds of image, without treating a failed cache
  // cleanup as a failed upload after the server has already committed the save.
  await Promise.all([
    enhancedCache.removeByPattern("/api/auth/user"),
    enhancedCache.removeByPattern("/api/user"),
  ]).catch(() => console.warn("[ProfileImage] Image saved; cache cleanup unavailable"));
  await client.invalidateQueries({ queryKey: key, refetchType: "none" });
}
