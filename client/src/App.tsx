import React, { useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import { useTranslation } from "react-i18next";
import "./i18n/config"; // Initialize i18n
import { initializeEnterpriseServices, cleanupEnterpriseServices } from "@/lib/enterprise/enterpriseInit";

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
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import AdminPage from "@/pages/admin";
import AdminReports from "@/pages/admin-reports";
import Marketing from "@/pages/marketing";

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
import { useState } from "react";

function Navigation({ currentPath }: { currentPath: string }) {
  const { t } = useTranslation();
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
    { path: "/themes", icon: Palette, label: "Themes", tab: "themes" },
    { path: "/settings", icon: SettingsIcon, label: "Settings", tab: "settings" },
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
      {/* Left Side Navigation */}
      <div className="fixed left-0 top-0 bottom-0 bg-card border-r-2 border-primary z-50 w-20">
        <div className="flex flex-col items-center py-4 h-full">
          {/* Notification Bell */}
          <button
            onClick={toggleNotificationPanel}
            className={cn(
              "flex flex-col items-center p-3 mb-6 transition-colors rounded-lg w-16 relative",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="notification-bell"
          >
            {getTotalUnreadCount() > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[10px] text-destructive-foreground font-bold">
                  {getTotalUnreadCount() > 99 ? "99+" : getTotalUnreadCount()}
                </span>
              </div>
            )}
            <Bell className="w-6 h-6" />
            <span className="text-xs mt-1">{t('navigation.alerts')}</span>
          </button>

          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const badgeCount = getBadgeCount(item.badgeType);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path, item.path === "/settings")}
                className={cn(
                  "flex flex-col items-center p-3 mb-4 transition-colors rounded-lg w-16 relative",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`nav-${item.tab}`}
              >
                {item.badgeType && (
                  <div className="absolute -top-1 -right-1">
                    <NotificationBadge type={item.badgeType} showIcon={false} showCount={true} className={cn("h-5 w-5", item.badgeType === "messages" && "-right-0.5")} />
                  </div>
                )}
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1 text-center leading-tight break-words whitespace-pre-line max-w-14">{item.label}</span>
              </button>
            );
          })}
          
          {/* Language Selector at bottom */}
          <div className="mt-auto mb-4 flex justify-center">
            <LanguageSelector variant="dropdown" className="max-w-16 min-w-12" />
          </div>
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
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/landing" component={Landing} />
      <Route path="/marketing" component={Marketing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* Admin routes - accessible without authentication for emergency access */}
      <Route path="/support-admin" component={AdminPage} />
      <Route path="/rules-reports" component={AdminReports} />
      <Route path="/ads-manager" component={AdsManager} />
      <Route path="/moviecon-manager" component={MovieconManagerPage} />
      <Route path="/meme-manager" component={MemeManagerPage} />
      <Route path="/maintenance" component={MaintenanceDashboard} />
      
      {/* Protected routes - require authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
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
  
  // Load and apply user theme globally
  useTheme();
  
  // Perform daily check-in for authenticated users
  useDailyCheckIn();
  
  // Initialize Google Analytics ONLY if user has granted consent (GDPR compliance)
  // Users grant consent during sign-up (default true) but can revoke in Settings
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      // Check if user has analytics consent enabled
      const hasConsent = user.analyticsConsent !== false; // default true if undefined
      
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
  }, [isAuthenticated, isLoading, user?.analyticsConsent]);

  // Check if we're on a public page that doesn't require authentication
  const isPublicPage = ['/signup', '/privacy-policy', '/disclaimer', '/landing', '/marketing', '/forgot-password'].includes(currentPath);

  return (
    <TooltipProvider>
      <div className="bg-background min-h-screen h-screen text-foreground">
        {/* Navigation - Only show when authenticated and not on public pages */}
        {isAuthenticated && !isLoading && !isPublicPage && (
          <Navigation currentPath={currentPath} />
        )}
        
        {/* Main App Container with responsive margins */}
        <div className={cn(
          "min-h-screen h-screen bg-background relative",
          isAuthenticated && !isLoading && !isPublicPage ? "ml-20 w-[calc(100vw-5rem)]" : ""
        )}>
          {/* Full Screen App Container with scroll */}
          <div className="w-full h-full relative overflow-y-auto overflow-x-hidden">
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
            <div className="relative z-10 min-h-full pb-20 md:pb-4">
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

    // Cleanup on unmount
    return () => {
      cleanupEnterpriseServices();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
