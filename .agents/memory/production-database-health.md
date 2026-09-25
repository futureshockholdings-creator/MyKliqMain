---
name: Production database health checks
description: Distinguishing the managed Database tool's status from direct connections in a published app.
---

Treat Database-pane Active and a successful production read-only SQL tool query as separate evidence from the published app's own database connection. A deployed application can receive a Neon "endpoint has been disabled" error while those controls look healthy.

**Why:** The managed query path remained usable while the app's direct PostgreSQL session store and other queries failed. The app later resumed without a code or credential change; a successful post-publish login before the outage also ruled out the publish itself as the immediate trigger.

**How to apply:** For similar incidents, use production runtime logs and a harmless deployed-app database-backed request to determine current health. A fake-account login can confirm lookup works, but only a real successful login confirms session saving; never claim full recovery based on a query that bypasses the session store. Avoid swapping database URLs or editing runtime-managed connection variables based solely on the Database pane's status.