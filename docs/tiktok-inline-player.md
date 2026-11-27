# TikTok inline player

This is isolated from the reverted iPhone display work. It changes no global
layout, viewport settings, service workers, database schema, or OAuth connection.

## How it works

- Existing supported public TikTok video links offer **Load video**.
- The Headlines composer debounces typed/pasted links before requesting a
  thumbnail, title and creator from the backend. Up to three draft previews
  are shown; additional links still publish normally.
- Published post cards request previews only when near the visible scroll area.
- Thumbnail previews are best effort: failed metadata or image loading leaves
  the working Load video / View on TikTok interface available.
- No TikTok frame or external player script is loaded before that action.
- The disclosure explains that loading the player connects to TikTok.
- TikTok's official `https://www.tiktok.com/player/v1/{videoId}` iframe
  supplies the player; MyKliq does not download or proxy video media.
- Autoplay is disabled. A viewer may need a second tap on TikTok's play control.
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
The same resolver now supplies canonical links for automatic thumbnail metadata.

## Thumbnail metadata and privacy

The authenticated POST `/api/tiktok/preview` sends only a validated, canonical
public TikTok video URL to TikTok's fixed oEmbed endpoint. Responses are bounded
to 128 KiB and six seconds after URL resolution. Embed HTML is never returned
or executed; only video ID, plain title/creator and an HTTPS TikTok-CDN thumbnail
are accepted.

Metadata is cached for one hour (unavailable results for two minutes), with
1,000-entry and 20-in-flight limits plus a separate per-member rate limit.
Identical pending lookups are combined. The client also shares query results,
with no automatic retry, focus refresh or persistent preview storage.

Unlike the player itself, automatic previews do contact TikTok before playback:
the backend requests public metadata and the viewer loads the thumbnail from
TikTok's CDN without a referrer. No full draft, member details or credentials
are sent to TikTok. Incognito messages, group chats and comment cards retain
their previous tap-to-load behavior without automatic metadata requests.

## Release

Publish the Replit backend for short-link resolution and metadata, and sync GitHub so Amplify
deploys the frontend. No database migration or TikTok OAuth credentials needed.
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
