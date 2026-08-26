import crypto from "crypto";
import { and, eq, lt } from "drizzle-orm";
import { socialOAuthStates } from "@shared/schema";
import { encryptForStorage, decryptFromStorage } from "./cryptoService";
import { db } from "./db";

const STATE_TTL_MS = 10 * 60 * 1000;

export type SocialOAuthState = {
  state: string;
  userId: string;
  platform: string;
  returnUrl: string;
  redirectUri: string;
  codeVerifier?: string;
};

export async function createSocialOAuthState(input: Omit<SocialOAuthState, "state">): Promise<string> {
  const state = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  await db.delete(socialOAuthStates).where(lt(socialOAuthStates.expiresAt, new Date()));
  await db.insert(socialOAuthStates).values({
    state,
    userId: input.userId,
    platform: input.platform,
    returnUrl: input.returnUrl,
    redirectUri: input.redirectUri,
    encryptedCodeVerifier: input.codeVerifier ? encryptForStorage(input.codeVerifier) : null,
    expiresAt,
  });

  return state;
}

export async function consumeSocialOAuthState(state: string, platform: string): Promise<SocialOAuthState | null> {
  const [record] = await db
    .delete(socialOAuthStates)
    .where(and(
      eq(socialOAuthStates.state, state),
      eq(socialOAuthStates.platform, platform),
    ))
    .returning();

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return {
    state: record.state,
    userId: record.userId,
    platform: record.platform,
    returnUrl: record.returnUrl,
    redirectUri: record.redirectUri,
    codeVerifier: record.encryptedCodeVerifier
      ? decryptFromStorage(record.encryptedCodeVerifier)
      : undefined,
  };
}