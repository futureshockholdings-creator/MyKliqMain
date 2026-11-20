---
name: Image upload reliability
description: Recovery requirements and single-PUT storage completion versus multipart ETags.
---

Profile and background photo failures should offer Try again while retaining the selection. A failed profile save after a completed transfer should reuse that uploaded object, not upload the bytes again.

**Why:** The user reported frequent failures for compliant images and explicitly asked for a retry button instead of a generic error. Discarding the file before final persistence succeeds prevents meaningful recovery.

**How to apply:** Treat transfer and profile persistence as separate completion stages. Clear the selection only after both succeed. Keep genuine size/type validation understandable and preserve the existing image when saving fails.

A successful single storage PUT must not remain pending solely because an ETag is unavailable to the browser.

**Why:** The installed upload library's default transport returns from its load handler without resolving or rejecting when it cannot read an ETag. This is a dependency behavior, not evidence that every production failure had that cause.

**How to apply:** Accept successful HTTP completion for non-multipart uploads and retain readable metadata when provided. Do not reuse the empty-ETag behavior for multipart uploads, whose completion genuinely requires part ETags. Do not claim that valid files can never fail during network/service outages.

The vendor React DashboardModal mounts inside its own React container by default; its name does not imply a body portal.

**Why:** A browser check found its controls still clipped behind the app sidebar even after raising its own z-index, because an ancestor stacking context remained lower. The upload chooser now uses the inline dashboard inside the shared modal system.

**How to apply:** Check ancestor stacking and focus traps, not only the vendor surface's z-index. Keep file choosers in the same accessible modal system as other dialogs. Also do not rely on the installed SDK's retryDelays option for automatic single-part retries; the browser check observed a manual retry was required.
