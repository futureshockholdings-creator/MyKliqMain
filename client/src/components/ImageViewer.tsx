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

  const scrollPositionRef = useRef(0);
  
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;
    
    // Capture scroll position IMMEDIATELY before any DOM changes
    scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    
    // iOS Safari compatible scroll lock - use overflow hidden instead of position fixed
    // This prevents the jump that occurs with position:fixed on iOS
    const scrollY = scrollPositionRef.current;
    
    // Store original styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyHeight = document.body.style.height;
    const originalTouchAction = document.body.style.touchAction;
    
    // Apply scroll lock - iOS Safari needs overflow on both html and body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    
    // Prevent touchmove on body to stop iOS momentum scrolling
    const preventTouchMove = (e: TouchEvent) => {
      // Allow scrolling within the modal itself but prevent body scroll
      const target = e.target as HTMLElement;
      if (!target.closest('[role="dialog"]')) {
        e.preventDefault();
      }
    };
    
    document.body.addEventListener('touchmove', preventTouchMove, { passive: false });
    
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

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
      // Remove event listeners first
      window.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener('touchmove', preventTouchMove);
      
      // Restore original styles
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.height = originalBodyHeight;
      document.body.style.touchAction = originalTouchAction;
      
      // Restore scroll position SYNCHRONOUSLY - critical for iOS Safari
      window.scrollTo(0, scrollY);
      
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, goToNext, goToPrev]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Image viewer, showing image ${currentIndex + 1} of ${totalItems}`}
        className="relative bg-black rounded-lg shadow-2xl max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Button
          ref={closeButtonRef}
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close image viewer"
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>

        {currentMedia.mediaType === "video" ? (
          <video
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
            controls
            autoPlay
            playsInline
          >
            <source src={resolveUrl(currentMedia.mediaUrl)} type="video/mp4" />
          </video>
        ) : (
          <img
            src={resolveUrl(currentMedia.mediaUrl)}
            alt={`Image ${currentIndex + 1} of ${totalItems}`}
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
          />
        )}

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
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 rounded-full bg-black/60" role="tablist" aria-label="Image navigation">
              {media.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`View image ${index + 1} of ${totalItems}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
              {currentIndex + 1} / {totalItems}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
