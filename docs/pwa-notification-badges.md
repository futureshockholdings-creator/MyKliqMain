# PWA home-screen notification badges

## Behavior

- The bell and app-icon badge count visible, unread in-app notifications. Loading,
  offline authentication failures, backgrounding, and component cleanup are not
  read actions and must not clear an existing badge.
- Newly created, eligible notifications (including post likes) send a PWA push
  with an absolute unread count and a server timestamp. Repeated delivery does
  not increment the count; older push counts do not replace newer push counts.
- PWA pushes use only the recipient's active web subscriptions. Native Expo/FCM
  mobile delivery is not changed. Push preferences, snooze, and digest selection
  are respected. Incognito-message alerts remain in-app only.
- Reading all notifications clears the badge and dismisses managed system
  notifications on that device. Logout additionally persists a signed-out state
  in the worker and blocks late personalized pushes until the next authenticated
  notification sync. Workers store badge metadata only, never authentication
  tokens or cached API responses.
- Reading on a different device is reconciled on the next foreground refresh or
  eligible push. This change does not introduce silent cross-device pushes:
  Web Push normally requires a visible notification.
- Notification option `badge` is an image, not an unread count. Keep it separate
  from the `unreadCount` push-data field.
- In workers, numeric badges use **WorkerNavigator** (`self.navigator.setAppBadge`
  and `clearAppBadge`). **ServiceWorkerRegistration** owns notification display,
  not the numeric Badging API. WebKit's push example explicitly uses
  `self.navigator.setAppBadge`; the simulations expose the API only there.

## Platform boundaries

- **iPhone/iPad:** numeric icon badges require an installed Home Screen PWA,
  iOS/iPadOS 16.4+, notification permission, and Badges enabled in OS notification
  settings. Calling the API cannot override an OS opt-out.
- **Android PWA:** Chromium does not expose the numeric Badging API. Android
  derives a notification dot/badge from active system notifications, subject to
  notification permission and launcher/OS settings. Exact counts, color, and
  appearance are not controlled by this app.
- **Desktop:** installed Chrome/Edge PWAs on supported Windows/macOS versions can
  display badges. Other browsers and OS combinations vary; a successful API call
  does not guarantee that the OS displays a badge.

Sources:
- https://webkit.org/blog/14112/badging-for-home-screen-web-apps/
- https://developer.mozilla.org/en-US/docs/Web/API/WorkerNavigator/setAppBadge
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Display_badge_on_app_icon

## Verification and rollout

### Main website release path

The owner updates **mykliq.app** by syncing this project to GitHub, after which
AWS Amplify builds the frontend. Replit Publish separately updates the backend
at **api.mykliq.app**; a successful backend publish does not release the main
website's frontend or its installed PWA workers.

The Git remote is `futureshockholdings-creator/MyKliqMain`, and this workspace is
on `main`. Sync the reviewed changes through the existing GitHub-to-Amplify
pipeline. Confirm Amplify builds the updated commit on its configured production
branch; do not change that branch or trigger a production deployment without
the owner's approval.

Amplify's checked-in build configuration runs `npm run build` and publishes
`dist`. Vite copies `client/public` into that directory. The release must contain
`assets/app-badge.js`, `sw-ios.js`, `firebase-messaging-sw.js`, and `sw.js`
alongside the current frontend bundle. A Vite plugin emits the helper from the
single `client/public/app-badge.js` source to `/assets/` for both development and
production. The root helper remains as a compatibility entry point, but current
workers do not depend on it. No changes to badge APIs, subscriptions, or
installation are needed just to deliver those existing files.

After Amplify reports a successful release, check **mykliq.app**, not only the
API origin:

- `/assets/app-badge.js` must return the badge helper JavaScript, including
  `APP_BADGE_SYNC`, not the SPA's HTML fallback. HTTP 200 or a JavaScript content
  type alone does not establish that the file exists.
- `/sw-ios.js` must import `/assets/app-badge.js`.
- The entry bundle referenced by `/` must be from the updated frontend build.

If those files remain old, investigate the Amplify source commit, production
branch, and release status before changing badge logic or asking users to
reinstall. Existing installations can check for the new worker during an online
launch; allow the update to activate and reopen if needed.

### Local and device checks

External builders must not receive lockfile download URLs pointing to
`package-firewall.replit.local`: that hostname is only reachable inside Replit.
Keep those URLs portable while preserving package versions and integrity hashes.
An externally failed build must be diagnosed from its logs rather than inferred
solely from the website continuing to serve the previous successful release.

Run `npm run validate:pwa-badges` for simulated worker, lifecycle, payload,
permission-denial, registration, and recipient-routing checks. These checks do
not send pushes or modify any database. They do not emulate a physical home
screen, Apple's delivery service, Android launchers, or real notification
permissions.

After publishing the backend and web assets to their respective hosts, existing
installed PWAs need an online launch to receive the updated app and worker. No
reinstall or subscription deletion is required. Worker registration retains the
same scope, bypasses the HTTP cache for imported worker scripts, and preserves
existing Firebase registrations rather than switching their script on startup.
API routes remain excluded from worker caches.

Physical-device acceptance remains necessary: with notifications and icon
badges enabled, receive a like while closed, reopen and read it, close again,
and verify the platform's badge/dot clears. Repeat for logout and for a new push
after an ordinary worker update. Device-only behavior cannot be certified by
the automated simulated checks.
