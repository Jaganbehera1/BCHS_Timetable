import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'purple' | 'pink';
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'primary',
  trend,
  loading = false,
  onClick,
  className = '',
}: StatsCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      hover: 'hover:border-blue-200 dark:hover:border-blue-700',
      gradient: 'from-blue-500 to-blue-600',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      hover: 'hover:border-green-200 dark:hover:border-green-700',
      gradient: 'from-green-500 to-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      hover: 'hover:border-amber-200 dark:hover:border-amber-700',
      gradient: 'from-amber-500 to-orange-600',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      hover: 'hover:border-red-200 dark:hover:border-red-700',
      gradient: 'from-red-500 to-rose-600',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      icon: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      hover: 'hover:border-sky-200 dark:hover:border-sky-700',
      gradient: 'from-sky-500 to-cyan-600',
    },
    accent: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
      hover: 'hover:border-indigo-200 dark:hover:border-indigo-700',
      gradient: 'from-indigo-500 to-purple-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      hover: 'hover:border-purple-200 dark:hover:border-purple-700',
      gradient: 'from-purple-500 to-pink-600',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      icon: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-pink-100 dark:bg-pink-900/40',
      hover: 'hover:border-pink-200 dark:hover:border-pink-700',
      gradient: 'from-pink-500 to-rose-600',
    },
  };

  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.isPositive === undefined) {
      return trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus;
    }
    return trend.isPositive ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    const isPositive = trend.isPositive !== undefined ? trend.isPositive : trend.value > 0;
    if (isPositive) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (trend.value === 0) return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm 
        border border-slate-200 dark:border-slate-700 p-5 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        ${colors.hover} ${onClick ? 'cursor-pointer' : ''} ${className}
      `}
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          {/* Icon with pulse animation on hover */}
          <div className={`
            relative w-12 h-12 rounded-xl flex items-center justify-center 
            transition-all duration-300 group-hover:scale-110 group-hover:shadow-md
            ${colors.iconBg}
          `}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
            
            {/* Animated ring on hover */}
            <div className="absolute inset-0 rounded-xl bg-current opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </div>
          
          {/* Trend Badge */}
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trendColor}`}>
              {TrendIcon && <TrendIcon className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="ml-1">{trend.label}</span>}
            </div>
          )}
        </div>

        {/* Title with tooltip effect */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            {title}
          </p>
          
          {/* Value with animation */}
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          
          {/* Subtitle with icon */}
          {subtitle && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar for visual representation (optional) */}
        {typeof value === 'number' && value <= 100 && (
          <div className="mt-4">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors.gradient} opacity-20`} />
      </div>
    </div>
  );
}

// Compact Stats Card for smaller spaces
interface CompactStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

export function CompactStatsCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
}: CompactStatsCardProps) {
  const colorClasses = {
    primary: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    success: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    danger: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    info: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
    accent: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  };

  const colors = colorClasses[color];

  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// Horizontal Stats Card for dashboards
interface HorizontalStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  progress?: number;
}

export function HorizontalStatsCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  progress,
}: HorizontalStatsCardProps) {
  const colorClasses = {
    primary: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', progress: 'bg-blue-500' },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', progress: 'bg-green-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', progress: 'bg-amber-500' },
    danger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', progress: 'bg-red-500' },
    info: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', progress: 'bg-sky-500' },
    accent: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', progress: 'bg-indigo-500' },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
          </div>
        </div>
        
        {progress !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
              {progress}% Complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card Group for multiple cards
interface StatsCardGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function StatsCardGroup({ title, children, className = '' }: StatsCardGroupProps) {
  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of key metrics</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}