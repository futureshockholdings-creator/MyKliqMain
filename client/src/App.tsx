import React, { useEffect } from "react";
import { Switch, Route, Link, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { feedRealtimeService } from "@/lib/feedRealtime";
import { useTheme } from "@/hooks/useTheme";
import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import { useAppBadge } from "@/hooks/useAppBadge";
import { useTranslation } from "react-i18next";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";
import { formatDisplayNumber } from "@/i18n/formatting";
import "./i18n/config"; // Initialize i18n
import { initializeEnterpriseServices, cleanupEnterpriseServices } from "@/lib/enterprise/enterpriseInit";
import { enhancedCache } from "@/lib/enterprise/enhancedCache";
import { VideoCallProvider } from "@/contexts/VideoCallContext";
import { IncomingCallOverlay } from "@/components/IncomingCallOverlay";
import { VideoCallScreen } from "@/components/VideoCallScreen";
import { GroupVideoCallProvider } from "@/contexts/GroupVideoCallContext";
import { IncomingGroupCallOverlay } from "@/components/IncomingGroupCallOverlay";
import { GroupVideoCallScreen } from "@/components/GroupVideoCallScreen";
import { initAudioManager } from "@/lib/audioManager";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Kliq from "@/pages/kliq";
import Events from "@/pages/events";
import CalendarPage from "@/pages/calendar";
import Actions from "@/pages/actions";
import MeetupPage from "@/pages/meetup";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import Themes from "@/pages/themes";
import NotFound from "@/pages/not-found";
import { Messages } from "@/pages/messages";
import { Conversation } from "@/pages/conversation";
import { GroupChat } from "@/pages/group-chat";
import { MovieconManagerPage } from "@/pages/moviecon-manager";
import { MemeManagerPage } from "@/pages/meme-manager";
import MaintenanceDashboard from "@/pages/maintenance-dashboard";
import AdsManager from "@/pages/ads-manager";
import Settings from "@/pages/settings";
import PrivacyPolicy from "./pages/privacy-policy";
import Disclaimer from "./pages/disclaimer";
import CommunityGuidelines from "./pages/community-guidelines";
import TermsOfUse from "./pages/terms-of-use";
import ContactUs from "./pages/contact-us";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import AdminPage from "@/pages/admin";
import AdminReports from "@/pages/admin-reports";
import PostView from "@/pages/post-view";
import AdvertiserRequirements from "@/pages/advertiser-requirements";
import AdvertiserOnboarding from "@/pages/advertiser-onboarding";
import ChildSafety from "./pages/child-safety";

// Navigation Component
import { Home as HomeIcon, Users, Calendar, User, Palette, MessageCircle, Video, MapPin, Bell, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/NotificationBadge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { Chatbot } from "@/components/Chatbot";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PinVerificationModal } from "@/components/PinVerificationModal";
import { InstallPWA } from "@/components/InstallPWA";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useState } from "react";

function StartupSplashHandoff() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!document.documentElement.classList.contains("mykliq-mobile-startup")) return;

    if (isLoading) return;

    const splash = document.getElementById("mykliq-startup");
    if (!splash || splash.dataset.state === "ready") return;

    // A settled check includes signed-out/401 and offline failures. Always let
    // existing login, offline and error UI take over instead of trapping users.
    splash.dataset.state = "ready";
    const removeAfterFade = window.setTimeout(() => splash.remove(), 220);
    return () => window.clearTimeout(removeAfterFade);
  }, [isLoading]);

  return null;
}

