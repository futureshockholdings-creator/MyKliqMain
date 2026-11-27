---
name: TikTok playback boundaries
description: Owner-approved automatic nearby TikTok players for posts/composer, manual private-message loading, external fallback.
---

TikTok playback uses the official third-party player, with a permanent external
link. Posts and the posting form may load nearby players automatically, with
autoplay off. Private conversations retain manual loading.
Do not download or rehost TikTok video media.

**Why:** The owner approved experimenting with inline playback after being told
that loading it connects the viewer to TikTok, and that some videos remain
unavailable. They want the option to restore the pre-player checkpoint if needed.
The owner subsequently confirmed the tap-to-load player “works perfectly as
currently built.”

**How to apply:** Keep playback changes isolated from global PWA layout and the
reverted status-area work. Preserve external-card behavior for unsupported links
and leave production testing to the owner.

The owner initially approved automatic thumbnail/title/creator previews for the
posting form and published posts, keeping the player itself tap-to-load.

**Why:** After confirming playback worked, the owner requested a recognizable
preview as soon as a TikTok link is typed or pasted and approved the proposed
metadata-fetching enhancement with fallback when thumbnails are unavailable.

**How to apply:** Send only the selected public TikTok URL for metadata, not the
draft or member details. Keep automatic metadata out of private conversations.
Do not make a preview a prerequisite for posting or playback.

TikTok oEmbed can return HTTP 200 and valid embed markup while omitting the
thumbnail, title and creator fields entirely.

**Why:** Direct inspection of the owner's failing public short link confirmed
that redirects resolved correctly but TikTok returned embed-only metadata.
Production logs independently showed successful requests to the preview route.

**How to apply:** Do not equate HTTP 200 with thumbnail availability or assume
every playable video has separate image metadata.

The owner subsequently approved automatically loading the actual player near
the viewport, with autoplay off, after the third-party contact and data/performance
tradeoffs were explained. They will test and may request restoration if disliked.

**Why:** The separate metadata endpoint did not provide an image for their link;
the official player is the preferred way to show TikTok's initial presentation.

**How to apply:** Restrict automatic players to posts and the composer, release
distant frames, respect Close, retain external fallback, and keep private
messages and the restored global layout unchanged. TikTok controls the initial
poster or unavailable screen; do not guarantee a thumbnail.
