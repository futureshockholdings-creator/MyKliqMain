import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  displayOrder?: number;
}

interface ImageViewerProps {
  media: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  resolveUrl?: (url: string) => string;
}

export function ImageViewer({
  media,
  initialIndex = 0,
  isOpen,
  onClose,
  resolveUrl = (url) => url,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalItems = media.length;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const goToNext = useCallback(() => {
    if (totalItems > 1) {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }
  }, [totalItems]);

  const goToPrev = useCallback(() => {
    if (totalItems > 1) {
      setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    }
  }, [totalItems]);

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || totalItems === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={handleBackdropClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
      >
        <X className="w-6 h-6" />
      </Button>

      {totalItems > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
          {currentIndex + 1} / {totalItems}
        </div>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-4">
        {currentMedia.mediaType === "video" ? (
          <video
            className="max-w-full max-h-full object-contain"
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
          >
            <source src={resolveUrl(currentMedia.mediaUrl)} type="video/mp4" />
          </video>
        ) : (
          <img
            src={resolveUrl(currentMedia.mediaUrl)}
            alt={`Image ${currentIndex + 1} of ${totalItems}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {totalItems > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
