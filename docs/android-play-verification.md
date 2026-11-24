# Google Play website verification

## Identity

The owner supplied the Play listing https://play.google.com/store/apps/details?id=com.mykliq
and the public SHA-256 certificate fingerprint in
`client/public/.well-known/assetlinks.json`.
This associates the website with the Play-distributed `com.mykliq` app, not the
separate Expo project's package.

The fingerprint must be from **App signing key certificate**, not **Upload key
certificate**. If Play signing keys are upgraded, include all applicable
app-signing SHA-256 fingerprints in the array.

## What the source change supplies

- The standard Digital Asset Links JSON at
  `client/public/.well-known/assetlinks.json`, copied into `dist` by Vite.
- An explicit Amplify artifact inclusion for that file.
- A build-time copy at `dist/assets/assetlinks.json` for hosting configurations
  that otherwise treat the hidden path as a client-side route.
- JSON response headers in the existing Amplify `customHttp.yml`.

Both deployed copies originate from the same JSON source.
No iOS install prompts, Android install prompts, desktop layouts, or application
data are changed.

## Required Amplify hosting rule

Sync to GitHub so Amplify builds the frontend. Republishing the Replit backend
does not update `mykliq.app`.

In AWS Amplify, open the hosting app serving **mykliq.app**, then
**Hosting → Rewrites and redirects → Manage redirects** (the wording can vary).

Add this exact rule **before** any catch-all or SPA fallback rule, preserving all
other existing rules:

| Source | Target | Type |
| --- | --- | --- |
| `/.well-known/assetlinks.json` | `/assets/assetlinks.json` | `200 (Rewrite)` |

For the JSON rule editor, insert this object first in the existing array. Do not
replace the whole array or discard other rules:

```json
{
  "source": "/.well-known/assetlinks.json",
  "target": "/assets/assetlinks.json",
  "status": "200",
  "condition": null
}
```

This is an internal rewrite, **not a 301/302 redirect**. The public address must
remain `https://mykliq.app/.well-known/assetlinks.json`. The leading dot matters.
Do not use a same-source/same-target rule.

The repository buildspec's existing `redirects` block is not a substitute for
the hosting app's actual rewrite configuration. That console setting is not
changed by this source edit.

## Owner's manual review after deployment

No automated tests or device tests were run, at the owner's request.

1. Open `https://mykliq.app/.well-known/assetlinks.json` after the Amplify
   deployment finishes. It must show the JSON array, not the MyKliq landing page.
   The response must be HTTPS, HTTP 200, `application/json`, without a redirect
   or sign-in requirement.
2. Confirm the JSON names `com.mykliq` and the Play **app-signing** certificate.
3. Allow Chrome/Android to refresh its cached association, then reopen the
   Play-installed app. A website update does not force immediate re-verification
   on every device. Avoid clearing app data as a first step.
4. If the toolbar remains after successful association refresh, inspect the
   Play wrapper's actual build configuration. It must launch a **Trusted Web
   Activity**, not an ordinary Custom Tab, and its launch origin must be the
   verified `https://mykliq.app` origin. A different origin, including `www`,
   requires its own association and wrapper trust configuration.

An existing correctly configured TWA may only need the website fix. A wrapper
that launches an ordinary Custom Tab or trusts a different origin needs a new
Android build and Play release. The workspace does not establish the configuration
of the currently published wrapper.

Browser controls may still appear when navigating to an external or unverified
origin. Website JavaScript cannot hide Chrome-owned toolbar/menu controls.

References:
- https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- https://docs.aws.amazon.com/amplify/latest/userguide/creating-editing-redirects.html
