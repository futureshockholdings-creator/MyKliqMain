---
name: Notification navigation
description: Member-safe destinations for post alerts and compatibility with stored legacy notification links.
---

Like and comment alerts must open the original post, including posts older than the first feed page. Comment-related IDs must be resolved as comments, not assumed to be post IDs.

**Why:** The user reported notification taps ending on a 404. Stored alerts referenced an obsolete bulletin destination, while the existing direct-post review screen was for administrators.

**How to apply:** Use the same destination rules for the in-app panel and PWA push payloads. Resolve old alert metadata at click time rather than requiring a destructive rewrite of notification history. Keep admin review separate from ordinary member navigation, and retain the feed's membership/blocking checks when retrieving a directly linked post. Show a recoverable unavailable-post state when content has been deleted or access has changed.
