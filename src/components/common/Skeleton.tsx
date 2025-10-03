interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function PdfCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-soft animate-fade-in">
      <Skeleton variant="rectangular" width="100%" height="12rem" className="mb-4" />
      <Skeleton variant="text" width="80%" height="1.5rem" className="mb-2" />
      <Skeleton variant="text" width="60%" height="1rem" />
    </div>
  );
}

export function ThumbnailSkeleton() {
  return (
    <div className="p-2 animate-fade-in">
      <Skeleton variant="rectangular" width="100%" height="8rem" className="mb-2" />
      <Skeleton variant="text" width="50%" height="0.75rem" className="mx-auto" />
    </div>
  );
}
