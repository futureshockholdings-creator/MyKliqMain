---
name: Password security and settings
description: Credential response privacy, login-time hash migration, verified recovery, and change-password expectations.
---

Profile Settings → Security is a change-password form, not a password setup or saved-password viewer. Its current, new, and confirmation fields start empty and use native password masking rather than strings of X characters.

**Why:** The user stated that passwords were already created during signup and found the prefilled Password Setup form misleading.

**How to apply:** Never populate these fields from a user profile. Require the current password on the server before changing an existing credential; keep first-time setup from bypassing this requirement. Keep tabs separated and usable on narrow mobile screens.

Existing accounts can have legacy encrypted passwords or bcrypt passwords. Password presence is independent of whether a stored value is decryptable or included in an API response.

**Why:** Treating an unreadable bcrypt value as an unset password incorrectly signals that setup is needed. Retrieving plaintext credentials is unnecessary for changing a password.

**How to apply:** Use the shared versioned password policy for every verifier and writer, never assume that every stored hash starts with bcrypt's raw prefix. Its bcrypt pre-hash preserves full UTF-8 passwords instead of silently truncating at 72 bytes. Require older formats to upgrade after successful password login before issuing credentials, without overwriting a concurrent password change. Account-profile responses and profile caches should retain password presence, never the credential itself.

Password security must cover signup, every password setter, web and mobile login, resets, and administrative recovery—not only the Security tab.

**Why:** An audit after the change-password improvements found that other password-writing paths still used reversible encryption and profile mutations still returned raw user records. Updating one form did not establish an application-wide storage or disclosure policy.

**How to apply:** Check every credential writer and verifier when changing storage formats. Treat encrypted password values, hashes, PIN hashes, and recovery-answer hashes as server-only data. Profile mutation responses should contain only the fields needed for the update; contact details belong only in authorized account views. Do not equate a safe auth-user response with safe nested member or mutation responses.

Password recovery must prove each completed verification step on the server and authorize only a single final reset.

**Why:** A source review found that the original final reset accepted an existing challenge token without proof that the questions and PIN had been verified. Frontend steps were not a security boundary.

**How to apply:** Keep recovery stages server-enforced, rotate the token after each verified step, consume final authorization atomically with the password update, and invalidate outstanding recovery requests when the password or recovery factors change. Do not remove these checks to accommodate an older frontend; that frontend must be updated.
