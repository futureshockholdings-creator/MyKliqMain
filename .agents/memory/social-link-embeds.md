---
name: Social link embeds
description: Facebook link playback and platform branding are separate from member social-account integration.
---

The owner wants Facebook pasted links to work like the accepted TikTok approach,
not as a social-account integration. Display an identifiable Facebook icon and
name above its official embedded content. Keep external fallback and provider
branding.

**Why:** The owner explicitly distinguished posted links from connected-account
imports and requested Facebook first. They clarified that “don't want” the TikTok
logo was a typo: they do want the TikTok logo visible near the top too.

**How to apply:** Preserve TikTok's accepted playback behavior while adding its
logo. The owner subsequently approved the same approach for Instagram after
confirming Facebook works perfectly: branded icon/name above official embeds,
nearby loading without autoplay, and an external fallback.
The owner confirmed Instagram also works perfectly and is happy with the current
functionality. Treat this Facebook/TikTok/Instagram presentation as the accepted
baseline rather than changing its behavior without a new request.
Keep automatic embeds scoped to published posts and the composer, leaving
private-message behavior and the restored global layout unchanged.

Retain TikTok, Facebook and Instagram frames after their first nearby load for
the current page visit, including draft previews. Release on Close or page exit,
not on scrolling away. Keep autoplay disabled and pause offscreen only through
supported provider controls; do not promise zero provider background requests.

**Why:** The owner approved page-level retention to reduce repeated loading,
lookup requests and bandwidth after noticing every scroll-back reloaded embeds.
They accepted the higher memory use and browser/provider limitations.

**How to apply:** Preserve lazy first loading, retries, external fallbacks and
stable feed identities. Do not introduce permanent video caches or globally
retained players that outlive the page.
