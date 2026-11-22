import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowLeft, Phone, Shield, Lock, Hash, User } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function ForgotPassword() {
  useUiLanguage();
  const [step, setStep] = useState<'name' | 'phone' | 'questions' | 'pin' | 'password'>('name');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: "",
    answer2: "",
    answer3: ""
  });
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const verifyName = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/verify-name", {
        firstName,
        lastName
      });
      
      if (data.success) {
        setStep('phone');
        toast({
          title: uiText("Name verified!"),
          description: uiText("Please enter your phone number"),
        });
      }
    } catch (error: any) {
      toast({
        title: uiText("Name verification failed"),
        description: error.message || uiText("Name doesn't match our records"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneNumber = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/forgot-password", {
        firstName,
        lastName,
        phoneNumber
      });
      
      if (data.success) {
        setResetToken(data.resetToken);
        setStep('questions');
        toast({
          title: uiText("Phone number verified!"),
          description: uiText("Please answer your security questions"),
        });
      }
    } catch (error: any) {
      toast({
        title: uiText("Phone verification failed"),
        description: error.message || uiText("Phone number doesn't match our records"),
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
        if (!data.resetToken) throw new Error(uiText("Please restart password recovery."));
        setResetToken(data.resetToken);
        setStep('pin');
        toast({
          title: uiText("Security questions verified!"),
          description: uiText("Now enter your 4-digit PIN"),
        });
      }
    } catch (error: any) {
      toast({
        title: uiText("Verification failed"),
        description: error.message || uiText("Security answers don't match"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/verify-pin", {
        resetToken,
        pin
      });
      
      if (data.success) {
        if (!data.resetToken) throw new Error(uiText("Please restart password recovery."));
        setResetToken(data.resetToken);
        setStep('password');
        toast({
          title: uiText("PIN verified!"),
          description: uiText("Now you can set a new password"),
        });
      }
    } catch (error: any) {
      toast({
        title: uiText("PIN verification failed"),
        description: error.message || uiText("Incorrect PIN"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: uiText("Passwords don't match"),
        description: uiText("Please make sure both passwords are the same"),
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
        title: uiText("Password reset successful!"),
        description: uiText("You can now login with your new password"),
      });
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (error: any) {
      toast({
        title: uiText("Error"),
        description: error.message || uiText("Failed to reset password"),
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
          <Button 
            asChild
            variant="ghost" 
            className="text-muted-foreground hover:text-primary"
          >
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              {uiText("Back to Log In")}
            </Link>
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-card-foreground text-2xl">
              {step === 'name' && (
                <>
                  <User className="w-8 h-8 mx-auto mb-2" />
                  {uiText("Reset Password - Step 1 of 5")}
                </>
              )}
              {step === 'phone' && (
                <>
                  <Phone className="w-8 h-8 mx-auto mb-2" />
                  {uiText("Reset Password - Step 2 of 5")}
                </>
              )}
              {step === 'questions' && (
                <>
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  {uiText("Reset Password - Step 3 of 5")}
                </>
              )}
              {step === 'pin' && (
                <>
                  <Hash className="w-8 h-8 mx-auto mb-2" />
                  {uiText("Reset Password - Step 4 of 5")}
                </>
              )}
              {step === 'password' && (
                <>
                  <Lock className="w-8 h-8 mx-auto mb-2" />
                  {uiText("Reset Password - Step 5 of 5")}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'name' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  {uiText("Enter your first and last name for account verification")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("First Name")}
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={uiText("Enter your first name")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("Last Name")}
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={uiText("Enter your last name")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <Button
                  onClick={verifyName}
                  disabled={!firstName || !lastName || isLoading}
                  className="w-full"
                  data-testid="button-verify-name"
                >
                  {isLoading ? uiText("Verifying...") : uiText("Verify Name")}
                </Button>
              </>
            )}

            {step === 'phone' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  {uiText("Enter your phone number for account verification")}
                </p>
                <PhoneInput
                  label={uiText("Phone number")}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={uiText("Enter your phone number")}
                  data-testid="input-phone-reset"
                />
                <Button
                  onClick={verifyPhoneNumber}
                  disabled={!phoneNumber || isLoading}
                  className="w-full"
                  data-testid="button-verify-account"
                >
                  {isLoading ? uiText("Verifying...") : uiText("Verify Account")}
                </Button>
              </>
            )}

            {step === 'questions' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  {uiText("Answer your security questions to verify your identity")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("What was the make and model of your first car?")}
                    </label>
                    <Input
                      value={securityAnswers.answer1}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer1: e.target.value})}
                      placeholder={uiText("Enter your answer")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-security-answer-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("What is your mother's maiden name?")}
                    </label>
                    <Input
                      value={securityAnswers.answer2}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer2: e.target.value})}
                      placeholder={uiText("Enter your answer")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-security-answer-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("What was your favorite teacher's last name?")}
                    </label>
                    <Input
                      value={securityAnswers.answer3}
                      onChange={(e) => setSecurityAnswers({...securityAnswers, answer3: e.target.value})}
                      placeholder={uiText("Enter your answer")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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
                  {isLoading ? uiText("Verifying...") : uiText("Verify Answers")}
                </Button>
              </>
            )}

            {step === 'pin' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  {uiText("Enter your 4-digit PIN to verify your identity")}
                </p>
                <Input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setPin(value);
                  }}
                  placeholder={uiText("Enter your 4-digit PIN")}
                  className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 text-center text-xl tracking-widest"
                  data-testid="input-security-pin"
                />
                <Button
                  onClick={verifyPin}
                  disabled={pin.length !== 4 || isLoading}
                  className="w-full"
                  data-testid="button-verify-pin"
                >
                  {isLoading ? uiText("Verifying...") : uiText("Verify PIN")}
                </Button>
              </>
            )}

            {step === 'password' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  {uiText("Create a new password for your account")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("New Password")}
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={uiText("Enter new password")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {uiText("Confirm Password")}
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={uiText("Confirm new password")}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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
                  {isLoading ? uiText("Resetting...") : uiText("Reset Password")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}