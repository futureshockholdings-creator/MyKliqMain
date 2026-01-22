import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowLeft, Phone, Shield, Lock, Hash, User } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
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
          title: "Name verified!",
          description: "Please enter your phone number",
        });
      }
    } catch (error: any) {
      toast({
        title: "Name verification failed",
        description: error.message || "Name doesn't match our records",
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
          title: "Phone number verified!",
          description: "Please answer your security questions",
        });
      }
    } catch (error: any) {
      toast({
        title: "Phone verification failed",
        description: error.message || "Phone number doesn't match our records",
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
        setStep('pin');
        toast({
          title: "Security questions verified!",
          description: "Now enter your 4-digit PIN",
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

  const verifyPin = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/auth/verify-pin", {
        resetToken,
        pin
      });
      
      if (data.success) {
        setStep('password');
        toast({
          title: "PIN verified!",
          description: "Now you can set a new password",
        });
      }
    } catch (error: any) {
      toast({
        title: "PIN verification failed",
        description: error.message || "Incorrect PIN",
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
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-primary"
            onClick={() => {
              // Logout and redirect to login
              window.location.href = "/api/logout";
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Log In
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-card-foreground text-2xl">
              {step === 'name' && (
                <>
                  <User className="w-8 h-8 mx-auto mb-2" />
                  Reset Password - Step 1 of 5
                </>
              )}
              {step === 'phone' && (
                <>
                  <Phone className="w-8 h-8 mx-auto mb-2" />
                  Reset Password - Step 2 of 5
                </>
              )}
              {step === 'questions' && (
                <>
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  Reset Password - Step 3 of 5
                </>
              )}
              {step === 'pin' && (
                <>
                  <Hash className="w-8 h-8 mx-auto mb-2" />
                  Reset Password - Step 4 of 5
                </>
              )}
              {step === 'password' && (
                <>
                  <Lock className="w-8 h-8 mx-auto mb-2" />
                  Reset Password - Step 5 of 5
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'name' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Enter your first and last name for account verification
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
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
                  {isLoading ? "Verifying..." : "Verify Name"}
                </Button>
              </>
            )}

            {step === 'phone' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Enter your phone number for account verification
                </p>
                <PhoneInput
                  label="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  data-testid="input-phone-reset"
                />
                <Button
                  onClick={verifyPhoneNumber}
                  disabled={!phoneNumber || isLoading}
                  className="w-full"
                  data-testid="button-verify-account"
                >
                  {isLoading ? "Verifying..." : "Verify Account"}
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
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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
                  {isLoading ? "Verifying..." : "Verify Answers"}
                </Button>
              </>
            )}

            {step === 'pin' && (
              <>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Enter your 4-digit PIN to verify your identity
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
                  placeholder="Enter your 4-digit PIN"
                  className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 text-center text-xl tracking-widest"
                  data-testid="input-security-pin"
                />
                <Button
                  onClick={verifyPin}
                  disabled={pin.length !== 4 || isLoading}
                  className="w-full"
                  data-testid="button-verify-pin"
                >
                  {isLoading ? "Verifying..." : "Verify PIN"}
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
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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