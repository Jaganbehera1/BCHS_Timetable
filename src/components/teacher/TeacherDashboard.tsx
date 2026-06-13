import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar, Clock, BookOpen, GraduationCap, Bell, MessageSquare,
  ArrowRight, User, ClipboardCheck, FileText, CheckCircle, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCollectionData, queryWhere, getDocumentData } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { StatsCard } from '../shared/StatsCard';
import { PageLoader } from '../shared/LoadingSpinner';

interface ScheduleEntry {
  id: string;
  class: { id: string; full_name: string; section?: string } | null;
  subject: { id: string; subject_name: string; color_code?: string } | null;
  period_slot: { id: string; period_number: number; start_time: string; end_time: string } | null;
  room_number?: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: number;
  created_at: string;
}

const DAY_MAPPING = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const normalizeDayValue = (value: any) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (DAY_MAPPING.includes(lower)) return lower;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return normalizeDayValue(parsed);
    return '';
  }
  if (typeof value === 'number') {
    if (value >= 0 && value < DAY_MAPPING.length) return DAY_MAPPING[value];
    if (value >= 1 && value <= DAY_MAPPING.length) return DAY_MAPPING[value - 1];
  }
  return '';
};

export function TeacherDashboard() {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState<ScheduleEntry[]>([]);
  const [nextClass, setNextClass] = useState<ScheduleEntry | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<ScheduleEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const dayOfWeek = format(new Date(), 'EEEE').toLowerCase();
  const today = new Date();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      const ttData = await getCollectionData<any>('timetable_entries');
      const ttFiltered = ttData.filter(t => t.teacher_id === user.id && normalizeDayValue(t.day_of_week) === dayOfWeek);
      
      const nData = await queryWhere('notices', 'is_active', '==', true);
      
      const allPeriodSlots = await getCollectionData<any>('period_slots');
      const tData = await Promise.all(ttFiltered.map(async (val) => {
        const classData = val.class_id ? await getDocumentData('classes', val.class_id) : null;
        const subjectData = val.subject_id ? await getDocumentData('subjects', val.subject_id) : null;
        let periodData = null;
        if (val.period_slot_id) {
          periodData = await getDocumentData('period_slots', val.period_slot_id);
        } else if (val.period_number != null) {
          periodData = allPeriodSlots.find((p:any) => {
            const slotDay = normalizeDayValue(p.day_of_week);
            return slotDay === dayOfWeek && p.period_number === val.period_number;
          }) || null;
        }
        return {
          id: val.id,
          room_number: val.room_number,
          class: classData ? { ...classData, id: val.class_id } : null,
          subject: subjectData ? { ...subjectData, id: val.subject_id } : null,
          period_slot: periodData ? { id: val.period_slot_id || '', ...periodData } : null,
        } as ScheduleEntry;
      }));

      if (tData) {
        setTodayClasses(tData as ScheduleEntry[]);

        const sorted = [...tData].sort((a, b) => (a.period_slot?.period_number || 0) - (b.period_slot?.period_number || 0));
        const current = sorted.find(e => e.period_slot?.start_time && e.period_slot?.end_time && currentTime >= e.period_slot.start_time && currentTime < e.period_slot.end_time);
        setCurrentPeriod(current || null);
        const upcoming = sorted.filter(e => e.period_slot?.start_time && e.period_slot.start_time > currentTime);
        setNextClass(upcoming[0] || null);
      }

      const sortedNotices = nData.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }).slice(0, 5);

      const noticesWithDates = sortedNotices.map(val => {
        const created = val.created_at && (typeof val.created_at === 'string' ? new Date(val.created_at) : new Date(val.created_at));
        return { id: val.id, ...val, created_at: created ? created.toISOString() : undefined } as Notice;
      });
      setNotices(noticesWithDates);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-blue-100 mb-1">{greeting()}</p>
            <h1 className="text-2xl lg:text-3xl font-bold">{user?.full_name?.split(' ')[0] || 'Teacher'}!</h1>
            <p className="text-blue-100 mt-1">
              {format(today, 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-blue-100">Today's Classes</p>
              <p className="text-2xl font-bold">{todayClasses.length}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Classes"
          value={todayClasses.length}
          icon={Calendar}
          color="primary"
          subtitle="Scheduled"
        />
        <StatsCard
          title="Subjects"
          value={[...new Set(todayClasses.map(c => c.subject?.subject_name))].length}
          icon={BookOpen}
          color="success"
          subtitle="Different subjects"
        />
        <StatsCard
          title="Notices"
          value={notices.length}
          icon={FileText}
          color="info"
          subtitle="Active notices"
        />
        <StatsCard
          title="Attendance"
          value="Mark"
          icon={ClipboardCheck}
          color="warning"
          subtitle="Click to mark"
        />
      </div>

      {/* Current/Next Class Alert */}
      {(currentPeriod || nextClass) && (
        <div className={`rounded-2xl p-6 shadow-sm border ${
          currentPeriod
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentPeriod
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              {currentPeriod ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentPeriod ? 'Currently Teaching' : 'Up Next'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentPeriod ? 'In progress right now' : 'Your next class'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-slate-900 dark:text-white">
                  {(currentPeriod || nextClass)?.class?.full_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-700 dark:text-slate-200">
                  {(currentPeriod || nextClass)?.subject?.subject_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-700 dark:text-slate-200">
                  {(currentPeriod || nextClass)?.period_slot?.start_time} - {(currentPeriod || nextClass)?.period_slot?.end_time}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  (Period {(currentPeriod || nextClass)?.period_slot?.period_number})
                </span>
              </div>
            </div>

            <Link
              to="/teacher/today"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium"
            >
              View Full Schedule
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Today's Schedule & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Today's Schedule</h3>
            </div>
            <Link
              to="/teacher/today"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-4 space-y-2">
            {todayClasses.length > 0 ? (
              todayClasses.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    currentPeriod?.id === entry.id
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">P{entry.period_slot?.period_number}</span>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: entry.subject?.color_code || '#3b82f6' }}
                    >
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{entry.subject?.subject_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{entry.class?.full_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{entry.period_slot?.start_time}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.period_slot?.end_time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-500 dark:text-slate-400">No classes scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Notice Board */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Notice Board</h3>
            </div>
            <Link
              to="/teacher/notices"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-white">{notice.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      notice.priority >= 7
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : notice.priority >= 4
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {notice.priority >= 7 ? 'High' : notice.priority >= 4 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{notice.content}</p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {format(new Date(notice.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-500 dark:text-slate-400">No notices available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
