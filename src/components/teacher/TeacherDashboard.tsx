import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar, Clock, BookOpen, GraduationCap, Bell, MessageSquare,
  ArrowRight, User, ClipboardCheck, FileText, CheckCircle, AlertCircle,
  TrendingUp, Award, Sparkles, Zap, Shield, Coffee, Home
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const dayOfWeek = format(new Date(), 'EEEE').toLowerCase();
  const today = new Date();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatCurrentTime = () => {
    return format(currentTime, 'hh:mm:ss a');
  };

  const getProgressToNextClass = () => {
    if (!nextClass?.period_slot?.start_time) return 0;
    const now = new Date();
    const start = new Date();
    const [startHour, startMinute] = nextClass.period_slot.start_time.split(':').map(Number);
    start.setHours(startHour, startMinute, 0);
    const diff = start.getTime() - now.getTime();
    if (diff <= 0) return 0;
    const minutesLeft = Math.floor(diff / 60000);
    return Math.min(100, Math.max(0, 100 - (minutesLeft / 60) * 100));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl -ml-24 -mb-24" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-100 mb-2">
                  <Home className="w-5 h-5" />
                  <span className="text-sm font-medium">Teacher Dashboard</span>
                  <div className="h-4 w-px bg-emerald-300 mx-2" />
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">{greeting()}</span>
                </div>
                <h1 className="text-2xl lg:text-4xl font-bold">
                  {greeting()}, {user?.full_name?.split(' ')[0] || 'Teacher'}!
                </h1>
                <p className="text-emerald-100 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(today, 'EEEE, MMMM dd, yyyy')}
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4" />
                  {formatCurrentTime()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-emerald-100">Today's Classes</p>
                  <p className="text-3xl font-bold">{todayClasses.length}</p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-75 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Today's Classes"
              value={todayClasses.length}
              icon={Calendar}
              color="primary"
              subtitle="Scheduled today"
            />
            <StatsCard
              title="Subjects"
              value={[...new Set(todayClasses.map(c => c.subject?.subject_name))].length}
              icon={BookOpen}
              color="success"
              subtitle="Different subjects"
            />
            <StatsCard
              title="Active Notices"
              value={notices.length}
              icon={FileText}
              color="info"
              subtitle="For your information"
            />
            <StatsCard
              title="Attendance"
              value="Mark"
              icon={ClipboardCheck}
              color="warning"
              subtitle="Click to mark"
              onClick={() => window.location.href = '/teacher/attendance'}
            />
          </div>

          {/* Current/Next Class Alert */}
          {(currentPeriod || nextClass) && (
            <div className={`rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
              currentPeriod
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  currentPeriod
                    ? 'bg-green-100 dark:bg-green-900/40 animate-pulse'
                    : 'bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  {currentPeriod ? (
                    <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentPeriod ? 'Currently Teaching' : 'Up Next'}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentPeriod ? 'Class in progress' : 'Your next class starts soon'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Class</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {(currentPeriod || nextClass)?.class?.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Subject</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {(currentPeriod || nextClass)?.subject?.subject_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {(currentPeriod || nextClass)?.period_slot?.start_time} - {(currentPeriod || nextClass)?.period_slot?.end_time}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          (Period {(currentPeriod || nextClass)?.period_slot?.period_number})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {nextClass && !currentPeriod && (
                    <div className="text-center">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Time until class</div>
                      <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200 dark:text-slate-700"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-emerald-500"
                            strokeDasharray={2 * Math.PI * 60}
                            strokeDashoffset={2 * Math.PI * 60 * (1 - getProgressToNextClass() / 100)}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {getProgressToNextClass()}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Link
                    to="/teacher/today"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg group"
                  >
                    View Full Schedule
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Today's Schedule & Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Today's Schedule</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Your classes for today</p>
                    </div>
                  </div>
                  <Link
                    to="/teacher/today"
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 group"
                  >
                    View all
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {todayClasses.length > 0 ? (
                  todayClasses.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                        currentPeriod?.id === entry.id
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {entry.period_slot?.period_number}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Period</span>
                        </div>
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                          style={{ backgroundColor: entry.subject?.color_code || '#10b981' }}
                        >
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{entry.subject?.subject_name}</p>
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
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coffee className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No classes scheduled for today</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Enjoy your free time!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notice Board */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notice Board</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Important announcements</p>
                    </div>
                  </div>
                  <Link
                    to="/teacher/notices"
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 group"
                  >
                    View all
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {notices.length > 0 ? (
                  notices.map((notice, index) => (
                    <div
                      key={notice.id}
                      className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-300 hover:shadow-md"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{notice.title}</h4>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
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
                      <div className="flex items-center gap-2 mt-3">
                        <Bell className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {format(new Date(notice.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No notices available</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Check back later for updates</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/teacher/attendance"
              className="glass-card p-4 text-center hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium text-slate-900 dark:text-white">Mark Attendance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record today's attendance</p>
            </Link>

            <Link
              to="/teacher/leave"
              className="glass-card p-4 text-center hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-medium text-slate-900 dark:text-white">Leave Request</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apply for leave</p>
            </Link>

            <Link
              to="/teacher/timetable"
              className="glass-card p-4 text-center hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="font-medium text-slate-900 dark:text-white">Weekly Schedule</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">View full timetable</p>
            </Link>

            <Link
              to="/teacher/profile"
              className="glass-card p-4 text-center hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-medium text-slate-900 dark:text-white">My Profile</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update information</p>
            </Link>
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
      `}</style>
    </div>
  );
}