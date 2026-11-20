import type { RequestHandler } from "express";
import { passwordChangeSchema } from "../shared/passwordChange";
import { hashPassword, verifyPassword } from "./passwordSecurity";

interface PasswordChangeDependencies {
  getUser: (id: string) => Promise<{ password: string | null } | undefined>;
  decryptPassword: (value: string) => string;
  replacePassword: (id: string, previous: string, next: string) => Promise<boolean>;
  clearCache: (id: string) => Promise<unknown>;
}

export function createPasswordChangeHandler(deps: PasswordChangeDependencies): RequestHandler {
  return async (req: any, res) => {
    res.set("Cache-Control", "no-store");
    const id = req.user?.claims?.sub;
    if (!id) {
      res.status(401).json({ message: "Please sign in to change your password" });
      return;
    }
    const parsed = passwordChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      res.status(400).json({ message: issue.message, field: issue.path[0] });
      return;
    }
    try {
      const user = await deps.getUser(id);
      if (!user?.password) {
        res.status(400).json({ message: "Use Forgot password to recover your account password" });
        return;
      }
      const { currentPassword, newPassword } = parsed.data;
      let matches = false;
      try {
        matches = await verifyPassword(currentPassword, user.password);
      } catch {
        matches = false;
      }
      if (!matches) {
        res.status(400).json({ message: "Current password is incorrect", field: "currentPassword" });
        return;
      }
      const hash = await hashPassword(newPassword);
      // Compare-and-swap prevents overlapping requests from replacing a newer password.
      if (!await deps.replacePassword(id, user.password, hash)) {
        res.status(409).json({ message: "Your password changed during this request. Please enter your current password again." });
        return;
      }
      try {
        await deps.clearCache(id);
      } catch {
        console.warn("[PasswordChange] Password saved; profile cache cleanup unavailable");
      }
      res.json({ success: true, message: "Password changed successfully" });
    } catch {
      console.error("[PasswordChange] Could not complete password change");
      res.status(500).json({ message: "Couldn't change your password. Please try again." });
    }
  };
}
