// Uppercase display only; input matching must never depend on letter case.
// Excludes both cases of I/L and digit 1, including in the KQ prefix.
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKMNOPQRSTUVWXYZ023456789";
export const READABLE_INVITE_CODE_PATTERN = "^KQ-[ABCDEFGHJKMNOPQRSTUVWXYZ023456789]{4}-[ABCDEFGHJKMNOPQRSTUVWXYZ023456789]{4}$";

export function normalizeInviteCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function isReadableInviteCode(value: unknown): value is string {
  return typeof value === "string" && new RegExp(READABLE_INVITE_CODE_PATTERN).test(value);
}
