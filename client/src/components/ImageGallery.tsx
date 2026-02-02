import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  displayOrder?: number;
}

interface ImageGalleryProps {
  media: MediaItem[];
  fallbackUrl?: string | null;
  fallbackType?: "image" | "video" | null;
  className?: string;
  resolveUrl?: (url: string) => string;
}

export function ImageGallery({ 
  media, 
  fallbackUrl, 
  fallbackType,
  className = "",
  resolveUrl = (url) => url 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allMedia: MediaItem[] = media.length > 0 
    ? media.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : fallbackUrl 
      ? [{ mediaUrl: fallbackUrl, mediaType: fallbackType || "image" }]
      : [];

  const totalItems = allMedia.length;

  useEffect(() => {
    if (currentIndex >= totalItems && totalItems > 0) {
      setCurrentIndex(totalItems - 1);
    }
  }, [totalItems, currentIndex]);

  if (totalItems === 0) return null;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && totalItems > 1) {
      goToNext();
    }
    if (isRightSwipe && totalItems > 1) {
      goToPrev();
    }
  };

  const currentMedia = allMedia[currentIndex];

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video bg-muted rounded-lg overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {currentMedia.mediaType === 'video' ? (
        <video 
          className="w-full h-full object-cover" 
          controls
          playsInline
        >
          <source src={resolveUrl(currentMedia.mediaUrl)} type="video/mp4" />
        </video>
      ) : (
        <img 
          src={resolveUrl(currentMedia.mediaUrl)} 
          alt={`Media ${currentIndex + 1} of ${totalItems}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {totalItems > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
            {currentIndex + 1}/{totalItems}
          </div>
        </>
      )}
    </div>
  );
}
