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
