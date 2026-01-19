import { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallback?: React.ReactNode;
  sx?: object;
}

/**
 * LazyImage component that uses Intersection Observer to lazy load images.
 * Shows a skeleton placeholder until the image is in the viewport and loaded.
 */
export default function LazyImage({
  src,
  alt,
  width = '100%',
  height = 'auto',
  borderRadius = 0,
  objectFit = 'cover',
  fallback,
  sx = {},
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading when image is 100px from viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // If there's no source, show fallback immediately
  if (!src) {
    return (
      <Box
        ref={imgRef}
        sx={{
          width,
          height,
          borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.200',
          ...sx,
        }}
      >
        {fallback}
      </Box>
    );
  }

  return (
    <Box
      ref={imgRef}
      sx={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        ...sx,
      }}
    >
      {/* Show skeleton while loading */}
      {(!isLoaded || !isInView) && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Show fallback on error */}
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
          }}
        >
          {fallback}
        </Box>
      )}

      {/* Only render image when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </Box>
  );
}
