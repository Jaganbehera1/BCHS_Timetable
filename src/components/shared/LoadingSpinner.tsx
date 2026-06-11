import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 className={`animate-spin text-primary-600 ${sizeClasses[size]} ${className}`} />
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
