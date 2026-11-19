import { randomInt } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { inviteCodeAliases, usedInviteCodes, users } from "@shared/schema";
import { INVITE_CODE_ALPHABET, READABLE_INVITE_CODE_PATTERN, isReadableInviteCode, normalizeInviteCode } from "@shared/inviteCodes";
import { cacheService } from "./cacheService";

type InviteDatabase = Pick<typeof db, "select" | "insert" | "update" | "execute">;

export function createInviteCodeCandidate(): string {
  const part = () => Array.from({ length: 4 }, () =>
    INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]).join("");
  return `KQ-${part()}-${part()}`;
}

export async function generateUniqueInviteCode(
  database: InviteDatabase = db,
  createCandidate: () => string = createInviteCodeCandidate,
): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = createCandidate();
    const [owner] = await database.select({ id: users.id }).from(users)
      .where(sql`upper(btrim(${users.inviteCode})) = ${code}`).limit(1);
    const [alias] = await database.select({ code: inviteCodeAliases.code }).from(inviteCodeAliases)
      .where(eq(inviteCodeAliases.code, code)).limit(1);
    const [usage] = await database.select({ id: usedInviteCodes.id }).from(usedInviteCodes)
      .where(sql`upper(btrim(${usedInviteCodes.inviteCode})) = ${code}`).limit(1);
    if (!owner && !alias && !usage) return code;
  }
  throw new Error("Unable to allocate a unique invite code");
}

export async function replaceLegacyInviteCode(userId: string, force = false): Promise<string | null> {
  const result = await db.transaction(async tx => {
    // Serialize replacements across all app instances, and lock the owner row.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('mykliq-readable-invite-codes'))`);
    const [owner] = await tx.select({ id: users.id, code: users.inviteCode })
      .from(users).where(eq(users.id, userId)).for("update");
    if (!owner) return null;
    if (!force && isReadableInviteCode(owner.code)) return owner.code;

    const oldCode = normalizeInviteCode(owner.code);
    if (oldCode) {
      const conflictingOwners = await tx.select({ id: users.id }).from(users)
        .where(sql`upper(btrim(${users.inviteCode})) = ${oldCode} and ${users.id} <> ${userId}`);
      if (conflictingOwners.length) throw new Error("Legacy invite code has ambiguous ownership");
      await tx.insert(inviteCodeAliases).values({ code: oldCode, userId }).onConflictDoNothing();
      const [alias] = await tx.select().from(inviteCodeAliases).where(eq(inviteCodeAliases.code, oldCode));
      if (alias?.userId !== userId) throw new Error("Legacy invite alias belongs to another owner");
    }
    const code = await generateUniqueInviteCode(tx);
    await tx.update(users).set({ inviteCode: code, updatedAt: new Date() }).where(eq(users.id, userId));
    return code;
  });
  if (result) await cacheService.del(`user:profile:${userId}`);
  return result;
}

/** One bounded pass over existing owners; no schema changes or recurring job. */
export async function replaceAllLegacyInviteCodes(): Promise<number> {
  const owners = await db.select({ id: users.id }).from(users)
    .where(sql`${users.inviteCode} is null or ${users.inviteCode} !~ ${READABLE_INVITE_CODE_PATTERN}`);
  let replaced = 0;
  for (const owner of owners) {
    if (await replaceLegacyInviteCode(owner.id)) replaced++;
  }
  return replaced;
}
