# TikTok inline player

This is isolated from the reverted iPhone display work. It changes no global
layout, viewport settings, service workers, database schema, or OAuth connection.

## How it works

- Published post cards automatically load TikTok's own player when within
  300px of the visible area. They no longer request separate oEmbed thumbnails.
- The Headlines composer waits 650ms after typing/pasting before showing up to
  three draft player cards. Nearby cards load the player automatically;
  additional links still publish normally.
- Far-away automatic players are unmounted to stop playback and release
  resources. Returning to them reloads the player without autoplay.
- Close is respected: a manually closed player stays closed for that mounted
  card until the viewer chooses Load video. Failed loads offer Try again.
- Browsers without IntersectionObserver keep manual loading instead of loading
  all frames at once. A portrait placeholder limits scroll-position jumps.
- TikTok's official `https://www.tiktok.com/player/v1/{videoId}` iframe
  supplies the player; MyKliq does not download or proxy video media.
- Autoplay is disabled. Automatically loaded players initially mute sound and
  explicitly deny autoplay permission. Viewers press Play and unmute in TikTok.
- **View on TikTok** is always available, including when third-party content
  is blocked. A slow-load notice does not falsely report successful playback.
- Retry and Close allow retrying errors and stopping/removing the player.
- Profile and photo links retain the existing external-link card.
- The shared social-card component also supplies these cards in conversations
  and group chats. No message body is sent to TikTok; the selected TikTok link
  is used only when its viewer elects to load the player.

## Short share links

The authenticated POST `/api/tiktok/resolve` accepts only HTTPS TikTok video or
short-share URLs on an exact host allowlist. Redirects are followed manually
and each hop is validated. The request has a seven-second total deadline and
a five-hop limit. It returns only a video ID, not remote HTML.

Resolution is rate-limited. Identical pending requests are combined and results
are held in a bounded in-memory cache (24 hours for IDs, one minute for failures).
The existing resolver is also used automatically for nearby short-link cards.

## Previous thumbnail approach and privacy

The authenticated POST `/api/tiktok/preview` sends only a validated, canonical
public TikTok video URL to TikTok's fixed oEmbed endpoint. Responses are bounded
to 128 KiB and six seconds after URL resolution. Embed HTML is never returned
or executed; only video ID, plain title/creator and an HTTPS TikTok-CDN thumbnail
are accepted.

Metadata is cached for one hour (unavailable results for two minutes), with
1,000-entry and 20-in-flight limits plus a separate per-member rate limit.
Identical pending lookups are combined. This endpoint is retained for compatibility
with older frontend versions, but the current frontend no longer calls it.

The owner's supplied public video returned valid embed markup but no thumbnail,
title or creator. The owner therefore approved replacing the unreliable separate
image lookup with automatic loading of the official player.

Automatic post/composer players contact TikTok before pressing Play. TikTok
receives normal third-party iframe traffic; no full draft or MyKliq credentials
are passed to the player. Incognito messages, group chats and comment cards retain
their previous tap-to-load behavior.

## Release

For the automatic-player change, sync GitHub so Amplify deploys the frontend.
There are no new backend changes; the existing resolver must already be published.
No database migration or TikTok OAuth credentials needed.
Full video links with an ID do not need the resolver.

TikTok may refuse private, removed, age/region-restricted or other unavailable
posts. iOS privacy/content blockers and TikTok's own behavior can also affect
playback. The permanent external link remains the fallback.

Source: https://developers.tiktok.com/docs/en/embed-player
Metadata: https://developers.tiktok.com/docs/en/embed-videos

## Verification ownership

No automated/browser tests, typecheck, build or production requests were run,
at the owner's request. Source was reviewed and the development server restarted.
Actual playback, fullscreen and fallback behavior on installed iPhone/Android
PWAs and desktop remain for owner testing after deployment.
