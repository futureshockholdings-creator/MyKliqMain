---
name: Service Worker API Cache Bug
description: sw.js was caching /api/ GET responses with Cache-First strategy, silently serving stale data with no server contact — root cause of the persistent nearby-activities empty results bug.
---

# Service Worker Must Never Cache API Routes

## The Rule
`client/public/sw.js` must always have an early-return for `/api/` paths in the fetch handler so the service worker never intercepts or caches API calls.

## Why
The original sw.js used Cache-First with no API exclusion. It cached a `200 []` response from `/api/nearby-activities?postal=60601` (returned by old broken geocoding code). Every subsequent search for 60601 was served from the SW cache — no request ever reached the server. Logs showed zero `/api/nearby-activities` entries because the fetch never left the device.

This pattern affects ANY GET API endpoint — one bad cached response can silently lock users into seeing wrong/empty data forever (or until they clear site data manually).

## How to Apply
- The current fix is in `client/public/sw.js` (mykliq-v18): fetch handler returns early if `url.pathname.startsWith('/api/')`.
- `client/public/sw-ios.js` already has this exclusion (line 66) but also has a dynamic cache — audit it when changing sw-ios.js.
- Whenever adding a new SW feature or bumping the cache name, verify the `/api/` exclusion is still in place.
- As defence-in-depth, consider adding `Cache-Control: no-store` on all Express `/api` responses (Task #51 covers this).

## Diagnosis Pattern
If an API endpoint consistently returns stale/empty data and shows **zero log entries on the server** when tested in production, the service worker is the first thing to check — not the server code.
