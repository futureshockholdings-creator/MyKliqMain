# Readable, case-insensitive invite codes

New displayed codes use `KQ-XXXX-XXXX`. The alphabet excludes `I`, `L`, and `1`
in every position, including the prefix. Generation uses Node's cryptographic
random-number generator. Codes are trimmed and matched without regard to case.
Legacy `KLIQ-` codes remain valid; the forbidden-character rule is for newly
displayed codes, not a restriction on old invitations.

## Compatibility and ownership

`invite_code_aliases` stores the canonical uppercase old code and its owner.
Replacing a code and retaining its alias happen in one transaction. Replacements
are serialized across backend instances and lock the owner row. A conflicting
owner causes an explicit failure instead of assigning an invitation incorrectly.
Allocation checks primary codes, aliases and historical usage without regard
to case. Alias lookup resolves to the same current owner and existing joining
rules still apply, including Kliq closure, 28-friend capacity, and rejoin approval.

On backend startup, a one-pass data upgrade replaces existing legacy displayed
codes and invalidates their cached user profiles. The authenticated user endpoint
also upgrades a legacy code before returning it, including when it came from an
older profile cache. Generating another code preserves prior displayed codes as
aliases too, as requested. Alias records cascade away if their owner is deleted.

Usage/referral records are separate from aliases. An alias is not a fake use of
a code, and codes remain reusable by multiple invitees.

## Release order

1. The new table and index are defined in `shared/schema.ts` and have been applied
   to development only.
2. Publish the Replit backend with its additive production schema change. Use
   the ordinary Publish schema-diff process; do not overwrite production data.
   No production DDL script, build hook, or startup DDL is used.
3. Release the frontend through GitHub and Amplify for updated placeholders and
   help text. Frontend-only publishing cannot update invite lookup behavior.
4. After release, check an owner's displayed code and confirm that both the new
   and previously shared codes validate in uppercase, lowercase and mixed case.

Do not drop the alias table or overwrite production data when publishing.
The production alias table must exist before the new backend serves traffic.

## Development validation

Run `npx tsx scripts/validate-invite-codes.ts --development`.
It creates temporary synthetic owner/invitee rows, verifies generation, case
matching, alias preservation, concurrency, collisions and referral ownership,
and removes only those fixture rows in a `finally` block. It must never be run
against production.

Add `--http` while the development workflow is running to also exercise the
public validation endpoint through the development preview domain, using only
the temporary fixture codes. It does not create friendships or send invitations.
