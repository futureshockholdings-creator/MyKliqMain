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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl } from "@/lib/apiConfig";
import { setAuthToken, getAuthToken } from "@/lib/tokenStorage";

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
      
      console.log("[Login] Response status:", response.status, "type:", response.type);

      if (response.ok) {
        // Login successful - parse JSON response
        let authToken: string | null = null;
        
        // SAFARI FIX: Clone response before reading body to avoid Safari CORS+Cookie bug
        // Safari's fetch polyfill fails on response.json() for CORS responses with Set-Cookie
        // Using response.text() + JSON.parse() ensures body is read exactly once
        try {
          const responseText = await response.text();
          console.log("[Login] Response text length:", responseText.length);
          
          const data = JSON.parse(responseText);
          console.log("[Login] Parsed response keys:", Object.keys(data));
          console.log("[Login] Token in response:", !!data.token, "length:", data.token?.length || 0);
          
          if (data.token) {
            authToken = data.token;
            setAuthToken(data.token);
            console.log("[Login] Auth token stored successfully from response body");
          } else {
            // Fallback to header if body token missing
            const headerToken = response.headers.get('X-Auth-Token');
            console.log("[Login] No body token, header token:", !!headerToken);
            if (headerToken) {
              authToken = headerToken;
              setAuthToken(headerToken);
              console.log("[Login] Auth token stored from header fallback");
            } else {
              console.error("[Login] CRITICAL: No token in response body or header!");
            }
          }
        } catch (parseError) {
          console.error("[Login] Failed to parse response:", parseError);
          // Last resort: try header
          const headerToken = response.headers.get('X-Auth-Token');
          if (headerToken) {
            authToken = headerToken;
            setAuthToken(headerToken);
            console.log("[Login] Using header token after parse failure");
          }
        }

        // Track daily login and award Kliq Koin
        // Use the token directly from the response (not from storage) to avoid Safari ITP issues
        console.log('[Login] About to make kliq-koins request. authToken type:', typeof authToken, 'truthy:', !!authToken);
        try {
          if (!authToken) {
            console.warn('[Login] No token available - skipping kliq-koins request');
          } else {
            const kliqKoinsUrl = buildApiUrl("/api/kliq-koins/login");
            console.log('[Login] Making kliq-koins request to:', kliqKoinsUrl, 'with token length:', authToken.length);
            
            const loginResponse = await fetch(kliqKoinsUrl, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              credentials: "include",
            });
            console.log('[Login] kliq-koins response status:', loginResponse.status);
          
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
            } else {
              console.error('[Login] kliq-koins request failed:', loginResponse.status);
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

        // Use React Router navigation instead of full page reload
        // This preserves the in-memory token for Safari ITP compatibility
        // Invalidate auth query to trigger re-fetch with new token
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
        
        // Small delay to ensure token is stored, then navigate
        setTimeout(() => {
          setLocation("/");
        }, 500);
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
      
      // Enhanced error messaging for debugging cross-browser issues
      let errorDescription = error.message || "Invalid phone number or password. Please try again.";
      
      // Check for network errors (common on older browsers like Silk)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorDescription = "Network error - please check your internet connection and try again.";
        console.error("[Login] Network/Fetch error - possible CORS or browser compatibility issue");
      } else if (error.message?.includes('Failed to fetch')) {
        errorDescription = "Unable to connect to server. Please check your connection.";
        console.error("[Login] Failed to fetch - server may be unreachable or CORS blocked");
      }
      
      toast({
        title: "Login Failed",
        description: errorDescription,
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