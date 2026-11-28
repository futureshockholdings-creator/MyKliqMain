# Facebook link embeds

This feature displays pasted links, not connected-account imports. It requires
no Facebook OAuth credentials, account connection, database migration or Meta
JavaScript SDK in the main application.

## Presentation and scope

- Published post content and the Headlines composer display supported Facebook
  links using Meta's official `plugins/video.php` or `plugins/post.php` iframe.
- A blue header shows the Facebook icon and name above the embed, with a
  permanent **View on Facebook** link.
- The existing TikTok header now also displays the TikTok icon beside its name;
  TikTok playback behavior is unchanged.
- Instagram cards, comments, private conversations and group chats retain their
  existing behavior. No global layout, splash or service-worker changes.
- Composer previews are debounced by 650ms and limited to three combined
  Facebook/TikTok draft cards. Additional links still publish normally.

## Lifecycle

- Frames load within 300px of the viewport, with autoplay false and autoplay
  permission explicitly denied.
- Frames and pending share resolutions are retained after the first nearby load,
  avoiding frame recreation and repeated resolution when scrolling back.
- Close and page unmount release frames. Facebook's plugin has no supported
  pause interface in this SDK-free implementation; autoplay is still disabled,
  but manually started playback may continue offscreen until paused or closed.
- Close is respected until the user manually loads that mounted card again.
- Missing IntersectionObserver falls back to manual loading.
- Failed share resolution or iframe network errors show Try again; an unresolved
  or restricted post never blocks submitting the user's post.
- A successful iframe load only means its document loaded, not that Meta allowed
  access to its content. Meta may show its own login, privacy, cookie or unavailable
  screen. A permanent external link and explanatory footer remain outside it.

## Supported links

The shared parser validates exact HTTPS Facebook hosts and accepts common
public video, watch, reel, post/permalink and photo URL formats. Mobile Facebook
hosts are normalized to `www.facebook.com`; tracking parameters are dropped while
required video/post identifiers are preserved.

`fb.watch` and `/share/`, `/share/v/`, `/share/r/`, `/share/p/` links use the
authenticated POST `/api/facebook/resolve`. The resolver follows only allowlisted
Facebook redirects, up to five hops and eight seconds total. Public canonical or
Open Graph URLs can be read from at most 128 KiB of HTML. No remote markup is
rendered or returned, and no user cookies or tokens are sent to Facebook.

Resolution is rate-limited, combines identical in-flight requests, and has a
bounded 1,000-entry cache (one hour for resolved links, one minute for failures)
and a 20-in-flight cap.

Profiles and unsupported formats keep the old external-link card. Public
availability is enforced by Meta, not bypassed by link resolution. Friends-only,
private-group, removed and restricted content may not embed.

## Provider-controlled behavior

Meta supplies the inner player/post, branding, captions and controls. Video/Reel
frames use landscape/portrait sizing; ordinary posts use a scrollable-height
frame. Facebook can render differently on mobile or when third-party content is
blocked. MyKliq does not extract or rehost the underlying photos/videos, suppress
Meta attribution, or promise every link will work.

## Release and verification ownership

Publish the Replit backend for share-link resolution, then sync GitHub so Amplify
deploys the frontend. No database migration or new credentials needed.

No tests, browser runs, typechecks, builds or production probes were run, per the
owner's instruction. Source was reviewed and the development server restarted.
Actual public post/video/Reel rendering, share-link fallback and installed-PWA
behavior remain for owner testing.

References:
- https://developers.facebook.com/docs/plugins/embedded-video-player/
- https://developers.facebook.com/docs/plugins/embedded-posts/
