---
name: Popup visibility
description: User expectation for popup visibility over mobile and desktop navigation.
---

Popups must appear fully in front of the navigation bar, without hiding text or controls. This explicitly includes the welcome message after signup and photo/video posting dialogs.

**Why:** The user reported the left navigation obscuring these popups and asked for them to be dominant so the experience is not impaired.

**How to apply:** Keep popup placement independent of page/sidebar offsets. When adding custom overlays or changing navigation, check popup layering as well as small-screen width and scrolling; do not fix just one individual message.
