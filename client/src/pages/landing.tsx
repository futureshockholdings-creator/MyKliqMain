import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { Users, Crown, Palette, Shield, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mockCode, setMockCode] = useState("");
  const { toast } = useToast();

  const sendVerification = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/send-verification", {
        phoneNumber
      });
      const data = await response.json();
      
      if (data.success) {
        setIsVerifying(true);
        setMockCode(data.mockCode); // For MVP - remove in production
        toast({
          title: "Verification code sent!",
          description: `Code sent to ${phoneNumber}${data.mockCode ? ` (Mock: ${data.mockCode})` : ''}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    }
  };

  const verifyAndJoin = async () => {
    try {
      await apiRequest("POST", "/api/auth/verify-phone", {
        phoneNumber,
        verificationCode
      });

      // If successful, proceed to login
      window.location.href = "/api/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-8 w-16 h-16 bg-secondary rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-6 w-12 h-12 bg-mykliq-green rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 right-12 w-8 h-8 bg-mykliq-orange rounded-full animate-bounce"></div>
      </div>

      <div className="relative z-10 max-w-sm mx-auto bg-card min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary via-secondary to-mykliq-green h-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          <div className="absolute bottom-4 left-4">
            <h1 className="text-3xl font-bold text-white">
              MyKliq
            </h1>
            <p className="text-white/90 text-sm">Your Exclusive Social Circle</p>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary mb-2">
              Relive the Golden Age of Social Networking with Modern Features
            </h2>
            <p className="text-muted-foreground text-sm">
              Connect with your closest friends in a private, customizable space.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/20 to-mykliq-purple/20 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-primary">Exclusive Friend Limit</h3>
                    <p className="text-xs text-muted-foreground">Only 28 friends max - quality over quantity!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-mykliq-purple/20 to-primary/20 border-mykliq-purple/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-mykliq-purple" />
                  <div>
                    <h3 className="font-bold text-mykliq-purple">Moviecons</h3>
                    <p className="text-xs text-muted-foreground">Emoji's and GIF's are cool, but actual video and audio from your favorite shows and movies are better</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-secondary/20 to-mykliq-green/20 border-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-secondary" />
                  <div>
                    <h3 className="font-bold text-secondary">Pyramid Rankings</h3>
                    <p className="text-xs text-muted-foreground">Organize your friends in a hierarchy that matters to you</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-mykliq-orange/20 to-retro-yellow/20 border-mykliq-orange/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Palette className="w-8 h-8 text-mykliq-orange" />
                  <div>
                    <h3 className="font-bold text-mykliq-orange">Full Customization</h3>
                    <p className="text-xs text-muted-foreground">Personalize colors, fonts, and themes to make it yours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-mykliq-green/20 to-secondary/20 border-mykliq-green/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-mykliq-green" />
                  <div>
                    <h3 className="font-bold text-mykliq-green">Content Filtering</h3>
                    <p className="text-xs text-muted-foreground">Filter out unwanted content with keyword blocking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground font-bold py-3"
            >
              Join MyKliq Now!
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-card border-border text-card-foreground hover:bg-accent"
                >
                  Join with Invite Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-card-foreground max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-primary">Join a Kliq!</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <PhoneInput
                    label="Your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isVerifying}
                  />
                  
                  <div>
                    <label className="text-sm text-gray-400">Invitation code (optional)</label>
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="KLIQ-XXXX-XXXX"
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled={isVerifying}
                    />
                  </div>

                  {!isVerifying ? (
                    <Button
                      onClick={sendVerification}
                      disabled={!phoneNumber}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold"
                    >
                      Send Verification Code
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Enter 6-digit code</label>
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="bg-gray-700 border-gray-600 text-white text-center text-lg"
                        />
                        {mockCode && (
                          <p className="text-xs text-yellow-400 mt-1">
                            Mock code for testing: {mockCode}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={verifyAndJoin}
                        disabled={verificationCode.length !== 6}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        Verify & Join MyKliq
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-800 space-y-3">
            
            {/* Privacy Policy and Disclaimer Links */}
            <div className="flex justify-center items-center gap-4 text-xs">
              <button 
                className="text-muted-foreground hover:text-primary underline transition-colors"
                onClick={() => window.open('/privacy-policy', '_blank')}
                data-testid="link-privacy-policy"
              >
                Privacy Policy
              </button>
              <span className="text-gray-600">•</span>
              <button 
                className="text-muted-foreground hover:text-primary underline transition-colors"
                onClick={() => window.open('/disclaimer', '_blank')}
                data-testid="link-disclaimer"
              >
                Disclaimer
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mt-2">
              © 2024 MyKliq. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
