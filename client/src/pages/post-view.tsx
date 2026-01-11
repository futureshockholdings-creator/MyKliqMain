import { useQuery } from "@tanstack/react-query";
import { useRoute, useSearch } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertTriangle } from "lucide-react";
import { buildApiUrl } from "@/lib/apiConfig";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { MemeDisplay } from "@/components/MemeDisplay";
import { MovieconDisplay } from "@/components/MovieconDisplay";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";

export default function PostView() {
  const [, params] = useRoute("/post/:postId");
  const postId = params?.postId;
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const password = urlParams.get("p") || "";

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/posts", postId, password],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl(`/api/posts/${postId}?password=${encodeURIComponent(password)}`)
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch post");
      }
      return response.json();
    },
    enabled: !!postId && !!password,
  });

  if (isLoading) {
    return (
      <ForcedLightSurface className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </ForcedLightSurface>
    );
  }

  if (error) {
    return (
      <ForcedLightSurface className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load post</h2>
          <p className="text-gray-600">{(error as Error).message}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure you're logged in as an admin with the correct password.
          </p>
        </div>
      </ForcedLightSurface>
    );
  }

  if (!post) {
    return (
      <ForcedLightSurface className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Post not found</h2>
          <p className="text-gray-600">This post may have been deleted.</p>
        </div>
      </ForcedLightSurface>
    );
  }

  return (
    <ForcedLightSurface className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Post Review</h1>
        <p className="text-sm text-gray-500 mb-6">Post ID: {postId}</p>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={resolveAssetUrl(post.author?.profileImageUrl)} />
                <AvatarFallback>
                  {post.author?.firstName?.[0] || "?"}
                  {post.author?.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {post.author?.firstName} {post.author?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.content && (
              <p className="text-lg">{post.content}</p>
            )}

            {post.mediaUrl && (
              <div className="rounded-lg overflow-hidden">
                {post.mediaType === "video" ? (
                  <video
                    src={resolveAssetUrl(post.mediaUrl)}
                    controls
                    className="w-full max-h-96 object-contain bg-black"
                  />
                ) : (
                  <img
                    src={resolveAssetUrl(post.mediaUrl)}
                    alt="Post media"
                    className="w-full max-h-96 object-contain"
                  />
                )}
              </div>
            )}

            {post.meme && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Meme: {post.meme.title}</p>
                <MemeDisplay meme={post.meme} className="max-w-md" />
              </div>
            )}

            {post.moviecon && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Moviecon: {post.moviecon.title}</p>
                <MovieconDisplay moviecon={post.moviecon} className="max-w-md" />
              </div>
            )}

            {!post.content && !post.mediaUrl && !post.meme && !post.moviecon && (
              <p className="text-gray-500 italic">This post has no visible content.</p>
            )}

            <div className="pt-4 border-t text-sm text-gray-500">
              <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
              {post.mood && <p>Mood: {post.mood}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </ForcedLightSurface>
  );
}
