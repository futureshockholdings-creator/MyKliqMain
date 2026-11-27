---
name: TikTok playback boundaries
description: Owner-approved tap-to-load TikTok playback with external fallback, isolated from iPhone layout work.
---

TikTok playback should use the official third-party player only after the viewer
chooses to load it, with a visible disclosure and permanent external link.
Do not download or rehost TikTok video media.

**Why:** The owner approved experimenting with inline playback after being told
that loading it connects the viewer to TikTok, and that some videos remain
unavailable. They want the option to restore the pre-player checkpoint if needed.

**How to apply:** Keep playback changes isolated from global PWA layout and the
reverted status-area work. Preserve external-card behavior for unsupported links
and leave production testing to the owner.
