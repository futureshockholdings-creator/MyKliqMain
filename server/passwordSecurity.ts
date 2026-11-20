import bcrypt from "bcrypt";
import { createHash, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { db } from "./db";
import { cacheService } from "./cacheService";
import { decryptFromStorage } from "./cryptoService";

// Versioned pre-hashing preserves the entire UTF-8 password, including legacy
// passwords longer than bcrypt's 72-byte input limit. Never truncate a password.
const PREFIX = "bcrypt-sha256:v1:";
const COST = 12;
const material = (password: string) =>
  createHash("sha256").update(password, "utf8").digest("base64");

export async function hashPassword(password: string): Promise<string> {
  return PREFIX + await bcrypt.hash(material(password), COST);
}

export async function verifyPassword(password: unknown, stored: string | null | undefined): Promise<boolean> {
  if (typeof password !== "string" || !stored) return false;
  try {
    if (stored.startsWith(PREFIX)) {
      return await bcrypt.compare(material(password), stored.slice(PREFIX.length));
    }
    if (/^\$2[aby]\$/.test(stored)) {
      return await bcrypt.compare(password, stored.replace(/^\$2y\$/, "$2b$"));
    }
    // Read-only compatibility. No new credential is ever written encrypted.
    const previous = decryptFromStorage(stored);
    const a = createHash("sha256").update(password, "utf8").digest();
    const b = createHash("sha256").update(previous, "utf8").digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function authenticateAndUpgradePassword(
  user: { id: string; password: string | null }, password: unknown,
): Promise<boolean> {
  if (!await verifyPassword(password, user.password)) return false;
  if (user.password?.startsWith(PREFIX) &&
      bcrypt.getRounds(user.password.slice(PREFIX.length)) >= COST) return true;

  const next = await hashPassword(password as string);
  const changed = await db.update(users).set({ password: next, updatedAt: new Date() })
    .where(and(eq(users.id, user.id), eq(users.password, user.password!)))
    .returning({ id: users.id });
  if (!changed.length) {
    // A concurrent login may already have upgraded it; a concurrent reset must
    // not be overwritten or authorize a login using the old password.
    const [current] = await db.select({ password: users.password }).from(users).where(eq(users.id, user.id));
    if (!current || !await verifyPassword(password, current.password)) return false;
    user.password = current.password;
  } else {
    user.password = next;
  }
  try {
    await cacheService.del(`user:profile:${user.id}`);
  } catch {
    console.warn("[PasswordSecurity] Upgraded credential; profile cache cleanup unavailable");
  }
  return true;
}
