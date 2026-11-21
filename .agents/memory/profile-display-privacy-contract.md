---
name: Profile display and privacy contract
description: Preserve safe joined display records when filtering user data, and repair caches that lost those records.
---

Privacy allowlists must preserve approved public presentation relationships as well as ordinary profile columns. Keep joined avatar decoration available in both account-owner and public-member responses, while allowing only its public display data.

**Why:** The credential-protection change retained the equipped border ID but omitted its joined graphic record. Equipment still appeared selected in the border inventory, while Headlines could no longer render it on the owner's posts and comments.

**How to apply:** Review the display data consumed by existing screens before tightening response allowlists; do not restore raw user records or credentials to fix a missing decoration.

Changing the response filter alone cannot restore information already removed from persisted profile caches.

**Why:** Profile cache entries are refreshed on reads, so an incomplete cached profile can remain incomplete indefinitely for an active member instead of naturally expiring.

**How to apply:** Rehydrate or version affected cache entries when a response contract regains required data. Distinguish an absent field from an explicit empty value so genuinely unequipped profiles do not require repeated database lookups.
