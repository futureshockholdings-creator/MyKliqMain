import { z } from "zod";

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string()
    .min(10, "Password must be at least 10 characters long")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    .refine(value => new TextEncoder().encode(value).length <= 72, "Password must be 72 bytes or fewer"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine(values => values.newPassword === values.confirmPassword, {
  message: "Passwords don't match", path: ["confirmPassword"],
}).refine(values => values.currentPassword !== values.newPassword, {
  message: "Choose a password different from your current password", path: ["newPassword"],
});

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
