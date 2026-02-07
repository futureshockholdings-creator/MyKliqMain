import { useState, useEffect, useCallback, useRef } from "react";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const totalItems = media.length;

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

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element for restoration on close
    previousActiveElement.current = document.activeElement;

    // Focus the close button for accessibility
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previous element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, goToNext, goToPrev]);

  // Handle backdrop click - only close if clicking directly on the backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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

  if (!isOpen || totalItems === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer, showing image ${currentIndex + 1} of ${totalItems}`}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        height: '100dvh',
        width: '100dvw',
      }}
      onClick={handleBackdropClick}
    >
      {/* Close button - top center */}
      <Button
        ref={closeButtonRef}
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close image viewer"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Image counter - top right */}
      {totalItems > 1 && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium z-10">
          {currentIndex + 1} / {totalItems}
        </div>
      )}

      {/* Main content area */}
      <div
        className="relative flex items-center justify-center w-full h-full p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentMedia.mediaType === "video" ? (
          <video
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100dvh - 120px)' }}
            controls
            autoPlay
            playsInline
            preload="metadata"
            src={resolveUrl(currentMedia.mediaUrl)}
          />
        ) : (
          <img
            src={resolveUrl(currentMedia.mediaUrl)}
            alt={`Image ${currentIndex + 1} of ${totalItems}`}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100dvh - 120px)' }}
          />
        )}

        {/* Navigation arrows - inside content area */}
        {totalItems > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white"
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
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}
      </div>

      {/* Dots navigation - bottom center */}
      {totalItems > 1 && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-full bg-black/60 z-10" 
          role="tablist" 
          aria-label="Image navigation"
          onClick={(e) => e.stopPropagation()}
        >
          {media.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`View image ${index + 1} of ${totalItems}`}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
