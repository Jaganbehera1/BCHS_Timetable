import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock, GraduationCap, Calendar, Coffee,
  CheckCircle, Play, AlertCircle, User,
  BookOpen, Bell, Sparkles, Zap, Shield,
  TrendingUp, Award, ChevronRight, Home
} from 'lucide-react';
import { getCollectionData, getDocumentData } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../shared/LoadingSpinner';

interface PeriodSlot {
  id: string;
  period_number: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_name: string | null;
}

interface ScheduleEntry {
  id: string;
  period_slot_id?: string;
  period_number?: number;
  class: { id: string; full_name: string } | null;
  subject: { id: string; subject_name: string; color_code?: string } | null;
  room_number?: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_MAPPING = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_INFO: Record<number, { name: string; startTime: string; endTime: string; color: string }> = {
  0: { name: 'Sunday', startTime: '-', endTime: '-', color: 'from-red-500 to-pink-500' },
  1: { name: 'Monday', startTime: '8:00 AM', endTime: '2:25 PM', color: 'from-blue-500 to-cyan-500' },
  2: { name: 'Tuesday', startTime: '8:00 AM', endTime: '2:25 PM', color: 'from-blue-500 to-cyan-500' },
  3: { name: 'Wednesday', startTime: '8:00 AM', endTime: '2:25 PM', color: 'from-blue-500 to-cyan-500' },
  4: { name: 'Thursday', startTime: '8:00 AM', endTime: '2:25 PM', color: 'from-blue-500 to-cyan-500' },
  5: { name: 'Friday', startTime: '8:00 AM', endTime: '2:25 PM', color: 'from-blue-500 to-cyan-500' },
  6: { name: 'Saturday', startTime: '8:00 AM', endTime: '1:05 PM', color: 'from-emerald-500 to-teal-500' },
};

const DEFAULT_PERIOD_TIMES: Record<'weekday' | 'saturday', Record<number, { start_time: string; end_time: string; is_break: boolean; break_name: string | null }>> = {
  weekday: {
    1: { start_time: '08:00', end_time: '08:45', is_break: false, break_name: null },
    2: { start_time: '08:50', end_time: '09:35', is_break: false, break_name: null },
    3: { start_time: '09:40', end_time: '10:25', is_break: false, break_name: null },
    4: { start_time: '10:30', end_time: '11:15', is_break: false, break_name: null },
    5: { start_time: '11:15', end_time: '12:00', is_break: true, break_name: 'Lunch Break' },
    6: { start_time: '12:00', end_time: '12:45', is_break: false, break_name: null },
    7: { start_time: '12:50', end_time: '13:35', is_break: false, break_name: null },
    8: { start_time: '13:40', end_time: '14:25', is_break: false, break_name: null },
  },
  saturday: {
    1: { start_time: '08:00', end_time: '08:45', is_break: false, break_name: null },
    2: { start_time: '08:50', end_time: '09:35', is_break: false, break_name: null },
    3: { start_time: '09:40', end_time: '10:25', is_break: false, break_name: null },
    4: { start_time: '10:30', end_time: '11:15', is_break: false, break_name: null },
    5: { start_time: '11:15', end_time: '11:30', is_break: true, break_name: 'Short Break' },
    6: { start_time: '11:30', end_time: '12:15', is_break: false, break_name: null },
    7: { start_time: '12:20', end_time: '13:05', is_break: false, break_name: null },
  },
};

const getDefaultPeriodInfo = (dayIndex: number, periodNumber: number) => {
  const bucket = dayIndex === 6 ? DEFAULT_PERIOD_TIMES.saturday : DEFAULT_PERIOD_TIMES.weekday;
  return bucket[periodNumber] ?? { start_time: '00:00', end_time: '00:00', is_break: false, break_name: null };
};

export function TodaySchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date();
  const dayOfWeek = DAYS[today.getDay()];
  const dayIndex = today.getDay();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const matchesDayValue = (value: any) => {
    const normalized = normalizeDayValue(value);
    return normalized === dayOfWeek;
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const ttData = await getCollectionData<any>('timetable_entries');
      let ttFiltered = ttData.filter(t => t.teacher_id === user.id && matchesDayValue(t.day_of_week));

      const allPeriodSlots = await getCollectionData<any>('period_slots');
      const periodSlotDayIndex = dayIndex === 0 ? 0 : dayIndex - 1;
      let pData = (allPeriodSlots || []).filter((p:any) => {
        if (p.day_of_week === periodSlotDayIndex) return true;
        const slotDay = normalizeDayValue(p.day_of_week);
        return slotDay === dayOfWeek;
      });

      if (!ttFiltered.length) {
        ttFiltered = ttData.filter((t:any) => {
          const teacherMatch = t.teacher_id === user.id;
          if (!teacherMatch) return false;
          if (matchesDayValue(t.day_of_week)) return true;
          if (t.day_of_week === undefined || t.day_of_week === null) {
            return t.period_number != null;
          }
          if (!Number.isNaN(Number(t.day_of_week)) && Number(t.day_of_week) === periodSlotDayIndex) return true;
          return false;
        });
      }

      const sData = await Promise.all(ttFiltered.map(async (val) => {
        const classData = val.class_id ? await getDocumentData('classes', val.class_id) : null;
        const subjectData = val.subject_id ? await getDocumentData('subjects', val.subject_id) : null;
        return {
          id: val.id,
          period_slot_id: val.period_slot_id,
          period_number: val.period_number,
          room_number: val.room_number,
          class: classData ? { ...classData, id: val.class_id } : null,
          subject: subjectData ? { ...subjectData, id: val.subject_id } : null,
        } as ScheduleEntry;
      }));

      setSchedule(sData);
      let sortedPeriods = pData.sort((a: any, b: any) => (a.period_number || 0) - (b.period_number || 0));
      if (!sortedPeriods.length && sData.length) {
        const uniquePeriods = Array.from(new Set(sData.map((entry) => entry.period_number).filter((n): n is number => typeof n === 'number'))).sort((a, b) => a - b);
        sortedPeriods = uniquePeriods.map((periodNumber) => {
          const fallback = getDefaultPeriodInfo(dayIndex, periodNumber);
          return {
            id: `fallback-${dayOfWeek}-${periodNumber}`,
            period_number: periodNumber,
            day_of_week: dayIndex === 0 ? 0 : dayIndex - 1,
            start_time: fallback.start_time,
            end_time: fallback.end_time,
            is_break: fallback.is_break,
            break_name: fallback.break_name,
          };
        });
      }
      setPeriodSlots(sortedPeriods);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrentTime = () => {
    return format(currentTime, 'hh:mm:ss a');
  };

  const isValidTime = (time: string) => /^\d{2}:\d{2}$/.test(time);

  const getStatus = (period: PeriodSlot) => {
    if (period.is_break) return 'break';
    if (!isValidTime(period.start_time) || !isValidTime(period.end_time)) return 'upcoming';
    const now = format(currentTime, 'HH:mm');
    if (now >= period.start_time && now < period.end_time) return 'current';
    if (now >= period.end_time) return 'completed';
    return 'upcoming';
  };

  const getCurrentPeriodInfo = () => {
    for (const period of periodSlots) {
      if (!isValidTime(period.start_time) || !isValidTime(period.end_time)) continue;
      const now = format(currentTime, 'HH:mm');
      if (now >= period.start_time && now < period.end_time) {
        const entry = schedule.find(e => (
          e.period_slot_id ? e.period_slot_id === period.id : e.period_number === period.period_number
        ));
        return { period, entry, status: getStatus(period) };
      }
    }
    return null;
  };

  if (loading) return <PageLoader message="Loading today's schedule..." />;

  const currentInfo = getCurrentPeriodInfo();
  const totalPeriods = periodSlots.filter(p => !p.is_break).length;
  const completedPeriods = periodSlots.filter(p => !p.is_break && format(currentTime, 'HH:mm') >= p.end_time).length;
  const progress = totalPeriods > 0 ? (completedPeriods / totalPeriods) * 100 : 0;
  const isWorkingDay = dayIndex >= 1 && dayIndex <= 6;
  const todayInfo = DAY_INFO[dayIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className={`bg-gradient-to-r ${todayInfo.color} rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/80 mb-1">
                    <Home className="w-4 h-4" />
                    <span className="text-sm">Today's Schedule</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    {format(today, 'EEEE, MMMM dd, yyyy')}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-white/80">{todayInfo.name}</p>
                  <p className="text-lg font-semibold">{todayInfo.startTime} - {todayInfo.endTime}</p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-75 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Day Progress Bar */}
            {isWorkingDay && totalPeriods > 0 && (
              <div className="relative z-10 mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Day Progress
                  </span>
                  <span className="font-medium">{completedPeriods} of {totalPeriods} periods completed</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/30 animate-shimmer" />
                  </div>
                </div>
                <p className="text-right text-sm text-white/70 mt-1 mt-2">
                  {Math.round(progress)}% Complete
                </p>
              </div>
            )}
          </div>

          {/* Current Time Display */}
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrentTime()}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Current Time</span>
            </div>
          </div>

          {/* Current Status Card */}
          {currentInfo && (
            <div className={`rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
              currentInfo.status === 'current'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
                : currentInfo.status === 'break'
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  currentInfo.status === 'break'
                    ? 'bg-amber-100 dark:bg-amber-900/40 animate-pulse'
                    : currentInfo.status === 'current'
                    ? 'bg-green-100 dark:bg-green-900/40 animate-pulse'
                    : 'bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  {currentInfo.status === 'break' ? (
                    <Coffee className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  ) : currentInfo.status === 'current' ? (
                    <Play className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {currentInfo.status === 'break' ? 'Currently On Break' :
                     currentInfo.status === 'current' ? 'Currently Teaching' : 'Upcoming Period'}
                  </p>
                  {currentInfo.entry ? (
                    <div className="mt-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {currentInfo.entry.subject?.subject_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {currentInfo.entry.class?.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {currentInfo.period.start_time} - {currentInfo.period.end_time}
                        </span>
                        {currentInfo.entry.room_number && (
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Room {currentInfo.entry.room_number}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : currentInfo.period.is_break ? (
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {currentInfo.period.break_name || 'Break Time'}
                    </h3>
                  ) : (
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Free Period</h3>
                  )}
                </div>
                {currentInfo.status === 'current' && (
                  <div className="hidden sm:block">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin-slow" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule Timeline */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">Daily Schedule</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your complete timetable for today</p>
                </div>
              </div>
            </div>

            {periodSlots.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {periodSlots.map((period, index) => {
                  const entry = schedule.find(e => (
                    e.period_slot_id ? e.period_slot_id === period.id : e.period_number === period.period_number
                  ));
                  const status = getStatus(period);

                  return (
                    <div
                      key={period.id}
                      className={`group p-5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        status === 'current' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' :
                        status === 'break' ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-5">
                        {/* Period Number */}
                        <div className="w-20 flex-shrink-0">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${
                            period.is_break
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                              : status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : status === 'current'
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {period.is_break ? (
                              <Coffee className="w-6 h-6" />
                            ) : (
                              period.period_number
                            )}
                          </div>
                        </div>

                        {/* Time */}
                        <div className="w-28 flex-shrink-0">
                          <p className="text-base font-semibold text-slate-900 dark:text-white">
                            {period.start_time}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            to {period.end_time}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {period.is_break ? (
                            <div>
                              <p className="font-semibold text-amber-600 dark:text-amber-400 text-lg">
                                {period.break_name || 'Break'}
                              </p>
                              <p className="text-sm text-slate-500">Take a moment to relax</p>
                            </div>
                          ) : entry ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.subject?.color_code || '#6366f1' }}
                                />
                                <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                  {entry.subject?.subject_name || 'Class'}
                                </p>
                                {status === 'current' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                    <Play className="w-3 h-3" />
                                    In Progress
                                  </span>
                                )}
                                {status === 'completed' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {entry.class?.full_name || 'Assigned class'}
                              </p>
                              {entry.room_number && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Room: {entry.room_number}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-500 dark:text-slate-400 text-lg">Free Period</p>
                              <p className="text-sm text-slate-400">No class scheduled</p>
                            </div>
                          )}
                        </div>

                        {/* Status Icon */}
                        {status === 'current' && !period.is_break && (
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        )}
                        {status === 'completed' && !period.is_break && (
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Classes Scheduled
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {!isWorkingDay 
                    ? "It's a holiday! Enjoy your day off."
                    : "You have no classes scheduled for today"}
                </p>
                {!isWorkingDay && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <Coffee className="w-4 h-4" />
                    <span>Time to relax and recharge</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {isWorkingDay && totalPeriods > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed Classes</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {completedPeriods}
                </p>
                <p className="text-xs text-slate-400">out of {totalPeriods}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Remaining Classes</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {totalPeriods - completedPeriods}
                </p>
                <p className="text-xs text-slate-400">yet to complete</p>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium mb-2">Schedule Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Current period shows your ongoing class</li>
                  <li>Check your schedule regularly for updates</li>
                  <li>Break times are indicated with coffee icon</li>
                  <li>Completed periods are marked with checkmark</li>
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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
}