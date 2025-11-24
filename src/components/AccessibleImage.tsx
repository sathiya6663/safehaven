import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface AccessibleImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

export function AccessibleImage({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  onError 
}: AccessibleImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    setError(true);
    onError?.();
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted ${className}`}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={`animate-pulse bg-muted ${className}`} aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`${className} ${!loaded ? 'hidden' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        decoding="async"
      />
    </>
  );
}
