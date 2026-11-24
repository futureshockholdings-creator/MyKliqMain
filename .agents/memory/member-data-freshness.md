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

Show the recipient's name and profile picture before the first message, independently of whether a thread has messages.

**Why:** The user asked to identify who they are messaging from the onset, rather than only after sending the initial message.

**How to apply:** Reuse the selected member's profile details when available and load their profile independently for direct links. Empty or expired message history must not remove the recipient's identity. Do not replace the shared full-profile cache with a partial identity object.

Poll voting must update counts, percentages, and bars together immediately;
members should not see a selected vote alongside a temporary zero tally.

**Why:** The owner reported poll results waiting several seconds after a vote.
Marking selection alone is not an optimistic tally, and a separate stale cache
can overwrite server-confirmed results.

**How to apply:** Apply a reversible local tally, reconcile with the saved
response, and keep one freshness owner for poll reads. Preserve confirmed
voting state across feed/list navigation without increasing polling frequency.

Deleting an unread incognito conversation must also clear its matching yellow
message alerts for affected recipients.

**Why:** The owner reported that recipients saw a yellow alert after the sender
deleted the conversation, but then found an empty inbox.

**How to apply:** Keep message removal and unread-alert cleanup consistent,
refresh affected members after persistence, and preserve alerts belonging to
other conversations or remaining unread content.
