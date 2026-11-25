# PWA update and startup recovery

## Release

These changes belong to the web/PWA frontend and its service workers. Sync the
source to GitHub and let Amplify finish its build. A backend-only Replit publish
does not deliver this fix to an app installed from the main website.

The Vite build emits a shared release identity into the HTML and
`assets/app-release.json`. Deploy the entire build together, including
`customHttp.yml`, the workers, and the release metadata. No database migration,
notification permission reset, worker unregistration, or site-data clearing is
part of this change.

Already-open older releases cannot retroactively use recovery code they have not
downloaded. An installation still running that older code may need a final normal
reopen while receiving this rollout; subsequent releases use the new lifecycle.

## Behavior

- Page requests prefer the network, with a six-second fallback to the cached
  shell when offline or temporarily unable to load the online page.
- Hashed app assets and media remain cache-first. Unversioned scripts and
  release metadata do not keep an old release authoritative.
- A notification-worker activation alone does not mean the app must reload.
  The app checks actual release metadata, with a six-second update-check limit.
- Before the app becomes usable, recovery may refresh once per affected release
  when persistent loop protection is available. Missing bootstrap files also
  have a guarded recovery path in the HTML, before React exists.
- Once the app opens, updates offer an Update action rather than interrupting
  navigation, idle time, or returning from the background. Edited form state
  triggers a discard/interruption warning before an explicit update.
- Mandatory privacy-cache cleanup has an eight-second wait limit. Failure
  exposes recovery; the app does not read stale private caches to bypass it.
- The session check has a twelve-second deadline and aborts the underlying
  request. Only a confirmed unauthorized response counts as signed out.
- App-module loading has a thirty-second deadline. Retry remains available
  inside the original startup splash; mobile startup does not mount the separate
  white navigation loader.
- Retry before React mounts reattempts bootstrap. Retry after mounting retries
  the session check. A watchdog restores recovery controls for paused attempts.

## Owner acceptance checklist

No automated, browser, build, or typecheck tests were run for this change, at the
owner's request. Development workflow startup is not functional verification.

1. Open the installed iPhone app after an Amplify deployment and confirm the
   original splash leads to the intended screen without a force-close.
2. Keep an older release open across another deployment: navigation should
   continue, with an update action rather than an automatic page refresh.
3. Start editing a post/profile or selecting an upload, then choose Update:
   cancelling the warning must leave the current work alone.
4. Check an offline launch after a successful online visit, then reconnect.
5. Check a slow/failed session lookup: recovery should appear in the same splash,
   Retry should retry, and a network failure must not be treated as logout.
6. Confirm normal login/logout still avoid the splash, later navigation retains
   its own recovery screen, and notification subscriptions/badges remain intact.
7. Include Android and desktop opening/navigation in acceptance. They share the
   bounded startup and guarded update code, without receiving the normal mobile
   startup presentation.
