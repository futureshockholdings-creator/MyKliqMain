---
name: Message and connection freshness
description: Keep incognito content and Konnect membership synchronized without depending on polling.
---

An incognito alert must refresh message content as well as the notification count. Confirmed Konnect membership should update the visible member list immediately and remove the matching opportunity.

**Why:** The user reported a yellow alert appearing before the message, which waited for polling, and Konnect requiring a hard refresh. Private stale-while-revalidate caches could return older data even after React Query invalidation; the shared live connection was owned only by Headlines.

**How to apply:** Keep the live-update connection in the authenticated app shell, not in one route. Let React Query own freshness for message and connection data rather than returning private SWR copies or reusing a GET started before the update. Cancel outdated reads without reverting local confirmed changes. Apply successful membership responses directly, and distinguish the acting account before writing its cache.

Live messages are refresh signals, not a transport for private message bodies. Notifications arriving through polling must also refresh message content, so the yellow alert cannot get ahead of the inbox indefinitely.

**Why:** Existing WebSocket routing is process-local and clients also have polling fallbacks. Content must remain behind authenticated HTTP access rather than exposing it through subscription metadata.

**How to apply:** Emit hints only after persistence, reconnect across signed-in routes, resynchronize on return to the app, and retain polling for interrupted live connections. Do not change message-expiry or kliq-access rules to improve perceived speed.
