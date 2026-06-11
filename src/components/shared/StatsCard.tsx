import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'primary',
}: StatsCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      icon: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    },
    accent: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
