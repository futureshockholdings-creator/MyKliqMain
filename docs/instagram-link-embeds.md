# Instagram pasted-link embeds

The owner approved extending the working Facebook/TikTok approach to Instagram.
This is not a connected-account integration.

## Scope

- Public post, carousel, Reel and legacy TV URLs use Instagram's own `/embed/`
  frame in published posts and debounced Headlines draft previews.
- The gradient header displays the Instagram icon/name and a permanent external
  link. The three-preview composer limit is shared across platforms.
- Frames first load within 300px of the viewport and stay mounted for the page
  visit, avoiding deliberate reloads when scrolling back. Close/page unmount
  still release them.
- There is no supported offscreen-pause interface for this Instagram frame.
  Autoplay stays denied, but manually started playback may continue offscreen
  until the viewer pauses or closes it.
- Autoplay permission is explicitly denied. Close prevents automatic reopening
  for that mounted card; manual load/retry remains available.
- No IntersectionObserver means manual loading, not an inaccessible player.
- HTTPS hosts are allowlisted; only media paths/shortcodes form frame URLs.
  Tracking parameters are removed. No arbitrary HTML, SDK, media copying,
  account credentials, database changes or new backend API is involved.
- Stories, profiles, redirect-only `/share/` links and unsupported paths retain
  external-link cards. Private/deleted/restricted posts or accounts with Embeds
  disabled may display Instagram's own unavailable/login screen.
- An iframe load event confirms only document loading, not content availability.
  A permanent external fallback remains outside the provider's frame.
- Frame heights are fixed (700px posts, 780px Reels), with provider-controlled
  internal layout/scrolling; content cannot be measured cross-origin.
- Facebook/TikTok playback, private messages, comments, group chats, global
  layout and splash behavior are unchanged.

## Release

Sync GitHub for Amplify to release this frontend change. No new backend endpoint,
credentials or migration is required.

No tests, builds, typechecks, browser runs, screenshots or production probes were
run, per the owner's instruction. Source review and development restart only.
The owner will verify actual provider rendering in production.

Reference: https://developers.facebook.com/documentation/instagram-platform/oembed
