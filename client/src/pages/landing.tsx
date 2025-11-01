import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Crown, Palette, Shield, Video, LogIn, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      // Check if invite code exists and is valid
      const data = await apiRequest("POST", "/api/auth/validate-invite-code", {
        inviteCode: inviteCode.trim()
      });

      if (data.success) {
        toast({
          title: "Valid invitation!",
          description: `Joining ${data.kliqOwner?.firstName}'s kliq...`,
        });
        // Redirect to signup with invite code
        setTimeout(() => {
          window.location.href = `/signup?inviteCode=${encodeURIComponent(inviteCode.trim())}`;
        }, 1000);
      } else {
        toast({
          title: "Invalid invitation code",
          description: data.message || "Please check your invitation code and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Invite code validation error:", error);
      toast({
        title: "Invalid invitation code",
        description: error.message || "Please check your invitation code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
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

      <div className="relative z-10 w-full max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-card min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary via-secondary to-mykliq-green h-32 md:h-40 lg:h-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 lg:bottom-8 lg:left-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              MyKliq
            </h1>
            <p className="text-white/90 text-sm md:text-base lg:text-lg">Your Exclusive Social Circle</p>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-2">
              Relive the Golden Age of Social Networking with Modern Features
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Connect with your closest friends in a private, customizable space.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <Card className="bg-gradient-to-r from-mykliq-blue/20 to-mykliq-purple/20 border-mykliq-blue/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-8 h-8 text-mykliq-blue" />
                  <div>
                    <h3 className="font-bold text-mykliq-blue">Social Integration</h3>
                    <p className="text-xs text-muted-foreground">Link other social accounts to create a one stop social experience</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => {
                console.log("Join MyKliq Now clicked - redirecting to signup");
                window.location.href = "/signup";
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground font-bold py-3"
              data-testid="button-join-now"
            >
              Join MyKliq Now!
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-card border-border text-card-foreground hover:bg-accent"
                  data-testid="button-join-with-invite"
                >
                  Join with Invite Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-card-foreground max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-primary">Join a Kliq!</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Invitation Code</label>
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="KLIQ-XXXX-XXXX"
                      className="mt-1"
                      disabled={isValidating}
                      data-testid="input-invite-code"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the invitation code you received from a friend
                    </p>
                  </div>

                  <Button
                    onClick={validateInviteCode}
                    disabled={!inviteCode.trim() || isValidating}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground font-bold"
                    data-testid="button-validate-invite"
                  >
                    {isValidating ? "Validating..." : "Join MyKliq"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Login Link */}
            <div className="text-center pt-3 space-y-2">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-primary text-sm underline"
                  data-testid="link-login"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Already have an account? Login here
                </Button>
              </Link>
              
              {/* Forgot Password Link */}
              <div>
                <Link href="/forgot-password">
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-primary text-sm underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot Password?
                  </Button>
                </Link>
              </div>
            </div>
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
