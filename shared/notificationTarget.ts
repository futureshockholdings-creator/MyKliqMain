interface NotificationTarget {
  type?: string;
  relatedType?: string | null;
  relatedId?: string | null;
  actionUrl?: string | null;
}

/** Resolve stored legacy alerts and new push alerts to the same member view. */
export function getNotificationTarget(notification: NotificationTarget): string {
  const { relatedId, relatedType, type } = notification;
  if (relatedId && (relatedType === "comment" || (!relatedType && type === "comment_like"))) {
    return `/?comment=${encodeURIComponent(relatedId)}&comments=1`;
  }
  if (relatedId && (relatedType === "post" || (!relatedType && ["post_like", "post_share", "comment"].includes(type || "")))) {
    return `/?post=${encodeURIComponent(relatedId)}${type === "comment" || type === "comment_like" ? "&comments=1" : ""}`;
  }
  // Some older alerts have only a direct-post URL, not related-object metadata.
  const match = notification.actionUrl?.match(/^\/posts?\/([^/?#]+)\/?(?:[?#].*)?$/);
  if (match) {
    let postId = match[1];
    try { postId = decodeURIComponent(postId); } catch { /* Keep invalid IDs on the unavailable-post screen, not a router error. */ }
    return `/?post=${encodeURIComponent(postId)}`;
  }
  return notification.actionUrl === "/bulletin" ? "/" : notification.actionUrl || "/";
}
