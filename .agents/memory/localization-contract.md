---
name: Localization content boundaries
description: Preserve language scope, private content and form state when extending PWA translations.
---

Keep the existing ten-language list. Interface localization must not become
automatic rewriting of members' posts, messages, names, codes or saved values,
and must not send private content to an external translation service.

**Why:** The user said the existing languages are perfect and approved completing
the interface while retaining app behavior and private member content.

**How to apply:** Translate presentation labels at render time, with language
subscriptions that do not remount forms. Never translate technical attributes,
routes, IDs or stored enum values even when their English words look readable.
Keep member-content translation a separate, explicitly scoped capability.

Generated translations need placeholder review as well as language review.
Natural singular/dual wording can omit a numeric placeholder, especially in
Arabic, even when a translation request explicitly asks to retain it.

**Why:** Catalog reconciliation caught omitted count variables in otherwise
plausible plural translations. Missing variables can silently change displayed
counts or hide dynamic values.

**How to apply:** Preserve interpolation names and multiplicity in all count
forms; use numeric counts for plural selection. Do not describe generated policy
translations as legally certified or native-speaker reviewed.
