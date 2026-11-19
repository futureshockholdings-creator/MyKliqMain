---
name: Navigation recovery
description: Required escape route from unknown pages and password recovery.
---

All app 404 pages must provide a clickable **Home** button that takes users to the login page at minimum. Password recovery’s **Back to Log In** must return to the login page.

Signup steps 2 and 3 must go back to the previous step without losing any entered information. This includes browser/PWA Back, not just the form's own buttons.

**Why:** The user explicitly requested these recovery paths after production navigation caused dead ends and signup data loss.

**How to apply:** Keep recovery navigation within the frontend router. The main website and API are hosted separately; a relative API URL is not a substitute for the login page. Keep signup mounted during step navigation; only step metadata belongs in browser history. Retain security inputs in memory rather than introducing persistent storage of passwords, PINs or security answers. Do not change password-reset verification or authentication merely to provide navigation.
