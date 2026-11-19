import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import { inviteCodeAliases, usedInviteCodes, users } from "../shared/schema";
import { isReadableInviteCode, normalizeInviteCode } from "../shared/inviteCodes";
import { createInviteCodeCandidate, generateUniqueInviteCode, replaceLegacyInviteCode } from "../server/inviteCodeService";

async function main() {
  if (!process.argv.includes("--development") || process.env.NODE_ENV === "production") {
    throw new Error("Run this fixture-based validation only in development with --development");
  }
  let checks = 0;
  const check = (name: string) => { checks++; console.log(`PASS: ${name}`); };
  for (let index = 0; index < 5000; index++) {
    const code = createInviteCodeCandidate();
    assert.ok(isReadableInviteCode(code));
    assert.doesNotMatch(code, /[il1]/i);
  }
  check("5,000 generated codes exclude I, L and 1, including the prefix");
  assert.equal(normalizeInviteCode("  kLiQ-AbCd-1234  "), "KLIQ-ABCD-1234");
  for (const value of [null, undefined, {}, 123, ["code"]]) assert.equal(normalizeInviteCode(value), "");
  check("normalization accepts mixed case and surrounding whitespace, not invalid input types");

  const ownerId = randomUUID();
  const visitorId = randomUUID();
  const legacy = `KLIQ-${randomUUID().replaceAll("-", "").slice(0, 9)}`.toUpperCase();
  try {
    await db.insert(users).values([
      { id: ownerId, inviteCode: legacy },
      { id: visitorId, inviteCode: await generateUniqueInviteCode() },
    ]);
    const codes = await Promise.all([replaceLegacyInviteCode(ownerId), replaceLegacyInviteCode(ownerId)]);
    const code = codes[0]!;
    assert.ok(isReadableInviteCode(code));
    assert.equal(codes[1], code);
    check("concurrent legacy replacements produce one readable displayed code");
    const mixed = (value: string) => Array.from(value, (char, i) => i % 2 ? char.toLowerCase() : char).join("");
    for (const value of [code, code.toLowerCase(), mixed(code), legacy, legacy.toLowerCase(), mixed(legacy), `  ${legacy.toLowerCase()}  `]) {
      assert.equal((await storage.getUserByInviteCode(value))?.id, ownerId);
    }
    check("old and new codes resolve to the original owner in every letter case");
    assert.equal(await replaceLegacyInviteCode(ownerId), code);
    const aliases = await db.select().from(inviteCodeAliases).where(eq(inviteCodeAliases.userId, ownerId));
    assert.equal(aliases.length, 1);
    assert.equal(aliases[0].code, legacy);
    check("replacement is idempotent and retains the original code as an alias");
    assert.equal((await db.select().from(usedInviteCodes).where(eq(usedInviteCodes.ownedBy, ownerId))).length, 0);
    check("replacing a code does not invent referral usage");
    await storage.markInviteCodeAsUsed(legacy.toLowerCase(), visitorId, ownerId);
    assert.ok(await storage.isInviteCodeUsed(mixed(legacy)));
    const [usage] = await db.select().from(usedInviteCodes).where(eq(usedInviteCodes.ownedBy, ownerId));
    assert.equal(usage.inviteCode, legacy);
    assert.equal(usage.ownedBy, ownerId);
    assert.equal(usage.usedBy, visitorId);
    check("usage is canonical and referral ownership is preserved");

    const regenerated = await replaceLegacyInviteCode(ownerId, true);
    assert.ok(isReadableInviteCode(regenerated));
    assert.notEqual(regenerated, code);
    for (const previous of [legacy, code, regenerated]) {
      assert.equal((await storage.getUserByInviteCode(previous.toLowerCase()))?.id, ownerId);
    }
    check("manual regeneration preserves both legacy and previously displayed invitations");

    if (process.argv.includes("--http")) {
      if (!process.env.REPLIT_DEV_DOMAIN) throw new Error("Development preview domain is required for HTTP checks");
      const endpoint = `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/validate-invite-code`;
      for (const input of [legacy.toLowerCase(), mixed(code), `  ${regenerated.toLowerCase()}  `]) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode: input }),
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.success, true);
        assert.equal(result.inviteCode, regenerated);
      }
      for (const input of [null, {}, 123, "   "]) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode: input }),
        });
        assert.equal(response.status, 400);
      }
      check("running validation API accepts old/new mixed-case codes and rejects invalid input types");
    }

    const aliasCollision = await generateUniqueInviteCode();
    await db.insert(inviteCodeAliases).values({ code: aliasCollision, userId: ownerId });
    const historyCollision = await generateUniqueInviteCode();
    await db.insert(usedInviteCodes).values({ inviteCode: historyCollision.toLowerCase(), ownedBy: ownerId, usedBy: visitorId });
    const free = await generateUniqueInviteCode();
    const candidates = [regenerated!, aliasCollision, historyCollision, free];
    assert.equal(await generateUniqueInviteCode(db, () => candidates.shift()!), free);
    check("allocation skips active codes, reserved aliases and mixed-case usage history");

    await db.update(users).set({ inviteCode: legacy.toLowerCase() }).where(eq(users.id, visitorId));
    await assert.rejects(replaceLegacyInviteCode(visitorId), /belongs to another owner/);
    await assert.rejects(storage.getUserByInviteCode(legacy), /ambiguous ownership/);
    const [unchanged] = await db.select().from(users).where(eq(users.id, visitorId));
    assert.equal(unchanged.inviteCode, legacy.toLowerCase());
    check("alias ownership conflicts roll back without changing the user code");
    console.log(`All ${checks} invite-code checks passed.`);
  } finally {
    // Only generated fixture IDs are removed. No existing member is changed.
    await db.delete(users).where(inArray(users.id, [ownerId, visitorId]));
  }
}

main().then(async () => {
  await pool.end();
  process.exit(0);
}).catch(async error => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
