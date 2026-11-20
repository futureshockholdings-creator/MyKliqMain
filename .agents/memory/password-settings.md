---
name: Password settings
description: Change-password expectations, existing-account verification, and legacy password compatibility.
---

Profile Settings → Security is a change-password form, not a password setup or saved-password viewer. Its current, new, and confirmation fields start empty and use native password masking rather than strings of X characters.

**Why:** The user stated that passwords were already created during signup and found the prefilled Password Setup form misleading.

**How to apply:** Never populate these fields from a user profile. Require the current password on the server before changing an existing credential; keep first-time setup from bypassing this requirement. Keep tabs separated and usable on narrow mobile screens.

Existing accounts can have legacy encrypted passwords or bcrypt passwords. Password presence is independent of whether a stored value is decryptable or included in an API response.

**Why:** Treating an unreadable bcrypt value as an unset password incorrectly signals that setup is needed. Retrieving plaintext credentials is unnecessary for changing a password.

**How to apply:** Verify both existing storage formats without exposing them to the form, then store changed credentials as bcrypt. For new bcrypt passwords, validate the 72-byte limit before hashing to avoid silent truncation; current legacy passwords must still be checked in full. Account-profile responses should convey password presence without returning the credential itself.

Password security must cover signup, every password setter, web and mobile login, resets, and administrative recovery—not only the Security tab.

**Why:** An audit after the change-password improvements found that other password-writing paths still used reversible encryption and profile mutations still returned raw user records. Updating one form did not establish an application-wide storage or disclosure policy.

**How to apply:** Check every credential writer and verifier when changing storage formats. Treat encrypted password values, hashes, PIN hashes, and recovery-answer hashes as server-only data. Profile mutation responses should contain only the fields needed for the update; contact details belong only in authorized account views. Do not equate a safe auth-user response with safe nested member or mutation responses.
