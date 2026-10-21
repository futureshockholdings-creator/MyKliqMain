---
name: Verify the installed PWA origin
description: Backend publishing success does not establish that the separately hosted main-site PWA received its frontend and worker update.
---

Diagnose PWA releases at the origin from which the user installed the app, not just the published API origin. The main website and API origin can serve different frontend releases.

The owner confirmed the main website's release flow: sync to GitHub, then Amplify builds it. Replit Publish is not that frontend release step.

**Why:** A successful Replit republish exposed the updated badge worker and helper at the API origin while the main website still served an older worker. The helper URL on the main website returned SPA HTML despite an HTTP 200 response and JavaScript content type.

**How to apply:** Compare actual bundle references, worker contents, and imported-helper bodies on the installation origin before changing badge logic or recommending a reinstall. Check response bodies, not just status codes or content types. Permissions and push subscriptions also belong to that installation origin.

New root script routes can fail independently of the rest of a release.

**Why:** The main site's frontend bundle and existing worker URLs eventually updated, but the newly introduced root helper URL still returned SPA HTML. A successful frontend release therefore did not establish that every worker dependency could load.

**How to apply:** Use the existing static-asset route for worker dependencies, preserve a single source for development and production, and verify the actual imported URL after deployment. Do not infer that a permission or Badging API change is needed from this hosting failure.
