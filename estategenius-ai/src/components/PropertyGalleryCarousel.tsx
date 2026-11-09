import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Property, PropertyImage } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Camera,
  Play,
  Pause,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PropertyGalleryCarouselProps {
  property: Property;
  mode?: 'card' | 'detail' | 'fullscreen';
  initialIndex?: number;
  onImageClick?: (index: number) => void;
  showThumbnails?: boolean;
  showCaptions?: boolean;
  autoPlayInterval?: number; // 0 for off
  className?: string;
}

export const PropertyGalleryCarousel: React.FC<PropertyGalleryCarouselProps> = ({
  property,
  mode = 'card',
  initialIndex = 0,
  onImageClick,
  showThumbnails = mode === 'detail',
  showCaptions = mode === 'detail',
  autoPlayInterval = 0,
  className = '',
}) => {
  // Normalize items to PropertyImage[]
  const items: PropertyImage[] = React.useMemo(() => {
    if (property.gallery && property.gallery.length > 0) {
      return property.gallery;
    }
    if (property.images && property.images.length > 0) {
      return property.images.map((url, i) => ({
        url,
        caption: `${property.title} - View ${i + 1}`,
        tag: i === 0 ? 'Exterior' : 'Interior',
      }));
    }
    return [
      {
        url: property.image,
        caption: property.title,
        tag: 'Main',
      },
    ];
  }, [property]);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlayInterval > 0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(mode === 'fullscreen');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = items.length;

  const goToNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % total);
    },
    [total]
  );

  const goToPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + total) % total);
    },
    [total]
  );

  const goToIndex = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (idx >= 0 && idx < total) {
      setCurrentIndex(idx);
    }
  };

  // Autoplay slideshow
  useEffect(() => {
    if (isPlaying && total > 1 && autoPlayInterval > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, autoPlayInterval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, total, autoPlayInterval]);

  // Touch Swipe Handlers (Mobile & Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (total <= 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || !isSwiping) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || touchStartX === null) return;
    const threshold = 40; // min 40px swipe
    if (touchDeltaX < -threshold) {
      // Swiped Left -> Next
      goToNext();
    } else if (touchDeltaX > threshold) {
      // Swiped Right -> Prev
      goToPrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  // Keyboard navigation when in fullscreen or detail mode
  useEffect(() => {
    if (mode === 'card' && !isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isFullscreen, goToNext, goToPrev]);

  const currentItem = items[currentIndex] || items[0];

  return (
    <div
      ref={containerRef}
      className={`relative select-none group/carousel flex flex-col ${className} ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md flex items-center justify-center p-4 sm:p-8'
          : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image Frame */}
      <div
        className={`relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer ${
          isFullscreen
            ? 'w-full max-w-6xl h-[78vh] rounded-2xl shadow-2xl border border-slate-800'
            : mode === 'card'
            ? 'aspect-16/9 w-full'
            : 'aspect-16/10 sm:aspect-16/9 w-full rounded-2xl shadow-md border border-slate-200'
        }`}
        onClick={() => {
          if (onImageClick) {
            onImageClick(currentIndex);
          } else if (mode === 'detail') {
            setIsFullscreen(true);
          }
        }}
      >
        {/* Current Active Image with smooth crossfade */}
        <img
          key={currentItem.url}
          src={currentItem.url}
          alt={currentItem.caption || property.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-300 ${
            isSwiping ? 'opacity-90 scale-[0.99]' : 'opacity-100 scale-100'
          }`}
          onError={(e) => {
            // Fallback to property primary image or clean architectural SVG placeholder
            const target = e.target as HTMLImageElement;
            if (target.src !== property.image) {
              target.src = property.image;
            } else {
              target.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230f172a"/><text x="50%" y="50%" fill="%2394a3b8" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle">EstateMind AI - Verified Property Architecture</text></svg>';
            }
          }}
        />

        {/* Swipe Hint Visual Feedback during drag */}
        {isSwiping && Math.abs(touchDeltaX) > 20 && (
          <div
            className={`absolute inset-y-0 ${
              touchDeltaX < 0 ? 'right-4' : 'left-4'
            } flex items-center pointer-events-none text-white/80 bg-slate-950/40 backdrop-blur-xs p-2 rounded-full`}
          >
            {touchDeltaX < 0 ? (
              <ChevronRight className="w-6 h-6 animate-pulse" />
            ) : (
              <ChevronLeft className="w-6 h-6 animate-pulse" />
            )}
          </div>
        )}

        {/* Carousel Navigation Arrow Buttons (Hover or touch) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              title="Previous Photo"
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/70 hover:bg-slate-950/95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/20 shadow-md ${
                mode === 'card'
                  ? 'opacity-0 group-hover/carousel:opacity-100 focus:opacity-100'
                  : 'opacity-85 hover:opacity-100'
              }`}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              title="Next Photo"
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/70 hover:bg-slate-950/95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/20 shadow-md ${
                mode === 'card'
                  ? 'opacity-0 group-hover/carousel:opacity-100 focus:opacity-100'
                  : 'opacity-85 hover:opacity-100'
              }`}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Top-Right Badge: Photo Count & Room Tag */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-none">
          {currentItem.tag && (
            <span className="font-semibold text-[11px] px-2.5 py-0.5 rounded-md backdrop-blur-md bg-slate-950/80 text-white border border-white/15 shadow-xs">
              {currentItem.tag}
            </span>
          )}
          <span className="font-mono text-xs font-bold text-white bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1 shadow-xs">
            <Camera className="w-3 h-3 text-amber-400" />
            <span>
              {currentIndex + 1} / {total}
            </span>
          </span>

          {mode !== 'card' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(!isFullscreen);
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen Gallery'}
              className="pointer-events-auto p-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-md backdrop-blur-md border border-white/20 transition-colors cursor-pointer shadow-xs"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Bottom Floating Scrim & Indicator Dots */}
        <div className="absolute bottom-2 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none py-1">
          {total > 1 && total <= 10 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 pointer-events-auto">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => goToIndex(idx, e)}
                  title={`Go to photo ${idx + 1}`}
                  className={`transition-all rounded-full cursor-pointer ${
                    currentIndex === idx
                      ? 'w-4 h-1.5 bg-amber-400 shadow-xs'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="absolute top-4 right-4 z-20 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-white/20 shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Close (Esc)</span>
          </button>
        )}
      </div>

      {/* Caption & Controls Bar (for Detail or Fullscreen mode) */}
      {showCaptions && (
        <div
          className={`flex items-center justify-between gap-3 text-xs py-2 px-1 ${
            isFullscreen ? 'text-slate-300 max-w-6xl w-full mt-2' : 'text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {currentItem.caption}
            </span>
            {currentItem.tag && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                ({currentItem.tag})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {autoPlayInterval > 0 && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-amber-500" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-500" />
                    <span>Play Slideshow</span>
                  </>
                )}
              </button>
            )}
            <span className="font-mono text-[11px] font-medium text-slate-500">
              {currentIndex + 1} of {total}
            </span>
          </div>
        </div>
      )}

      {/* Thumbnail Ribbon Strip (Detail & Fullscreen mode) */}
      {showThumbnails && total > 1 && (
        <div
          className={`flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-300 ${
            isFullscreen ? 'max-w-6xl w-full mt-1' : 'w-full'
          }`}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => goToIndex(idx, e)}
              className={`relative shrink-0 rounded-xl overflow-hidden transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'ring-2 ring-blue-600 ring-offset-2 scale-102 opacity-100'
                  : 'opacity-60 hover:opacity-90'
              } ${isFullscreen ? 'w-20 h-14' : 'w-16 sm:w-20 h-12 sm:h-14'}`}
            >
              <img
                src={item.url}
                alt={item.caption || `Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = property.image;
                }}
              />
              {item.tag && (
                <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-[9px] font-bold text-white text-center py-0.5 truncate px-1">
                  {item.tag}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
