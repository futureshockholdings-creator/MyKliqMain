import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Kliq from "@/pages/kliq";
import Profile from "@/pages/profile";
import Themes from "@/pages/themes";
import NotFound from "@/pages/not-found";

// Navigation Component
import { Home as HomeIcon, Users, User, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

function Navigation({ currentPath }: { currentPath: string }) {
  const navItems = [
    { path: "/", icon: HomeIcon, label: "Feed", tab: "feed" },
    { path: "/kliq", icon: Users, label: "My Kliq", tab: "kliq" },
    { path: "/profile", icon: User, label: "Profile", tab: "profile" },
    { path: "/themes", icon: Palette, label: "Themes", tab: "themes" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-gray-800 border-t-2 border-pink-500 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center p-2 transition-colors",
                isActive ? "text-pink-400" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </a>
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
  
  // Get current path for navigation
  const currentPath = window.location.pathname;

  return (
    <TooltipProvider>
      <div className="bg-black min-h-screen text-white">
        {/* Mobile App Container */}
        <div className="max-w-sm mx-auto bg-gray-900 min-h-screen relative overflow-hidden">
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

          {/* Navigation - Only show when authenticated */}
          {isAuthenticated && !isLoading && (
            <Navigation currentPath={currentPath} />
          )}
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
