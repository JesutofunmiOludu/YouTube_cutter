import React, { ImgHTMLAttributes } from 'react';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className = '', src, srcSet, alt, fallback = '?', ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    if (!src || hasError) {
      return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-gray-200 ${className}`} aria-label={alt}>
          {fallback}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        srcSet={srcSet}
        alt={alt}
        onError={() => setHasError(true)}
        className={`object-cover h-10 w-10 shrink-0 rounded-full bg-gray-800 border border-gray-700 ${className}`}
        {...props}
      />
    );
  }
);
Avatar.displayName = 'Avatar';
