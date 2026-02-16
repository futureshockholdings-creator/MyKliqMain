import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Video } from "lucide-react";

interface VideoThumbnailProps {
  src: string;
  className?: string;
  onClick?: () => void;
  posterUrl?: string;
}

export function VideoThumbnail({ src, className = "", onClick, posterUrl }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(posterUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailVideoRef = useRef<HTMLVideoElement | null>(null);
  const listenersRef = useRef<{ event: string; handler: () => void }[]>([]);

  const generateThumbnail = useCallback(() => {
    const video = document.createElement("video");
    thumbnailVideoRef.current = video;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.src = "";
      video.load();
    };

    const onLoadedData = () => {
      video.currentTime = 0.5;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          if (dataUrl && dataUrl !== "data:,") {
            setThumbnailUrl(dataUrl);
            setThumbnailReady(true);
            cleanup();
            return;
          }
        }
      } catch (e) {
        // CORS prevented canvas capture - fall through to fallback
      }
      setThumbnailReady(true);
      cleanup();
    };

    const onError = () => {
      setThumbnailReady(true);
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    listenersRef.current = [
      { event: "loadeddata", handler: onLoadedData },
      { event: "seeked", handler: onSeeked },
      { event: "error", handler: onError },
    ];

    video.src = src;
    video.load();
  }, [src]);

  useEffect(() => {
    if (posterUrl) {
      setThumbnailUrl(posterUrl);
      setThumbnailReady(true);
      return;
    }
    generateThumbnail();
    return () => {
      if (thumbnailVideoRef.current) {
        listenersRef.current.forEach(({ event, handler }) => {
          thumbnailVideoRef.current?.removeEventListener(event, handler);
        });
        thumbnailVideoRef.current.src = "";
        thumbnailVideoRef.current.load();
        thumbnailVideoRef.current = null;
      }
      listenersRef.current = [];
    };
  }, [generateThumbnail, posterUrl]);

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 100);
  };

  if (isPlaying) {
    return (
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${className}`}
        controls
        playsInline
        autoPlay
        src={src}
        onEnded={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full cursor-pointer ${className}`}
      onClick={onClick || handlePlay}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <Video className="w-10 h-10 text-gray-400" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Play className="w-7 h-7 text-black ml-0.5" />
        </div>
      </div>
    </div>
  );
}
