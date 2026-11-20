# Credential privacy and password-storage review

## Scope and status

This is a source-level remediation of credential storage and HTTP response
exposure. It is not a comprehensive penetration test, an investigation of
historical access, or a claim that production has already been updated.
No automated, browser, login, or live API tests were run, at the user's request.
No production records were queried or bulk-migrated during this work.

## Password handling

- Signup, first-time setup, password changes, and password resets use a shared
  one-way password policy with bcrypt cost 12.
- A versioned SHA-256 pre-hash supplies bcrypt with fixed-length input. This
  preserves the full UTF-8 value of older passwords rather than silently
  truncating them at bcrypt's 72-byte input boundary.
- Web and mobile password login accept existing bcrypt and encrypted records
  only for compatibility. Successful logins upgrade older formats before
  issuing a session or token. Failed login attempts do not trigger migration.
- Compare-and-swap prevents a login-time upgrade from overwriting a concurrent
  password change. Concurrent successful upgrades can be recognized safely.
- No bulk credential conversion or forced password change was introduced.
  Dormant accounts remain in their previous format until successful password
  authentication or a password reset. OAuth-only authentication does not
  provide a plaintext password for rehashing.
- Encryption remains necessary for server-held third-party OAuth credentials;
  it is no longer used for newly written account passwords.

## Response review

| Area | Protection |
| --- | --- |
| Profile picture and background updates | Return only the account ID, saved image field, and update time. Existing client cache merging is retained. |
| General profile and music updates | Raw user records are filtered at response serialization; profile updates do not disclose contact details or stored credentials. |
| Authenticated account views | Allow account-owner contact/profile fields and safe security-presence flags, never credentials or recovery hashes. |
| Friends, followers, feeds, posts, and message participants | Nested user records use a public field allowlist; credential fields and private contact fields are excluded. |
| Mobile routes | Covered by the same response middleware. Password-login upgrades use the same policy as web login. |
| Social connection responses | Stored access/refresh tokens, encrypted credentials, private keys, and app-password fields are removed recursively. |
| Administrative user lists/details | Use safe presence flags instead of password, PIN, or recovery-answer values. Contact fields remain available only with the existing administrator credential. |
| Administrative password retrieval | Retired with HTTP 410. The retrieval/copy UI and server decryption path were removed. |
| Administrative CSV export | Reviewed its explicit columns: account/contact information and credential-presence booleans, not password or recovery values. Existing administrator authorization remains required. |
| Server errors | Generic HTTP 5xx messages prevent database diagnostics from reaching clients. |

The response guard is installed before route registration. It also protects
responses sourced from older server-side caches. It recursively excludes stored
credential fields and encrypted payload components. Raw database user records
and user/contact DTOs have explicit allowed fields.
The authenticated profile cache now stores only safe account fields and
presence flags; older entries are scrubbed when read.

Short-lived protocol handoffs are intentional exceptions, not stored-credential
disclosures: the appropriate login/OAuth callback may return the newly issued
JWT, and recovery verification may return the next stage's reset token. These
exceptions apply only to top-level fields on explicitly named endpoints.

## Additional critical finding: password-reset step bypass

The final reset endpoint previously checked token existence and expiry without
requiring server-side proof of completed recovery questions and PIN verification.

The flow now uses cryptographically random, stage-specific tokens:

1. Forgot password issues a security-question challenge.
2. Successful question verification atomically rotates it to a PIN challenge.
3. Successful PIN verification rotates it to a password-reset authorization.
4. The final transaction consumes the verified token, saves the password hash,
   and invalidates the account's other reset tokens.

Changing a password, PIN, or recovery answers also invalidates outstanding reset
requests. Password setup cannot overwrite a password created concurrently.
Existing auth rate limiting now covers login, signup, and reset steps.

**Recovery flows already in progress must be restarted after deployment.**
The updated frontend carries each rotated token to the next step; deploy it
together with the backend.

## Logging, caches, and release

- Removed bearer-token-prefix logging.
- Added recursive diagnostic redaction and suppression of sensitive credential
  diagnostics, including embedded JSON credential fields.
- Changed frontend persisted-cache and service-worker cache versions. Existing
  PWA caches are retired when the new frontend/worker loads.
- Deploy the backend security protections promptly, then deploy the updated
  frontend through GitHub/Amplify. Both are required for the updated recovery UI.
- These changes cannot erase historical responses, downloaded exports, logs,
  screenshots, or copies retained elsewhere. Existing client credentials already
  disclosed in the past cannot be made unknown by changing server storage.
- Historical access review and any required password/PIN rotation or incident
  notification require a separate determination; exploitation was not assessed.
