import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function Footer() {
  const [textColor, setTextColor] = useState("text-black");

  // Fetch user theme to determine background color with aggressive caching
  const { data: theme } = useQuery({
    queryKey: ["/api/user/theme"],
    enabled: false, // Temporarily disable this query to stop API spam
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Never garbage collect
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: false, // Disable automatic refetching
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  useEffect(() => {
    if (theme && typeof theme === 'object' && 'backgroundColor' in theme && theme.backgroundColor) {
      // Check if background is black or very dark
      const backgroundColor = theme.backgroundColor as string;
      const isBlackBackground = backgroundColor === "#000000" || 
                               backgroundColor === "black" ||
                               (backgroundColor.startsWith('#') && 
                                parseInt(backgroundColor.slice(1), 16) < 0x333333);
      
      setTextColor(isBlackBackground ? "text-white" : "text-black");
    } else {
      setTextColor("text-black");
    }
  }, [theme]);

  return (
    <footer className="mt-12 pt-8 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className={`flex flex-col md:flex-row justify-between items-center gap-4 text-sm ${textColor}`}>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="font-medium">© 2025 MyKliq</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:opacity-75 transition-opacity">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="hover:opacity-75 transition-opacity">
                Disclaimer
              </Link>
              <Link href="/community-guidelines" className="hover:opacity-75 transition-opacity">
                Community Guidelines
              </Link>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="max-w-md">
              By using MyKliq, you agree to our terms of service and privacy policy. 
              Content shared is subject to community guidelines.
            </p>
          </div>
        </div>
        
        {/* Futureshock Holdings Link */}
        <div className={`text-center mt-4 pt-4 border-t border-border ${textColor}`}>
          <a 
            href="https://futureshockholdings.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm hover:opacity-75 transition-opacity"
          >
            Owned and Operated by Futureshock Holdings, LLC
          </a>
        </div>
      </div>
    </footer>
  );
}