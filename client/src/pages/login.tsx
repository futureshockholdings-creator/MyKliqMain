import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl } from "@/lib/apiConfig";

const loginSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Track if we should force showing the login form (user just logged out)
  const [shouldForceLogin, setShouldForceLogin] = useState(() => {
    const forceLogout = sessionStorage.getItem('forceLogout');
    if (forceLogout) {
      sessionStorage.removeItem('forceLogout');
      return true;
    }
    return false;
  });

  // If user is already logged in, redirect to home
  // BUT don't redirect if they just logged out (forces re-authentication)
  useEffect(() => {
    // Don't redirect if we're forcing login (user just logged out)
    if (shouldForceLogin) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation, shouldForceLogin]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl("/api/user/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: values.phoneNumber,
          password: values.password,
        }),
      });
      

      if (response.ok) {
        // Login successful - check if we got JSON or HTML
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.log("Login response:", data);
        }

        // Track daily login and award Kliq Koin
        try {
          const loginResponse = await fetch(buildApiUrl("/api/kliq-koins/login"), {
            method: "POST",
            credentials: "include",
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            
            // Show notification if Koin was awarded
            if (loginData.koinAwarded) {
              toast({
                title: "Daily Login Bonus! 🪙",
                description: `+1 Kliq Koin earned! Current streak: ${loginData.currentStreak} days`,
              });
            }
            
            // Show streak milestone notification
            if (loginData.borderUnlocked) {
              toast({
                title: `🎉 ${loginData.borderUnlocked.border.name} Unlocked!`,
                description: `You've reached a ${loginData.currentStreak}-day streak! Check your borders in Settings.`,
              });
            }
          }
        } catch (err) {
          console.error("Failed to track daily login:", err);
        }

        toast({
          title: "Login Successful", 
          description: "Welcome back to MyKliq!",
        });

        // Clear the force login flag since they successfully logged in
        setShouldForceLogin(false);

        // Force a complete page reload to ensure session is properly loaded
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        // Handle error response
        let errorMessage = "Invalid phone number or password";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Login failed (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid phone number or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If already authenticated AND not forcing login, don't render login form (useEffect will redirect)
  if (isAuthenticated && !shouldForceLogin) {
    return null;
  }

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
        <div className="bg-gradient-to-r from-primary via-secondary to-mykliq-green h-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          <div className="absolute bottom-4 left-4">
            <h1 className="text-3xl font-bold text-white">
              MyKliq
            </h1>
            <p className="text-white/90 text-sm">Welcome Back</p>
          </div>
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm"
              className="absolute top-4 left-4 text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Login Form */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary mb-2">
              Login to Your Account
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter your phone number and password to access your kliq
            </p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Account Login</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <PhoneInput
                            label=""
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={isLoading}
                            placeholder="Enter your phone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="bg-background border-border text-foreground pr-10"
                              disabled={isLoading}
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground font-bold py-3"
                    data-testid="button-login"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* New User Link */}
          <div className="text-center pt-3">
            <p className="text-muted-foreground text-sm mb-2">
              Don't have an account yet?
            </p>
            <Link href="/">
              <Button 
                variant="outline" 
                className="w-full bg-card border-border text-card-foreground hover:bg-accent"
                data-testid="link-signup"
              >
                Join MyKliq
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-border space-y-3">
            {/* Privacy Policy, Disclaimer, Guidelines, and Contact Us Links */}
            <div className="flex justify-center items-center gap-4 text-xs flex-wrap">
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
              <span className="text-gray-600">•</span>
              <button 
                className="text-muted-foreground hover:text-primary underline transition-colors"
                onClick={() => window.open('/community-guidelines', '_blank')}
                data-testid="link-guidelines"
              >
                Guidelines
              </button>
              <span className="text-gray-600">•</span>
              <button 
                className="text-muted-foreground hover:text-primary underline transition-colors"
                onClick={() => window.open('/contact-us', '_blank')}
                data-testid="link-contact-us"
              >
                Contact Us
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              © 2025 MyKliq. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}