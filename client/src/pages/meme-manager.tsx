import { useQuery } from "@tanstack/react-query";
import { MemeUploader } from "@/components/MemeUploader";
import type { Meme } from "@shared/schema";

export function MemeManagerPage() {
  const { data: memes = [], refetch } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="meme-manager-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
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