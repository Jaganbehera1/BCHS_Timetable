import { useState, useEffect, useRef } from 'react';
import {
  Bell, CheckCircle, Clock, FileText, AlertCircle,
  Check, X, Settings, Volume2, VolumeX, RefreshCw,
  Calendar, MessageSquare, UserCheck, Award,
  ChevronDown, ChevronUp, Filter, Trash2,
  BellRing, BellOff, Sparkles, Shield, Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { queryWhere, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
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
  read_at?: string;
}

const NOTIFICATION_TYPES: Record<string, { icon: typeof Bell; color: string; bgColor: string; label: string }> = {
  class_reminder: { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Class Reminder' 
  },
  leave_approval: { 
    icon: CheckCircle, 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Leave Status' 
  },
  notice: { 
    icon: FileText, 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Notice' 
  },
  alert: { 
    icon: AlertCircle, 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Alert' 
  },
  attendance: { 
    icon: UserCheck, 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Attendance' 
  },
  achievement: { 
    icon: Award, 
    color: 'text-amber-600 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Achievement' 
  },
  default: { 
    icon: Bell, 
    color: 'text-slate-600 dark:text-slate-400', 
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    label: 'Notification' 
  },
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) fetchNotifications();
    const saved = localStorage.getItem('notificationSound');
    if (saved !== null) setSoundEnabled(saved === 'true');
    
    // Initialize audio
    audioRef.current = new Audio('/notification-sound.mp3');
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [user]);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await queryWhere('notifications', 'user_id', '==', user.id);
      const sortedData = data
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 100)
        .map((val: any) => {
          const created = val.created_at && (typeof val.created_at === 'string' ? new Date(val.created_at) : new Date(val.created_at));
          return { id: val.id, ...val, created_at: created ? created.toISOString() : undefined } as Notification;
        });
      setNotifications(sortedData);
      
      // Check for new notifications
      const newUnread = sortedData.filter(n => !n.is_read).length;
      if (newUnread > 0 && notifications.length > 0) {
        playSound();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('notifications', id, { 
        is_read: true,
        read_at: new Date().toISOString()
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setActionLoading('all');
    try {
      const data = await queryWhere('notifications', 'user_id', '==', user.id);
      const unread = data.filter((d: any) => d.is_read === false);
      const updates = unread.map((d: any) => 
        updateDocument('notifications', d.id, { 
          is_read: true,
          read_at: new Date().toISOString()
        })
      );
      await Promise.all(updates);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('notifications', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) return;
    setActionLoading('all');
    try {
      const promises = notifications.map(n => deleteDocument('notifications', n.id));
      await Promise.all(promises);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSound', String(newValue));
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    if (filter === 'read') return notifications.filter(n => n.is_read);
    return notifications;
  };

  if (loading) return <PageLoader message="Loading notifications..." />;

  const filteredNotifications = getFilteredNotifications();
  const unread = notifications.filter(n => !n.is_read).length;
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
                  <Bell className="w-7 h-7" />
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                      {unread}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
                  <p className="text-indigo-100 mt-1">
                    {unread > 0 
                      ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}` 
                      : 'All caught up! No unread notifications'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 group"
                  title={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
                >
                  {soundEnabled ? 
                    <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> : 
                    <VolumeX className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  }
                </button>
                <button
                  onClick={fetchNotifications}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 group"
                  title="Refresh notifications"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Notifications</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{notifications.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{unread}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Read</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{notifications.length - unread}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <BellOff className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={actionLoading === 'all'}
                    className="btn-secondary text-sm"
                  >
                    {actionLoading === 'all' && actionLoading === 'all' ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Mark all as read
                      </>
                    )}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    disabled={actionLoading === 'all'}
                    className="px-4 py-2 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'unread', 'read'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filter === f 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
                      <span className="ml-1 text-xs opacity-75">
                        ({f === 'all' ? notifications.length : f === 'unread' ? unread : notifications.length - unread})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {filter !== 'all' ? 'No notifications match the filter' : 'No notifications yet'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {filter !== 'all' 
                  ? "Try changing the filter to see more notifications"
                  : "You'll receive notifications about classes, leaves, and important updates here."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date} className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
                  </div>

                  <div className="space-y-3">
                    {items.map((notification, index) => {
                      const typeInfo = NOTIFICATION_TYPES[notification.notification_type] || NOTIFICATION_TYPES.default;
                      const Icon = typeInfo.icon;
                      const isUnread = !notification.is_read;

                      return (
                        <div
                          key={notification.id}
                          className={`group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                            isUnread
                              ? 'border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-700'
                              : 'border-slate-200 dark:border-slate-700 opacity-80'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="p-5 flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.bgColor} transition-transform group-hover:scale-110`}>
                              <Icon className={`w-6 h-6 ${typeInfo.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-semibold ${
                                    isUnread
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                  {isUnread && (
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                      <Sparkles className="w-3 h-3" />
                                      New
                                    </span>
                                  )}
                                </div>
                                {isUnread && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                                )}
                              </div>
                              
                              <p className={`mt-2 text-sm leading-relaxed ${
                                isUnread
                                  ? 'text-slate-600 dark:text-slate-300'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {notification.message}
                              </p>
                              
                              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                {notification.read_at && (
                                  <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Read {formatDistanceToNow(new Date(notification.read_at), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUnread && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  disabled={actionLoading === notification.id}
                                  className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                  title="Mark as read"
                                >
                                  {actionLoading === notification.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                disabled={actionLoading === notification.id}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium mb-2">Notification Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click on a notification to mark it as read</li>
                  <li>Enable sound to get audio alerts for new notifications</li>
                  <li>Use filters to focus on unread notifications</li>
                  <li>Clear old notifications to keep your inbox organized</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}