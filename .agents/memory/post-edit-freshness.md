---
name: Post edit freshness
description: Why a fast saved edit can remain visually stale behind a second client cache.
---

A confirmed post edit must be reflected directly in the displayed query data. Avoid returning a privately cached stale feed to React Query and revalidating only that private cache.

**Why:** A production investigation found a fast successful edit request followed by a feed refresh, but the frontend could continue showing the old text until its next polling interval. The private stale-while-revalidate cache did not notify React Query when its background refresh completed.

**How to apply:** Treat save latency and visible-update latency separately. Patch only server-confirmed edited fields, preserve media and concurrent social interactions, and prevent a pre-save feed response from overwriting the saved text. Keep a single freshness owner for post data rather than layering independent SWR caches.

Close the post editor automatically after a confirmed successful update, before showing the success toast. A failed save must keep the dialog and draft intact.

**Why:** The user reported that the success toast covered the text box while the editor stayed open, making a successful save look unfinished.

**How to apply:** Control the dialog's open state and close only the editor for the saved post; a late response must not dismiss a different post opened afterward.
