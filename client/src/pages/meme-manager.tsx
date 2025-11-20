import { useQuery } from "@tanstack/react-query";
import { MemeUploader } from "@/components/MemeUploader";
import type { Meme } from "@shared/schema";

export function MemeManagerPage() {
  const { data: memes = [], refetch } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="meme-manager-page">
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Meme Manager
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your memes that users can add to their posts and messages
            </p>
          </div>

          <MemeUploader 
            memes={memes} 
            onRefresh={() => refetch()} 
          />
        </div>
      </div>
    </div>
  );
}