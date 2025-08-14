import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemeEditor } from "@/components/theme-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Themes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user theme
  const { data: theme, isLoading } = useQuery({
    queryKey: ["/api/user/theme"],
  });

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      await apiRequest("POST", "/api/user/theme", themeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/theme"] });
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
      borderStyle: "retro",
      enableSparkles: true,
    };
    
    saveThemeMutation.mutate(defaultTheme);
  };

  if (isLoading) {
    return (
      <div className="p-4 pb-20">
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
    <div className="p-4">
      <ThemeEditor
        theme={theme as any}
        onSave={handleSaveTheme}
        onReset={handleResetTheme}
      />
    </div>
  );
}
