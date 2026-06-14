import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  MessageSquare, AlertTriangle, Bell, Calendar, 
  Clock, Eye, TrendingUp, Award, Sparkles,
  ChevronRight, Filter, Search, X
} from 'lucide-react';
import { queryWhere } from '../../lib/firestore-helpers';
import { PageLoader } from '../shared/LoadingSpinner';

export function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    try {
      const now = new Date();
      const data = await queryWhere('notices', 'is_active', '==', true);
      const noticeData = data
        .sort((a: any, b: any) => {
          const priorityDiff = (b.priority || 0) - (a.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .map((val: any) => {
          const created = val.created_at && (typeof val.created_at === 'string' ? new Date(val.created_at) : new Date(val.created_at));
          const expires = val.expires_at && (typeof val.expires_at === 'string' ? new Date(val.expires_at) : new Date(val.expires_at));
          return { id: val.id, ...val, created_at: created ? created.toISOString() : undefined, expires_at: expires ? expires.toISOString() : undefined };
        })
        .filter((n: any) => !n.expires_at || new Date(n.expires_at) > now);
      setNotices(noticeData || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority: number) => {
    if (priority >= 7) {
      return {
        bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        label: 'High Priority',
        color: 'red'
      };
    } else if (priority >= 4) {
      return {
        bg: 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-950/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'Medium Priority',
        color: 'amber'
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Low Priority',
        color: 'blue'
      };
    }
  };

  const getFilteredNotices = () => {
    let filtered = [...notices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => {
        if (filterPriority === 'high') return n.priority >= 7;
        if (filterPriority === 'medium') return n.priority >= 4 && n.priority <= 6;
        if (filterPriority === 'low') return n.priority <= 3;
        return true;
      });
    }

    return filtered;
  };

  const filteredNotices = getFilteredNotices();
  const stats = {
    total: notices.length,
    high: notices.filter(n => n.priority >= 7).length,
    medium: notices.filter(n => n.priority >= 4 && n.priority <= 6).length,
    low: notices.filter(n => n.priority <= 3).length
  };

  if (loading) return <PageLoader message="Loading notices..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Notice Board</h1>
                  <p className="text-indigo-100 mt-1">Important announcements and updates</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Bell className="w-4 h-4" />
                <span>{stats.total} Active Notice{stats.total !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Notices</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.high}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Medium Priority</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.medium}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Low Priority</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.low}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notices by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12 pr-4 py-2.5"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filterPriority === 'all'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterPriority('high')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filterPriority === 'high'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  High
                </button>
                <button
                  onClick={() => setFilterPriority('medium')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filterPriority === 'medium'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setFilterPriority('low')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filterPriority === 'low'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Low
                </button>
              </div>
            </div>
          </div>

          {/* Notices List */}
          {filteredNotices.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchTerm || filterPriority !== 'all' ? 'No matching notices found' : 'No notices available'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm || filterPriority !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Check back later for important announcements'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice, index) => {
                const style = getPriorityStyle(notice.priority);
                const isExpanded = expandedNotice === notice.id;
                
                return (
                  <div
                    key={notice.id}
                    className={`group glass-card overflow-hidden transition-all duration-300 hover:shadow-xl ${
                      style.bg
                    } border ${style.border}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-5">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${style.iconBg}`}>
                          {notice.priority >= 7 ? (
                            <AlertTriangle className={`w-7 h-7 ${style.icon}`} />
                          ) : (
                            <Bell className={`w-7 h-7 ${style.icon}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                              {notice.title}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${style.badge}`}>
                              {notice.priority >= 7 ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : notice.priority >= 4 ? (
                                <Bell className="w-3 h-3" />
                              ) : (
                                <MessageSquare className="w-3 h-3" />
                              )}
                              Priority {notice.priority}
                            </span>
                            {notice.priority >= 8 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                          </div>

                          <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${
                            !isExpanded ? 'line-clamp-3' : ''
                          }`}>
                            {notice.content}
                          </p>

                          {notice.content.length > 300 && (
                            <button
                              onClick={() => setExpandedNotice(isExpanded ? null : notice.id)}
                              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? 'Show less' : 'Read more'}
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          )}

                          {/* Footer */}
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Posted: {format(new Date(notice.created_at), 'MMM dd, yyyy')}</span>
                              </div>
                              {notice.expires_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Expires: {format(new Date(notice.expires_at), 'MMM dd, yyyy')}</span>
                                </div>
                              )}
                            </div>

                            {notice.created_by_name && (
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                By: {notice.created_by_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium mb-2">Notice Board Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>High priority notices require immediate attention</li>
                  <li>Click "Read more" to view full notice content</li>
                  <li>Use search to find specific notices</li>
                  <li>Expired notices are automatically hidden</li>
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
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}