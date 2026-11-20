import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Shield } from "lucide-react";
import { passwordChangeSchema, type PasswordChangeValues } from "@shared/passwordChange";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };
const fields = [
  { name: "currentPassword", label: "Current password", autocomplete: "current-password", testId: "input-current-password" },
  { name: "newPassword", label: "New password", autocomplete: "new-password", testId: "input-new-password" },
  { name: "confirmPassword", label: "Confirm new password", autocomplete: "new-password", testId: "input-confirm-password" },
] as const;

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [visible, setVisible] = useState<Partial<Record<keyof PasswordChangeValues, boolean>>>({});
  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { ...emptyPasswords },
  });
  const changePassword = useMutation({
    mutationFn: (values: PasswordChangeValues) => apiRequest("POST", "/api/auth/change-password", values),
    // A password change must not be silently replayed after a lost response.
    retry: false,
    onSuccess: () => {
      form.reset({ ...emptyPasswords });
      setVisible({});
      toast({ title: "Password changed", description: "Use your new password the next time you log in." });
    },
    onError: (error: Error) => {
      let message = "Couldn't change your password. Please try again.";
      let field: keyof PasswordChangeValues | undefined;
      try {
        const body = JSON.parse(error.message.slice(error.message.indexOf("{")));
        if (typeof body.message === "string") message = body.message;
        if (fields.some(item => item.name === body.field)) field = body.field;
      } catch { /* Network failures do not contain an API response. */ }
      if (field) form.setError(field, { type: "server", message }, { shouldFocus: true });
      else toast({ title: "Password not changed", description: message, variant: "destructive" });
    },
  });

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Shield className="w-5 h-5" />Change Password
        </CardTitle>
        <p className="text-sm text-muted-foreground">Enter your current password to choose a new one.</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(values => changePassword.mutate(values))} className="space-y-4">
            {fields.map(item => (
              <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{item.label}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={visible[item.name] ? "text" : "password"}
                        autoComplete={item.autocomplete} autoCapitalize="none" spellCheck={false}
                        disabled={changePassword.isPending} placeholder={item.label}
                        className="bg-white border-gray-300 text-black pr-12" data-testid={item.testId} />
                    </FormControl>
                      <Button type="button" variant="ghost" size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        aria-label={`${visible[item.name] ? "Hide" : "Show"} ${item.label.toLowerCase()}`}
                        aria-pressed={!!visible[item.name]}
                        onClick={() => setVisible(current => ({ ...current, [item.name]: !current[item.name] }))}>
                        {visible[item.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                  </div>
                  {item.name === "newPassword" && (
                    <p className="text-sm text-muted-foreground">At least 10 characters with a letter, a number, and a special character. Maximum 72 bytes.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <Button type="submit" disabled={changePassword.isPending} className="w-full" data-testid="button-change-password">
              {changePassword.isPending ? "Changing password…" : "Change Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
