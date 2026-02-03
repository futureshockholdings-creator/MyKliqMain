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

    previousActiveElement.current = document.activeElement;
    
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
    
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
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      
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
