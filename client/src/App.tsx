import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Kliq from "@/pages/kliq";
import Events from "@/pages/events";
import Actions from "@/pages/actions";
import Profile from "@/pages/profile";
import Themes from "@/pages/themes";
import NotFound from "@/pages/not-found";
import { Messages } from "@/pages/messages";
import { Conversation } from "@/pages/conversation";

// Navigation Component
import { Home as HomeIcon, Users, Calendar, User, Palette, MessageCircle, Video } from "lucide-react";
import { cn } from "@/lib/utils";

function Navigation({ currentPath }: { currentPath: string }) {
  const navItems = [
    { path: "/", icon: HomeIcon, label: "Feed", tab: "feed" },
    { path: "/kliq", icon: Users, label: "My Kliq", tab: "kliq" },
    { path: "/events", icon: Calendar, label: "Events", tab: "events" },
    { path: "/actions", icon: Video, label: "Action", tab: "actions" },
    { path: "/messages", icon: MessageCircle, label: "IM", tab: "messages" },
    { path: "/profile", icon: User, label: "Profile", tab: "profile" },
    { path: "/themes", icon: Palette, label: "Themes", tab: "themes" },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 bg-gray-800 border-r-2 border-pink-500 z-50 w-20">
      <div className="flex flex-col items-center py-4 h-full">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center p-3 mb-4 transition-colors rounded-lg w-16",
                isActive ? "text-pink-400 bg-pink-400/10" : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              )}
              data-testid={`nav-${item.tab}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
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
          <Route path="/themes" component={Themes} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath] = useLocation();

  return (
    <TooltipProvider>
      <div className="bg-black min-h-screen text-white">
        {/* Navigation - Only show when authenticated */}
        {isAuthenticated && !isLoading && (
          <Navigation currentPath={currentPath} />
        )}
        
        {/* Main App Container with left margin for navigation */}
        <div className={cn(
          "min-h-screen bg-gray-900 relative overflow-hidden",
          isAuthenticated && !isLoading ? "ml-20" : ""
        )}>
          {/* Mobile App Container */}
          <div className="max-w-sm mx-auto min-h-screen relative">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 bg-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute top-32 right-8 w-16 h-16 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="absolute bottom-20 left-6 w-12 h-12 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute bottom-40 right-12 w-8 h-8 bg-yellow-500 rounded-full animate-bounce"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
              <Router />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
