import { randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { passwordResetTokens } from "../shared/schema";

export type ResetStage = "questions" | "pin" | "reset";
export const newResetToken = (stage: ResetStage) =>
  `${stage}.${randomBytes(32).toString("base64url")}`;

export function isResetStage(token: unknown, stage: ResetStage): token is string {
  return typeof token === "string" && token.startsWith(`${stage}.`);
}

export async function advanceResetToken(token: string, from: ResetStage, to: ResetStage) {
  if (!isResetStage(token, from)) return null;
  const next = newResetToken(to);
  const changed = await db.update(passwordResetTokens).set({ token: next })
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())))
    .returning({ id: passwordResetTokens.id });
  return changed.length ? next : null;
}
