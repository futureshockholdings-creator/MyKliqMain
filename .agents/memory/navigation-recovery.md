---
name: Navigation recovery
description: Required escape route from unknown pages and password recovery.
---

All app 404 pages must provide a clickable **Home** button that takes users to the login page at minimum. Password recovery’s **Back to Log In** must return to the login page.

**Why:** The user explicitly requested these recovery paths after encountering a dead end in the production PWA.

**How to apply:** Keep recovery navigation within the frontend router. The main website and API are hosted separately; a relative API URL is not a substitute for the login page. Do not change password-reset verification or authentication merely to provide navigation.
