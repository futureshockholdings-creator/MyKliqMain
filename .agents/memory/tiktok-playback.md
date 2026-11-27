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
The owner subsequently confirmed the tap-to-load player “works perfectly as
currently built.”

**How to apply:** Keep playback changes isolated from global PWA layout and the
reverted status-area work. Preserve external-card behavior for unsupported links
and leave production testing to the owner.

Automatic thumbnail/title/creator previews are approved for the posting form and
published posts, while the video player itself remains tap-to-load.

**Why:** After confirming playback worked, the owner requested a recognizable
preview as soon as a TikTok link is typed or pasted and approved the proposed
metadata-fetching enhancement with fallback when thumbnails are unavailable.

**How to apply:** Send only the selected public TikTok URL for metadata, not the
draft or member details. Keep automatic metadata out of private conversations.
Do not make a preview a prerequisite for posting or playback.
