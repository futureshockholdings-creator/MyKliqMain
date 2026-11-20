---
name: Invite code compatibility
description: Readable invite-code compatibility and membership confirmation expectations.
---

New displayed invite codes must not use I, L/l, or 1, and invite-code matching must be case-insensitive.

When replacing existing displayed codes, keep the old codes working for the original owners.

**Why:** The user found I, l and 1 difficult to distinguish and explicitly chose “Replace; keep old codes working” to avoid breaking shared invitations.

**How to apply:** Preserve durable owner-linked aliases when codes are replaced. Do not silently invalidate old invitations or treat alias retention as referral usage. Retain Kliq membership, closure, capacity, and approval rules.

For an already signed-in user, successful Join a Kliq confirmation means the user has joined the invite-code owner's kliq, not merely that the code passed validation. It must not imply reciprocal membership in the joining user's own kliq.

**Why:** The user reported a typed invite code being rejected without a server request and explicitly required the joining user to be included in the inviter's kliq after confirmation.

**How to apply:** Confirm success only after the membership request succeeds, refresh the joined-kliqs view rather than only the user's own friends, and distinguish accepted membership from an approval-pending rejoin. Preserve the entered code on failure and prevent repeated taps from sending overlapping joins.
