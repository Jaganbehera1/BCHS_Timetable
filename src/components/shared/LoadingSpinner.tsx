import { Loader2, RefreshCw, Sparkles, Clock, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  variant = 'primary',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'text-indigo-600 dark:text-indigo-400',
    secondary: 'text-purple-600 dark:text-purple-400',
    white: 'text-white',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} />
      {text && (
        <span className={`text-sm font-medium ${
          variant === 'white' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
        }`}>
          {text}
        </span>
      )}
    </div>
  );
}

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  variant?: 'default' | 'gradient' | 'minimal';
}

export function LoadingScreen({ 
  message = 'Loading...', 
  subMessage = 'Please wait while we load your content', 
  progress,
  variant = 'default' 
}: LoadingScreenProps) {
  const [loadingMessages, setLoadingMessages] = useState([
    'Setting up your dashboard...',
    'Loading your data...',
    'Almost there...',
    'Preparing your experience...'
  ]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tips = [
    'Did you know? You can customize your notification preferences in settings',
    'Tip: Use keyboard shortcuts for faster navigation',
    'Pro tip: Enable dark mode for comfortable night-time usage',
    'Did you know? You can export data as CSV for offline analysis',
    'Tip: Set up your timetable once and let the system handle reminders'
  ];

  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">{message}</p>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative text-center z-10">
          <div className="mb-8 relative">
            <div className="absolute inset-0 animate-ping-slow">
              <div className="w-24 h-24 rounded-full border-4 border-white/30 mx-auto" />
            </div>
            <div className="relative w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <BookOpen className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
            {message}
          </h2>
          <p className="text-white/80 text-sm">
            {subMessage}
          </p>
          
          {progress !== undefined && (
            <div className="mt-6 w-64 mx-auto">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-2">{Math.round(progress)}% Complete</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-white/60 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{loadingMessages[currentMessageIndex]}</span>
          </div>
        </div>

        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-30px) translateX(20px); }
            50% { transform: translateY(20px) translateX(-20px); }
            75% { transform: translateY(-10px) translateX(10px); }
          }
          @keyframes ping-slow {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-slower { animation: float-slow 12s ease-in-out infinite reverse; }
          .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        `}</style>
      </div>
    );
  }

  // Default variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float-slower" />
      </div>

      <div className="relative text-center max-w-sm mx-auto p-8">
        {/* Animated Loader Container */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 animate-ping-slow">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-200 dark:border-indigo-800 mx-auto" />
          </div>
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* Loading Title */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {message}
        </h3>
        
        {/* Sub Message */}
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {subMessage}
        </p>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mb-6">
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>
        )}

        {/* Rotating Loading Messages */}
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-6">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="animate-pulse">
            {loadingMessages[currentMessageIndex]}
          </span>
        </div>

        {/* Tips Section */}
        {showTip && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">!</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  Quick Tip
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {tips[Math.floor(Math.random() * tips.length)]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Background Animation Styles */}
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-30px) translateX(20px); }
            50% { transform: translateY(20px) translateX(-20px); }
            75% { transform: translateY(-10px) translateX(10px); }
          }
          @keyframes ping-slow {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-slower { animation: float-slow 12s ease-in-out infinite reverse; }
          .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        `}</style>
      </div>
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function PageLoader({ 
  message = 'Loading...', 
  subMessage = 'Please wait while we fetch your data',
  variant = 'default' 
}: PageLoaderProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{message}</p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="glass-card p-12 text-center">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-800" />
            </div>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {message}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subMessage}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>This may take a few seconds</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-4">
        <div className="absolute inset-0 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-indigo-200 dark:bg-indigo-800/50" />
        </div>
        <LoadingSpinner size="lg" variant="primary" />
      </div>
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-300 font-medium">{message}</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{subMessage}</p>
      </div>
    </div>
  );
}

// Skeleton Loader Component
interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'table' | 'form';
  count?: number;
}

export function SkeletonLoader({ type = 'card', count = 3 }: SkeletonLoaderProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 glass-card animate-pulse">
            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-card overflow-hidden animate-pulse">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="space-y-5">
          {[...Array(count)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
            </div>
          ))}
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3 ml-auto" />
        </div>
      </div>
    );
  }

  return null;
}

// Button Loader
interface ButtonLoaderProps {
  text?: string;
}

export function ButtonLoader({ text = 'Loading...' }: ButtonLoaderProps) {
  return (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      {text}
    </span>
  );
}

// Full Page Loader with progress
interface FullPageLoaderProps {
  progress?: number;
  message?: string;
}

export function FullPageLoader({ progress, message = 'Loading application' }: FullPageLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center max-w-sm mx-auto p-8">
        {/* Logo Animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-200 dark:border-indigo-800 mx-auto" />
          </div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Smart Teacher Assistant
        </h2>
        
        {/* Message */}
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {message}{dots}
        </p>

        {/* Progress Bar */}
        {progress !== undefined ? (
          <div className="mb-4">
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Initializing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Dot Loader
export function DotLoader() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}