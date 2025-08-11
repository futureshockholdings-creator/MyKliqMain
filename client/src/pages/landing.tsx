import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { Sparkles, Users, Crown, Palette, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-pink-500 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-8 w-16 h-16 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-6 w-12 h-12 bg-green-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 right-12 w-8 h-8 bg-yellow-500 rounded-full animate-bounce"></div>
      </div>

      <div className="relative z-10 max-w-sm mx-auto bg-gray-900 min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 h-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          <div className="absolute bottom-4 left-4">
            <h1 className="text-3xl font-bold text-white" style={{ textShadow: '4px 4px 0px #FF4500, 8px 8px 0px #8A2BE2' }}>
              ✨ MyKliq ✨
            </h1>
            <p className="text-white/90 text-sm">Your Exclusive Social Circle</p>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-pink-400 mb-2">
              Welcome to the Future of Social!
            </h2>
            <p className="text-gray-400 text-sm">
              Connect with your closest friends in a private, customizable space.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-pink-400" />
                  <div>
                    <h3 className="font-bold text-pink-400">Exclusive Friend Limit</h3>
                    <p className="text-xs text-gray-300">Only 15 friends max - quality over quantity!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-blue-400">Pyramid Rankings</h3>
                    <p className="text-xs text-gray-300">Organize your friends in a hierarchy that matters to you</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Palette className="w-8 h-8 text-orange-400" />
                  <div>
                    <h3 className="font-bold text-orange-400">Full Customization</h3>
                    <p className="text-xs text-gray-300">Personalize colors, fonts, and themes like MySpace</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-purple-400">Content Filtering</h3>
                    <p className="text-xs text-gray-300">Filter out unwanted content with keyword blocking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-3"
              style={{ boxShadow: '0 0 20px rgba(255, 20, 147, 0.5)' }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Join MyKliq Now!
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Join with Invite Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-pink-400">Join a Kliq!</DialogTitle>
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
          <div className="text-center pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Relive the golden age of social networking with modern features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
