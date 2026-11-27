---
name: Mobile PWA experience
description: Product scope for a mobile-specific startup experience without changing desktop behavior.
---

The user wants both installed mobile PWAs and mobile-browser visits to show a branded splash during startup, while desktop continues to work as it does today.

The user confirmed the mobile splash worked well, but explicitly excludes logout and successful login transitions: logout must go directly to the landing page, and successful login must not flash the splash before the account appears.

The user wants all normal splash wording removed except **Your Private Social Circle** beneath the icon.

**Why:** The user wants the mobile experience to feel like a mobile application and be distinct from the desktop web app, with a future Apple App Store release in mind. This does not establish App Store approval or authorize a native-app migration.

**How to apply:** Scope startup presentation to mobile devices, including mobile browser access. Distinguish fresh launches from authentication redirects even when those redirects reload the document. Preserve desktop startup and existing authentication, notifications, and app functionality. Do not expand this request into a redesign of the entire mobile interface.

Cold mobile startup must show only the original splash, not the separate white
navigation-loading screen in sequence. Keep startup recovery within the original
splash; reserve the navigation-loading presentation for after startup.

**Why:** The user observed the original splash followed by the white loading
screen and explicitly requested a single original-splash launch experience.

**How to apply:** Coordinate the handoff with the initial member-session check,
while letting public pages open without waiting on that check. Preserve existing
login/logout suppression and desktop behavior.
