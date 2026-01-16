import { useRef, useState, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  pullThreshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  pullThreshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const dy = Math.max(0, currentY - startY.current);
    
    const dampedDistance = Math.min(dy * 0.5, pullThreshold * 1.5);
    setPullDistance(dampedDistance);
  }, [disabled, isRefreshing, pullThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, pullThreshold, isRefreshing, onRefresh, disabled]);

  const indicatorOpacity = Math.min(pullDistance / (pullThreshold * 0.7), 1);
  const indicatorScale = Math.min(0.5 + (pullDistance / pullThreshold) * 0.5, 1);
  const isReady = pullDistance >= pullThreshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full"
      style={{ touchAction: 'pan-y' }}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ 
            top: Math.max(pullDistance - 50, 0),
            opacity: indicatorOpacity,
            transform: `scale(${indicatorScale})`,
            transition: isRefreshing ? 'none' : 'opacity 0.1s ease-out'
          }}
        >
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full 
            bg-primary/10 backdrop-blur-sm border border-primary/20
            ${isRefreshing ? 'animate-pulse' : ''}
          `}>
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ArrowDown 
                className={`w-5 h-5 text-primary transition-transform duration-200 ${isReady ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </div>
      )}
      
      <div 
        style={{ 
          transform: `translateY(${isRefreshing ? pullThreshold * 0.5 : pullDistance * 0.3}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
