import React, { useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useTranslation } from "react-i18next";
import "./i18n/config"; // Initialize i18n

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Kliq from "@/pages/kliq";
import Events from "@/pages/events";
import Actions from "@/pages/actions";
import MeetupPage from "@/pages/meetup";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import Themes from "@/pages/themes";
import NotFound from "@/pages/not-found";
import { Messages } from "@/pages/messages";
import { Conversation } from "@/pages/conversation";
import { MovieconManagerPage } from "@/pages/moviecon-manager";
import MaintenanceDashboard from "@/pages/maintenance-dashboard";
import AdsManager from "@/pages/ads-manager";
import Settings from "@/pages/settings";
import PrivacyPolicy from "./pages/privacy-policy";
import Disclaimer from "./pages/disclaimer";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import AdminPage from "@/pages/admin";
import Marketing from "@/pages/marketing";

// Navigation Component
import { Home as HomeIcon, Users, Calendar, User, Palette, MessageCircle, Video, MapPin, Bell, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/NotificationBadge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { Chatbot } from "@/components/Chatbot";
import { LanguageSelector } from "@/components/LanguageSelector";

function Navigation({ currentPath }: { currentPath: string }) {
  const { t } = useTranslation();
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
    { path: "/events", icon: Calendar, label: t('navigation.events'), tab: "events", badgeType: "events" as const },
    { path: "/actions", icon: Video, label: "Action", tab: "actions" },
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

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 bg-card border-r-2 border-primary z-50 w-20">
        <div className="flex flex-col items-center py-4 h-full">
          {/* Notification Bell at the top */}
          <button
            onClick={toggleNotificationPanel}
            className={cn(
              "flex flex-col items-center p-3 mb-6 transition-colors rounded-lg w-16 relative",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="notification-bell"
          >
            {getTotalUnreadCount() > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-xs text-destructive-foreground font-bold">
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
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center p-3 mb-4 transition-colors rounded-lg w-16 relative",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`nav-${item.tab}`}
              >
                {item.badgeType && getBadgeCount(item.badgeType) > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-destructive-foreground font-bold">
                      {getBadgeCount(item.badgeType) > 9 ? "9+" : getBadgeCount(item.badgeType)}
                    </span>
                  </div>
                )}
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1 text-center leading-tight break-words whitespace-pre-line max-w-14">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Language Selector at bottom */}
          <div className="mt-auto mb-4">
            <LanguageSelector variant="dropdown" className="w-16" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-primary z-50 h-16">
        <div className="flex items-center justify-around h-full px-2">
          {/* Notification Bell */}
          <button
            onClick={toggleNotificationPanel}
            className={cn(
              "flex flex-col items-center p-2 transition-colors rounded-lg relative",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="notification-bell-mobile"
          >
            {getTotalUnreadCount() > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[10px] text-destructive-foreground font-bold">
                  {getTotalUnreadCount() > 99 ? "99+" : getTotalUnreadCount()}
                </span>
              </div>
            )}
            <Bell className="w-5 h-5" />
          </button>

          {navItems.slice(0, 7).map((item) => {
            const isActive = currentPath === item.path;
            const badgeCount = getBadgeCount(item.badgeType);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center p-2 transition-colors rounded-lg relative",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`nav-mobile-${item.tab}`}
              >
                {item.badgeType && getBadgeCount(item.badgeType) > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-destructive-foreground font-bold">
                      {getBadgeCount(item.badgeType) > 9 ? "9+" : getBadgeCount(item.badgeType)}
                    </span>
                  </div>
                )}
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 text-center leading-tight break-words whitespace-pre-line max-w-12">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={closeNotificationPanel} 
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
      <Route path="/landing" component={Landing} />
      <Route path="/marketing" component={Marketing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* Admin routes - accessible without authentication for emergency access */}
      <Route path="/admin" component={AdminPage} />
      <Route path="/ads-manager" component={AdsManager} />
      <Route path="/moviecon-manager" component={MovieconManagerPage} />
      <Route path="/maintenance" component={MaintenanceDashboard} />
      
      {/* Protected routes - require authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/kliq" component={Kliq} />
          <Route path="/events" component={Events} />
          <Route path="/actions" component={Actions} />

          <Route path="/messages" component={Messages} />
          <Route path="/messages/:conversationId" component={Conversation} />
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
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath] = useLocation();
  
  // Load and apply user theme globally
  useTheme();
  
  // Track page views for all pages (including public pages)
  useAnalytics();

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
          isAuthenticated && !isLoading && !isPublicPage ? "md:ml-20" : ""
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
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
