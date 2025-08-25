import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowLeft, Phone, Shield, Lock } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState<'phone' | 'questions' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: "",
    answer2: "",
    answer3: ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendResetSMS = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/forgot-password", {
        phoneNumber
      });
      
      if (data.success) {
        setResetToken(data.resetToken);
        setStep('questions');
        toast({
          title: "SMS sent!",
          description: "Check your phone for password reset instructions",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset SMS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifySecurityQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/verify-security", {
        resetToken,
        securityAnswer1: securityAnswers.answer1,
        securityAnswer2: securityAnswers.answer2,
        securityAnswer3: securityAnswers.answer3
      });
      
      if (data.success) {
        setStep('password');
        toast({
          title: "Security questions verified!",
          description: "Now you can set a new password",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Security answers don't match",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        resetToken,
        newPassword
      });
      
      toast({
        title: "Password reset successful!",
        description: "You can now login with your new password",
      });
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-primary text-2xl">
              {step === 'phone' && (
                <>
                  <Phone className="w-8 h-8 mx-auto mb-2" />
                  Reset Password
                </>
              )}
              {step === 'questions' && (
                <>
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  Security Questions
                </>
              )}
              {step === 'password' && (
                <>
                  <Lock className="w-8 h-8 mx-auto mb-2" />
                  New Password
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Enter your phone number to receive a password reset link
                </p>
                <PhoneInput
                  label="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  data-testid="input-phone-reset"
                />
                <Button
                  onClick={sendResetSMS}
                  disabled={!phoneNumber || isLoading}
                  className="w-full"
                  data-testid="button-send-reset-sms"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </>
            )}

            {step === 'questions' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Answer your security questions to verify your identity
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      What was the make and model of your first car?
                    </label>
                    <Input
                      value={securityAnswers.answer1}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer1: e.target.value})}
                      placeholder="Enter your answer"
                      data-testid="input-security-answer-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      What is your mother's maiden name?
                    </label>
                    <Input
                      value={securityAnswers.answer2}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer2: e.target.value})}
                      placeholder="Enter your answer"
                      data-testid="input-security-answer-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      What was your favorite teacher's last name?
                    </label>
                    <Input
                      value={securityAnswers.answer3}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer3: e.target.value})}
                      placeholder="Enter your answer"
                      data-testid="input-security-answer-3"
                    />
                  </div>
                </div>
                <Button
                  onClick={verifySecurityQuestions}
                  disabled={!securityAnswers.answer1 || !securityAnswers.answer2 || !securityAnswers.answer3 || isLoading}
                  className="w-full"
                  data-testid="button-verify-security"
                >
                  {isLoading ? "Verifying..." : "Verify Answers"}
                </Button>
              </>
            )}

            {step === 'password' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Create a new password for your account
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
                <Button
                  onClick={resetPassword}
                  disabled={!newPassword || !confirmPassword || isLoading}
                  className="w-full"
                  data-testid="button-reset-password"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}