import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemeEditor } from "@/components/theme-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { enterpriseFetch } from "@/lib/enterprise/enterpriseFetch";
import Footer from "@/components/Footer";

export default function Themes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user theme - disable disk cache to prevent stale data after saves
  const { data: theme, isLoading, isFetching, isError } = useQuery({
    queryKey: ["/api/user/theme"],
    queryFn: async () => {
      return enterpriseFetch("/api/user/theme", {
        skipDisk: true, // CRITICAL: Skip disk cache completely to prevent stale themes
      });
    },
  });

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      const response = await apiRequest("POST", "/api/user/theme", themeData);
      return response;
    },
    onSuccess: async (savedTheme) => {
      // Clear disk cache to prevent stale data on refresh
      const { enhancedCache } = await import("@/lib/enterprise/enhancedCache");
      await enhancedCache.remove("/api/user/theme|method:GET");
      
      // Immediately update TanStack Query cache with the saved theme
      queryClient.setQueryData(["/api/user/theme"], savedTheme);
      
      toast({
        title: "Theme saved!",
        description: "Your customization has been applied",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save theme",
        variant: "destructive",
      });
    },
  });

  const handleSaveTheme = (themeData: any) => {
    saveThemeMutation.mutate(themeData);
  };

  const handleResetTheme = () => {
    const defaultTheme = {
      primaryColor: "#FF1493",
      secondaryColor: "#00BFFF",
      fontFamily: "comic",
      fontColor: "#FFFFFF",
      navBgColor: "#1F2937",
      navActiveColor: "#FF1493",
      borderStyle: "modern",
      enableSparkles: true,
    };
    
    saveThemeMutation.mutate(defaultTheme);
  };

  // Helper function to determine if a color is light or dark
  const isLightColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  // Generate random hex color
  const getRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  // Generate contrasting text color for readability
  const getContrastingTextColor = (backgroundColor: string) => {
    return isLightColor(backgroundColor) ? "#000000" : "#FFFFFF";
  };

  const handleSurpriseMe = () => {
    const primaryColor = getRandomColor();
    const secondaryColor = getRandomColor();
    
    // Random background type
    const backgroundTypes = ['solid', 'gradient', 'pattern'];
    const backgroundType = backgroundTypes[Math.floor(Math.random() * backgroundTypes.length)];
    
    let backgroundColor = "#000000";
    let backgroundGradientStart, backgroundGradientEnd, backgroundPattern;
    
    if (backgroundType === 'solid') {
      backgroundColor = getRandomColor();
    } else if (backgroundType === 'gradient') {
      backgroundGradientStart = getRandomColor();
      backgroundGradientEnd = getRandomColor();
      // Use the start color to determine text contrast
      backgroundColor = backgroundGradientStart;
    } else if (backgroundType === 'pattern') {
      backgroundColor = getRandomColor();
      const patterns = ['dots', 'lines', 'waves', 'geometric'];
      backgroundPattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    const fontFamilies = ['comic', 'helvetica', 'times', 'impact'];
    const borderStyles = ['retro', 'modern'];
    
    const randomTheme = {
      primaryColor,
      secondaryColor,
      fontFamily: fontFamilies[Math.floor(Math.random() * fontFamilies.length)],
      fontColor: getContrastingTextColor(backgroundColor),
      navBgColor: getRandomColor(),
      navActiveColor: primaryColor,
      borderStyle: borderStyles[Math.floor(Math.random() * borderStyles.length)],
      enableSparkles: Math.random() > 0.5,
      backgroundType,
      backgroundColor: backgroundType === 'solid' ? backgroundColor : undefined,
      backgroundGradientStart,
      backgroundGradientEnd,
      backgroundPattern,
    };
    
    saveThemeMutation.mutate(randomTheme);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-6">
          <div className="w-48 h-6 bg-gray-600 rounded mx-auto"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6">
              <div className="w-32 h-4 bg-gray-600 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="w-full h-10 bg-gray-600 rounded"></div>
                <div className="w-full h-10 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <ThemeEditor
        theme={theme as any}
        onSave={handleSaveTheme}
        onReset={handleResetTheme}
        onSurpriseMe={handleSurpriseMe}
        isSaving={saveThemeMutation.isPending}
        isFetching={isFetching}
        isError={isError}
      />

      <Footer />
    </div>
  );
}
