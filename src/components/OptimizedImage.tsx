import React, { useState, useRef, useEffect } from 'react';
import { getOptimizedImageUrl, createFallbackPlaceholder } from '../lib/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  lowResPlaceholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder,
  lowResPlaceholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [showLowRes, setShowLowRes] = useState(!!lowResPlaceholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    setShowLowRes(false);
    onLoad?.();
  };

  const handleError = () => {
    console.warn('Image failed to load:', src);
    setHasError(true);
    setShowLowRes(false);
    onError?.();
  };

  // Get optimized image URL - JPEG/PNG only
  const optimizedSrc = React.useMemo(() => {
    if (!src || hasError) {
      return placeholder || createFallbackPlaceholder(width, height);
    }
    
    return getOptimizedImageUrl(src, width, height);
  }, [src, hasError, width, height, placeholder]);

  // Preload critical images
  useEffect(() => {
    if (loading === 'eager' && optimizedSrc && optimizedSrc !== placeholder && !optimizedSrc.startsWith('data:')) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = handleError;
      img.src = optimizedSrc;
    }
  }, [optimizedSrc, loading, placeholder]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Low-res placeholder for instant display */}
      {showLowRes && lowResPlaceholder && !hasError && (
        <img
          src={lowResPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && !showLowRes && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 rounded w-12 h-12 mx-auto mb-2"></div>
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Main image */}
      {(isInView || loading === 'eager') && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100 z-10' : 'opacity-0'
          }`}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : undefined,
            imageRendering: 'auto'
          }}
          crossOrigin="anonymous"
          decoding="async"
        />
      )}
      
      {/* Error state with retry option */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-sm border-2 border-dashed border-gray-200">
          <div className="text-center p-4">
            <div className="w-8 h-8 mx-auto mb-2 opacity-50">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs">Image unavailable</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
                setShowLowRes(!!lowResPlaceholder);
              }}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;