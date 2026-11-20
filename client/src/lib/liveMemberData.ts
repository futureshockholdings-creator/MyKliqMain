import type { QueryClient } from "@tanstack/react-query";

export function isLiveMemberDataUrl(url: string): boolean {
  try {
    const path = new URL(url, "https://cache.invalid").pathname;
    return /^\/api\/(?:messages|group-chats|friends|kliqs)(?:\/|$)/.test(path);
  } catch {
    return false;
  }
}

const isMessageQuery = (query: { queryKey: readonly unknown[] }) =>
  typeof query.queryKey[0] === "string" &&
  /^\/api\/(?:messages|group-chats)(?:\/|$)/.test(query.queryKey[0]);

const isConnectionQuery = (query: { queryKey: readonly unknown[] }) =>
  typeof query.queryKey[0] === "string" &&
  /^\/api\/(?:friends|kliqs)(?:\/|$)/.test(query.queryKey[0]);

export async function refreshMessageData(client: QueryClient): Promise<void> {
  // Ignore older in-flight responses without reverting locally displayed sends.
  await client.cancelQueries({ predicate: isMessageQuery }, { revert: false });
  await client.invalidateQueries({ predicate: isMessageQuery, refetchType: "active" });
}

export async function refreshConnectionData(client: QueryClient): Promise<void> {
  await client.cancelQueries({ predicate: isConnectionQuery }, { revert: false });
  await client.invalidateQueries({ predicate: isConnectionQuery, refetchType: "active" });
  await client.invalidateQueries({ queryKey: ["/api/kliq-feed"], refetchType: "none" });
}

interface KonnectPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface ConfirmedConnection {
  id: string;
  userId: string;
  friendId: string;
  rank: number;
  status: string;
}

export async function applyConfirmedKonnect(
  client: QueryClient, userId: string, person: KonnectPerson, saved: ConfirmedConnection,
): Promise<boolean> {
  if (!saved?.id || saved.userId !== userId || saved.friendId !== person.id || saved.status !== "accepted") {
    throw new Error("The server did not confirm this connection");
  }
  const sameMember = () => {
    const current = client.getQueryData<{ id: string } | null>(["/api/auth/user"]);
    return current?.id === userId;
  };
  if (!sameMember()) return false;
  await client.cancelQueries({ predicate: isConnectionQuery }, { revert: false });
  if (!sameMember()) return false;

  client.setQueryData<any[]>(["/api/friends"], previous => {
    const friends = Array.isArray(previous) ? previous : [];
    const existing = friends.find(row => row.friendId === person.id);
    const confirmed = { ...existing, ...saved, friend: { ...person, ...existing?.friend } };
    return [...friends.filter(row => row.friendId !== person.id), confirmed]
      .sort((a, b) => a.rank - b.rank);
  });
  client.setQueryData<KonnectPerson[]>(["/api/friends/suggestions"], previous =>
    Array.isArray(previous) ? previous.filter(row => row.id !== person.id) : previous
  );
  // Keep the confirmed update visible; a fresh server read fills remaining fields.
  void client.invalidateQueries({ predicate: isConnectionQuery, refetchType: "active" })
    .catch(() => console.warn("[Konnect] Connection saved; refresh unavailable"));
  void client.invalidateQueries({ queryKey: ["/api/kliq-feed"], refetchType: "none" });
  return true;
}
