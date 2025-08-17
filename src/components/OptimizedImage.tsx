import React, { useState, useRef, useEffect } from 'react';

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
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
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
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Optimize image URL for better performance
  const optimizedSrc = React.useMemo(() => {
    if (!src || hasError) return placeholder;
    
    // Handle relative paths by converting to absolute URLs
    let processedSrc = src;
    if (src.startsWith('/') && !src.startsWith('//')) {
      processedSrc = `${window.location.origin}${src}`;
    }
    
    // If it's a Supabase storage URL, we can add optimization parameters
    if (processedSrc.includes('supabase') && width && height) {
      try {
        const url = new URL(processedSrc);
        url.searchParams.set('width', width.toString());
        url.searchParams.set('height', height.toString());
        url.searchParams.set('quality', '85');
        url.searchParams.set('format', 'webp');
        return url.toString();
      } catch (error) {
        console.warn('Invalid URL for optimization:', processedSrc);
        return processedSrc;
      }
    }
    
    // Handle external URLs (like Pexels, Unsplash, etc.)
    if (processedSrc.includes('pexels.com') || processedSrc.includes('unsplash.com')) {
      try {
        const url = new URL(processedSrc);
        if (width && height) {
          // Add size parameters for external image services
          url.searchParams.set('w', width.toString());
          url.searchParams.set('h', height.toString());
          url.searchParams.set('fit', 'crop');
          url.searchParams.set('auto', 'format,compress');
        }
        return url.toString();
      } catch (error) {
        console.warn('Invalid external URL:', processedSrc);
        return processedSrc;
      }
    }
    
    return processedSrc;
  }, [src, hasError, placeholder, width, height]);

  // Enhanced error handling with retry logic
  const handleErrorEnhanced = () => {
    console.warn('Image failed to load:', src);
    setHasError(true);
    onError?.();
  };

  // Preload critical images
  useEffect(() => {
    if (loading === 'eager' && optimizedSrc && optimizedSrc !== placeholder) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = handleErrorEnhanced;
      img.src = optimizedSrc;
    }
  }, [optimizedSrc, loading, placeholder]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Enhanced placeholder with better styling */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 rounded w-12 h-12 mx-auto mb-2"></div>
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        </div>
      )}
      {/* Main image with enhanced error handling */}
      {(isInView || loading === 'eager') && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleErrorEnhanced}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : undefined
          }}
          crossOrigin="anonymous"
        />
      )}
      
      {/* Enhanced error state with retry option */}
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