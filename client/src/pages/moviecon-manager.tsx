import { useQuery } from "@tanstack/react-query";
import { MovieconUploader } from "@/components/MovieconUploader";

interface Moviecon {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}

export function MovieconManagerPage() {
  const { data: moviecons = [], refetch } = useQuery<Moviecon[]>({
    queryKey: ["/api/moviecons"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="moviecon-manager-page">
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Moviecon Manager
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your video clips (moviecons) that users can add to their posts
            </p>
          </div>

          <MovieconUploader 
            moviecons={moviecons} 
            onRefresh={() => refetch()} 
          />
        </div>
      </div>
    </div>
  );
}