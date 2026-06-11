import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, AlertTriangle, Bell } from 'lucide-react';
import { queryWhere } from '../../lib/firestore-helpers';
import { PageLoader } from '../shared/LoadingSpinner';

export function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
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
    setNotices(noticeData || []); setLoading(false);
  };

  if (loading) return <PageLoader message="Loading notices..." />;

  const getStyle = (p: number) => p >= 7 ? { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200', icon: 'text-red-600' } : p >= 4 ? { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200', icon: 'text-amber-600' } : { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200', icon: 'text-blue-600' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notice Board</h1><p className="text-slate-600 dark:text-slate-400 mt-1">Important announcements and updates</p></div>
      <div className="space-y-4">
        {notices.map(n => {
          const style = getStyle(n.priority);
          return (
            <div key={n.id} className={`glass-card p-5 ${style.bg} border ${style.border}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${style.bg}`}>{n.priority >= 7 ? <AlertTriangle className={`w-6 h-6 ${style.icon}`} /> : <Bell className={`w-6 h-6 ${style.icon}`} />}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"><h3 className="text-lg font-semibold">{n.title}</h3><span className={`badge ${n.priority >= 7 ? 'badge-danger' : n.priority >= 4 ? 'badge-warning' : 'badge-info'}`}>Priority {n.priority}</span></div>
                  <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">{n.content}</p>
                  <div className="flex gap-4 text-sm text-slate-500"><span>Posted: {format(new Date(n.created_at), 'MMM dd, yyyy')}</span>{n.expires_at && <span>Expires: {format(new Date(n.expires_at), 'MMM dd, yyyy')}</span>}</div>
                </div>
              </div>
            </div>
          );
        })}
        {notices.length === 0 && <div className="text-center py-12"><MessageSquare className="w-12 h-12 mx-auto text-slate-300" /><p className="mt-4 text-slate-500">No notices available</p></div>}
      </div>
    </div>
  );
}
