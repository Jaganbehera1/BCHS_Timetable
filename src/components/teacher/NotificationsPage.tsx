import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle, Clock, FileText, AlertCircle,
  Check, X, Settings, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { queryWhere, updateDocument } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader, LoadingSpinner } from '../shared/LoadingSpinner';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_TYPES: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  class_reminder: { icon: Clock, color: 'blue', label: 'Class Reminder' },
  leave_approval: { icon: CheckCircle, color: 'green', label: 'Leave Status' },
  notice: { icon: FileText, color: 'purple', label: 'Notice' },
  alert: { icon: AlertCircle, color: 'red', label: 'Alert' },
  default: { icon: Bell, color: 'slate', label: 'Notification' },
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
    // Check sound preference
    const saved = localStorage.getItem('notificationSound');
    if (saved !== null) setSoundEnabled(saved === 'true');
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const data = await queryWhere('notifications', 'user_id', '==', user.id);
    const sortedData = data
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 50)
      .map((val: any) => {
        const created = val.created_at && (typeof val.created_at === 'string' ? new Date(val.created_at) : new Date(val.created_at));
        return { id: val.id, ...val, created_at: created ? created.toISOString() : undefined } as Notification;
      });
    setNotifications(sortedData);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    setActionLoading(id);
    await updateDocument(`notifications/${id}`, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setActionLoading(null);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setActionLoading('all');
    const data = await queryWhere('notifications', 'user_id', '==', user.id);
    const unread = data.filter((d: any) => d.is_read === false);
    const updates = unread.map((d: any) => updateDocument(`notifications/${d.id}`, { is_read: true }));
    await Promise.all(updates);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setActionLoading(null);
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSound', String(newValue));
  };

  if (loading) return <PageLoader message="Loading notifications..." />;

  const unread = notifications.filter(n => !n.is_read).length;
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-blue-100">
                {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={fetchNotifications}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200">
              {notifications.length}
            </span>
          </div>
          {unread > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Unread</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-medium text-blue-700 dark:text-blue-300">
                {unread}
              </span>
            </div>
          )}
        </div>

        {unread > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={actionLoading === 'all'}
            className="btn-secondary text-sm"
          >
            {actionLoading === 'all' ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Mark all as read
              </>
            )}
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No notifications</h3>
          <p className="text-slate-500 dark:text-slate-400">
            You'll receive notifications about classes, leaves, and important updates here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="space-y-2">
                {items.map((notification) => {
                  const typeInfo = NOTIFICATION_TYPES[notification.notification_type] || NOTIFICATION_TYPES.default;
                  const Icon = typeInfo.icon;

                  return (
                    <div
                      key={notification.id}
                      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border transition-all cursor-pointer ${
                        !notification.is_read
                          ? 'border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-700 hover:shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="p-4 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          typeInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          typeInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                          typeInfo.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          typeInfo.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            typeInfo.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            typeInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            typeInfo.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            typeInfo.color === 'red' ? 'text-red-600 dark:text-red-400' :
                            'text-slate-600 dark:text-slate-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium truncate ${
                                !notification.is_read
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {notification.title}
                              </h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                {typeInfo.label}
                              </span>
                            </div>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className={`mt-1 text-sm ${
                            !notification.is_read
                              ? 'text-slate-600 dark:text-slate-300'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {actionLoading === notification.id && (
                          <LoadingSpinner size="sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