function Navigation({ currentPath }: { currentPath: string }) {
  const { t } = useTranslation();
  useUiLanguage();
  const mobileNavigationRef = React.useRef<HTMLDivElement>(null);
  const desktopNavigationRef = React.useRef<HTMLDivElement>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingSettingsNavigation, setPendingSettingsNavigation] = useState(false);
  const { 
    isNotificationPanelOpen,
    getTotalUnreadCount,
    getMessageCount,
    getFriendRequestCount,
    getEventInviteCount,
    toggleNotificationPanel,
    closeNotificationPanel
  } = useNotifications();

  const navItems = [
    { path: "/profile", icon: User, label: t('navigation.profile'), tab: "profile" },
    { path: "/", icon: HomeIcon, label: t('navigation.headlines'), tab: "headlines" },
    { path: "/kliq", icon: Users, label: t('navigation.myKliq'), tab: "kliq", badgeType: "friends" as const },
    { path: "/messages", icon: MessageCircle, label: t('navigation.messages'), tab: "messages", badgeType: "messages" as const },
    { path: "/themes", icon: Palette, label: uiText("Themes"), tab: "themes" },
    { path: "/settings", icon: SettingsIcon, label: uiText("Settings"), tab: "settings" },
  ];

  const getBadgeCount = (badgeType?: "messages" | "friends" | "events") => {
    switch (badgeType) {
      case "messages": return getMessageCount();
      case "friends": return getFriendRequestCount();
      case "events": return getEventInviteCount();
      default: return 0;
    }
  };

  const [, navigate] = useLocation();

  React.useLayoutEffect(() => {
    const mobileNavigation = mobileNavigationRef.current;
    const desktopNavigation = desktopNavigationRef.current;
    if (!mobileNavigation || !desktopNavigation) return;

    const updateNavigationSpace = () => {
      const mobileWidth = mobileNavigation.getBoundingClientRect().width;
      const desktopHeight = desktopNavigation.getBoundingClientRect().height;
      // Measure intrinsic navigation, not a width derived from this variable:
      // longer AND shorter translations must resize without a feedback loop.
      if (mobileWidth > 0) {
        document.documentElement.style.setProperty(
          "--mykliq-mobile-nav-width",
          `${Math.ceil(mobileWidth)}px`,
        );
      }
      if (desktopHeight > 0) {
        document.documentElement.style.setProperty(
          "--mykliq-desktop-nav-space",
          `${Math.ceil(desktopHeight + 40)}px`,
        );
      }
    };

    updateNavigationSpace();
    const observer = new ResizeObserver(updateNavigationSpace);
    [mobileNavigation, desktopNavigation].forEach((navigation) => {
      observer.observe(navigation);
      navigation.querySelectorAll("button, span").forEach((element) => observer.observe(element));
    });
    window.addEventListener("resize", updateNavigationSpace);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavigationSpace);
      document.documentElement.style.removeProperty("--mykliq-mobile-nav-width");
      document.documentElement.style.removeProperty("--mykliq-desktop-nav-space");
    };
  }, []);

  const handleNavigation = (path: string, requiresPin: boolean = false) => {
    if (requiresPin && path === "/settings") {
      setPendingSettingsNavigation(true);
      setShowPinModal(true);
    } else {
      navigate(path);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (pendingSettingsNavigation) {
      setPendingSettingsNavigation(false);
      navigate("/settings");
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPendingSettingsNavigation(false);
  };

  return (
    <>
      {/* ── Left Side Navigation (mobile only, hidden on desktop) ── */}
      <div ref={mobileNavigationRef} className="mobile-navigation-rail fixed left-0 top-0 bottom-0 bg-card border-r-2 border-primary z-50 md:hidden">
        <div className="flex flex-col items-center py-3 min-h-full h-max">
          {/* Notification Bell */}
          <button
            onClick={toggleNotificationPanel}
            className={cn(
              "mobile-navigation-item flex flex-col items-center p-2 mb-4 transition-colors rounded-lg min-h-11 relative flex-shrink-0",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="notification-bell"
          >
            {getTotalUnreadCount() > 0 && (
              <div className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[10px] text-destructive-foreground font-bold">
                  {getTotalUnreadCount() > 99 ? `${formatDisplayNumber(99)}+` : formatDisplayNumber(getTotalUnreadCount())}
                </span>
              </div>
            )}
            <Bell className="w-6 h-6" />
            <span className="main-navigation-caption text-[11px] mt-0.5">{t('navigation.alerts')}</span>
          </button>

          <div className="mobile-navigation-destinations flex flex-1 flex-col items-center justify-evenly w-full">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const badgeCount = getBadgeCount(item.badgeType);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path, item.path === "/settings")}
                  className={cn(
                    "mobile-navigation-item flex flex-col items-center p-2 transition-colors rounded-lg min-h-11 relative flex-shrink-0",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  data-testid={`nav-${item.tab}`}
                >
                  {item.badgeType && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <NotificationBadge type={item.badgeType} showIcon={false} showCount={true} className={cn("h-5 w-5", item.badgeType === "messages" && "-right-0.5")} />
                    </div>
                  )}
                  <item.icon className="w-6 h-6" />
                  <span className="main-navigation-caption text-[11px] mt-0.5 text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Language Selector at bottom */}
          <div className="mt-auto mb-4 flex justify-center">
            <LanguageSelector variant="dropdown" />
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Bar (desktop only, hidden on mobile) ── */}
      <div ref={desktopNavigationRef} className="desktop-navigation-bar hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[760px] bg-card border-2 border-primary rounded-[2rem] shadow-xl z-50 items-center justify-center px-4">
        {/* Notification Bell */}
        <button
          onClick={toggleNotificationPanel}
          className={cn(
            "desktop-navigation-item flex flex-col items-center px-3 py-1 transition-colors rounded-lg relative min-w-12",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          data-testid="notification-bell-desktop"
        >
          {getTotalUnreadCount() > 0 && (
            <div className="absolute top-0 right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-[10px] text-destructive-foreground font-bold">
                {getTotalUnreadCount() > 99 ? `${formatDisplayNumber(99)}+` : formatDisplayNumber(getTotalUnreadCount())}
              </span>
            </div>
          )}
          <Bell className="w-6 h-6" />
          <span className="main-navigation-caption text-[11px] mt-0.5">{t('navigation.alerts')}</span>
        </button>

        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path, item.path === "/settings")}
              className={cn(
                "desktop-navigation-item flex flex-col items-center px-3 py-1 transition-colors rounded-lg relative min-w-12",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid={`nav-${item.tab}-desktop`}
            >
              {item.badgeType && (
                <div className="absolute top-0 right-1">
                  <NotificationBadge type={item.badgeType} showIcon={false} showCount={true} className="h-5 w-5" />
                </div>
              )}
              <item.icon className="w-6 h-6" />
              <span className="main-navigation-caption text-[11px] mt-0.5 text-center">{item.label}</span>
            </button>
          );
        })}

        {/* Language Selector */}
        <div className="desktop-navigation-item flex items-center">
          <LanguageSelector variant="dropdown" />
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={closeNotificationPanel} 
      />
      
      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onSuccess={handlePinSuccess}
        title="Settings Access"
        description="Please enter your 4-digit PIN to access settings for additional security."
      />
    </>
  );
}

function Router() {
  useUiLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  console.log(isAuthenticated, "--->isAuth");
  
  // Show loading spinner while checking auth state on root path
  // This prevents the Landing page from flashing before redirect to Home
  if (isLoading && location === "/") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{uiText("Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/child-safety" component={ChildSafety} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/advertiser-requirements" component={AdvertiserRequirements} />
      <Route path="/advertiser-onboarding" component={AdvertiserOnboarding} />

      <Route path="/landing" component={Landing} />
      <Route path="/signup*" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* Admin routes - accessible without authentication for emergency access */}
      <Route path="/support-admin" component={AdminPage} />
      <Route path="/rules-reports" component={AdminReports} />
      <Route path="/post/:postId">
        {(params) => sessionStorage.getItem("adminPassword")
          ? <PostView />
          : <Redirect to={`/?post=${encodeURIComponent(params.postId)}`} />}
      </Route>
      <Route path="/ads-manager" component={AdsManager} />
      <Route path="/moviecon-manager" component={MovieconManagerPage} />
      <Route path="/meme-manager" component={MemeManagerPage} />
      <Route path="/maintenance" component={MaintenanceDashboard} />
      
      {/* NOT AUTHENTICATED → Show Landing */}
      {!isAuthenticated && (
        <Route exact path="/" component={Landing} />
      )}
    
      {/* AUTHENTICATED ROUTES */}
      {isAuthenticated && (
        <>
          <Route exact path="/" component={Home} />
          <Route path="/kliq" component={Kliq} />
          <Route path="/events" component={Events} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/actions" component={Actions} />
          <Route path="/messages" component={Messages} />
          <Route path="/messages/:conversationId" component={Conversation} />
          <Route path="/group-chat/:groupChatId" component={GroupChat} />
          <Route path="/profile" component={Profile} />
          <Route path="/user/:userId" component={UserProfile} />
          <Route path="/themes" component={Themes} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath] = useLocation();
  const realtimeUserId = (user as any)?.id as string | undefined;

  // Keep the shared live connection on every signed-in screen, not just Headlines.
  useEffect(() => {
    if (!isAuthenticated || isLoading || !realtimeUserId) return;
    const handleVisibility = () => {
      if (document.hidden) feedRealtimeService.pause();
      else feedRealtimeService.resume(realtimeUserId);
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      feedRealtimeService.pause();
    };
  }, [isAuthenticated, isLoading, realtimeUserId]);
  
  // Load and apply user theme globally
  useTheme();
  
  // Perform daily check-in for authenticated users
  useDailyCheckIn();
  
  // Update PWA app icon badge with unread notification count
  useAppBadge();
  
  // Initialize Google Analytics ONLY if user has granted consent (GDPR compliance)
  // Users grant consent during sign-up (default true) but can revoke in Settings
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      // Check if user has analytics consent enabled
      const hasConsent = (user as any).analyticsConsent !== false; // default true if undefined
      
      if (hasConsent) {
        // User has granted analytics consent
        import("@/services/analyticsService").then(({ analyticsService }) => {
          analyticsService.init();
        });
      } else {
        // User has revoked consent - ensure analytics is disabled
        import("@/services/analyticsService").then(({ analyticsService }) => {
          analyticsService.revokeConsent();
        });
      }
    }
  }, [isAuthenticated, isLoading, (user as any)?.analyticsConsent]);

  // On every cold startup, wipe the disk (IndexedDB) cache for high-churn endpoints.
  // These endpoints are now memory-only in enterpriseFetch, but old entries written by
  // previous sessions may still exist in IndexedDB and will be served by the SWR fallback,
  // causing stale theme/post data until the circuit breaker recovers (the "53 days" bug).
  useEffect(() => {
    const clearStaleStartupCache = async () => {
      await Promise.all([
        enhancedCache.removeByPattern('/api/kliq-feed'),
        enhancedCache.removeByPattern('/api/user/theme'),
        enhancedCache.removeByPattern('/api/auth/user'),
        enhancedCache.removeByPattern('/api/stories'),
        enhancedCache.removeByPattern('/api/posts'),
      ]);
    };
    clearStaleStartupCache().catch(() => {});
  }, []); // runs once on mount — before any queries fire

  // Force-refresh key data when app returns from background after 10+ minutes.
  // This clears stale circuit-breaker state and overrides any cached data
  // so users always see current posts and theme on cold open.
  useEffect(() => {
    let hiddenAt: number | null = null;
    const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt !== null) {
        const hiddenDuration = Date.now() - hiddenAt;
        if (hiddenDuration >= STALE_THRESHOLD) {
          // Also clear disk cache on long background — belt-and-suspenders
          enhancedCache.removeByPattern('/api/kliq-feed').catch(() => {});
          enhancedCache.removeByPattern('/api/user/theme').catch(() => {});
          enhancedCache.removeByPattern('/api/auth/user').catch(() => {});
          // Then invalidate React Query to trigger fresh fetches
          queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user/theme'] });
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check if we're on a public page that doesn't require authentication
  const isPublicPage = ['/signup', '/signup/', '/privacy-policy', '/disclaimer', '/landing', '/forgot-password'].includes(currentPath);

  return (
    <TooltipProvider>
      <div className="bg-background min-h-screen h-screen text-foreground">
        <OfflineBanner />
        {isAuthenticated && !isLoading && !isPublicPage && (
          <Navigation currentPath={currentPath} />
        )}
        
        {/* Main App Container with responsive margins */}
        <div className={cn(
          "min-h-screen h-screen bg-background relative",
          isAuthenticated && !isLoading && !isPublicPage ? "main-content-with-navigation" : ""
        )}>
          {/* Full Screen App Container with scroll */}
          <div id="main-scroll-container" className="w-full h-full relative overflow-y-auto overflow-x-hidden">
            {/* Animated Background Pattern - Don't show on signup page */}
            {!isPublicPage && (
              <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-8 w-16 h-16 bg-secondary rounded-full animate-bounce"></div>
                <div className="absolute bottom-20 left-6 w-12 h-12 bg-mykliq-green rounded-full animate-pulse"></div>
                <div className="absolute bottom-40 right-12 w-8 h-8 bg-mykliq-orange rounded-full animate-bounce"></div>
              </div>
            )}

            {/* Main Content with proper scrolling and mobile padding */}
            <div className={cn("relative z-10 min-h-full pb-20 md:pb-28", isAuthenticated && !isLoading && !isPublicPage && "navigation-content-safe-area")}>
              {(!isAuthenticated || isPublicPage) && (
                <div className="flex justify-end px-4 pt-2">
                  <LanguageSelector variant="dropdown" />
                </div>
              )}
              <Router />
            </div>
          </div>
        </div>
        
        {/* Chatbot - Only show when authenticated and not on public pages */}
        {isAuthenticated && !isLoading && !isPublicPage && <Chatbot />}
        
        {/* PWA Install Prompt */}
        <InstallPWA />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  // Web Enterprise Services Initialization (20k+ concurrent users)
  useEffect(() => {
    // Initialize enterprise optimizations for web
    // (Mobile analytics handled separately in mobile/src/App.tsx)
    initializeEnterpriseServices();
    
    // Initialize audio manager for call ringtones (unlocks on first user interaction)
    initAudioManager();

    // Cleanup on unmount
    return () => {
      cleanupEnterpriseServices();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <VideoCallProvider>
        <GroupVideoCallProvider>
          <StartupSplashHandoff />
          <AppContent />
          <IncomingCallOverlay />
          <VideoCallScreen />
          <IncomingGroupCallOverlay />
          <GroupVideoCallScreen />
        </GroupVideoCallProvider>
      </VideoCallProvider>
    </QueryClientProvider>
  );
}

export default App;
