import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import {
  BookOpen, GraduationCap, Calendar, ChevronLeft, ChevronRight,
  Coffee, AlertCircle, Clock, User, Home, Sparkles,
  TrendingUp, Award, Bell, Shield, Zap, Filter
} from 'lucide-react';
import { getCollectionData, queryWhere, getDocumentData } from '../../lib/firestore-helpers';
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
  day_of_week: string | number;
  period_slot_id: string;
  period_number?: number;
  class: { id: string; full_name: string } | null;
  subject: { id: string; subject_name: string; color_code: string } | null;
  room_number?: string;
}

const DAYS = [
  { value: 'monday', label: 'Monday', short: 'Mon', index: 0, full: 'Monday' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue', index: 1, full: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed', index: 2, full: 'Wednesday' },
  { value: 'thursday', label: 'Thursday', short: 'Thu', index: 3, full: 'Thursday' },
  { value: 'friday', label: 'Friday', short: 'Fri', index: 4, full: 'Friday' },
  { value: 'saturday', label: 'Saturday', short: 'Sat', index: 5, full: 'Saturday' },
];

const DAY_MAPPING = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

const getDefaultPeriodInfo = (periodNumber: number, isSaturday: boolean = false) => {
  const bucket = isSaturday ? DEFAULT_PERIOD_TIMES.saturday : DEFAULT_PERIOD_TIMES.weekday;
  return bucket[periodNumber] ?? { start_time: '08:00', end_time: '08:45', is_break: false, break_name: null };
};

export function WeeklyTimetablePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const ttData = await getCollectionData<any>('timetable_entries');
      const ttFiltered = ttData.filter(t => t.teacher_id === user.id);
      const allPeriodSlots = await getCollectionData<any>('period_slots');
      
      let pData = await queryWhere('period_slots', 'day_of_week', '==', 0);
      if (!pData.length) {
        const mondaySlots = allPeriodSlots.filter((p:any) => normalizeDayValue(p.day_of_week) === 'monday');
        pData = mondaySlots.length ? mondaySlots : allPeriodSlots.filter((p:any) => p.day_of_week === 0 || p.day_of_week === '0');
      }
      
      if (!pData.length && ttFiltered.length) {
        const uniquePeriods = Array.from(new Set(ttFiltered.map((entry:any) => entry.period_number).filter((n): n is number => typeof n === 'number'))).sort((a, b) => a - b);
        pData = uniquePeriods.map((periodNumber) => {
          const isSaturday = false;
          const fallback = getDefaultPeriodInfo(periodNumber, isSaturday);
          return {
            id: `fallback-${periodNumber}`,
            period_number: periodNumber,
            day_of_week: 0,
            start_time: fallback.start_time,
            end_time: fallback.end_time,
            is_break: fallback.is_break,
            break_name: fallback.break_name,
          };
        });
      }

      const sData = await Promise.all(ttFiltered.map(async (val) => {
        const classData = val.class_id ? await getDocumentData('classes', val.class_id) : null;
        const subjectData = val.subject_id ? await getDocumentData('subjects', val.subject_id) : null;
        return {
          id: val.id,
          day_of_week: val.day_of_week,
          period_slot_id: val.period_slot_id,
          period_number: val.period_number,
          room_number: val.room_number,
          class: classData ? { ...classData, id: val.class_id } : null,
          subject: subjectData ? { ...subjectData, id: val.subject_id } : null,
        } as ScheduleEntry;
      }));

      setSchedule(sData);
      const sortedPeriods = pData.sort((a: any, b: any) => (a.period_number || 0) - (b.period_number || 0));
      setPeriodSlots(sortedPeriods);
    } finally {
      setLoading(false);
    }
  };

  const getEntry = (day: string, periodSlotId: string, periodNumber?: number) => {
    return schedule.find(e => normalizeDayValue(e.day_of_week) === day && (
      (e.period_slot_id && e.period_slot_id === periodSlotId) ||
      (e.period_number != null && periodNumber != null && e.period_number === periodNumber)
    ));
  };

  const isToday = (dayIndex: number) => {
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;
    return todayIndex === dayIndex && isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  };

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getWeekRange = () => {
    const start = format(weekStart, 'MMM dd');
    const end = format(addDays(weekStart, 5), 'MMM dd, yyyy');
    return `${start} - ${end}`;
  };

  if (loading) return <PageLoader message="Loading weekly timetable..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Weekly Timetable</h1>
                  <p className="text-indigo-100 mt-1">Your complete weekly schedule</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>Teacher Portal</span>
              </div>
            </div>

            {/* Week Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-5 py-2 font-medium bg-white/15 rounded-lg backdrop-blur-sm">
                  {getWeekRange()}
                </span>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{format(currentTime, 'hh:mm a')}</span>
              </div>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-36">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time / Period
                      </div>
                    </th>
                    {DAYS.map(day => (
                      <th
                        key={day.value}
                        className={`px-4 py-4 text-center transition-all ${
                          isToday(day.index)
                            ? 'bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-slate-900 dark:text-white text-lg">
                            {day.short}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {format(addDays(weekStart, day.index), 'MMM dd')}
                          </span>
                          {isToday(day.index) && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <Sparkles className="w-3 h-3" />
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {periodSlots.map((period, idx) => {
                    const duration = getDuration(period.start_time, period.end_time);
                    const isBreak = period.is_break;
                    
                    return (
                      <tr
                        key={period.id}
                        className={`transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          isBreak ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                        }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {/* Period Column */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                              isBreak
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                            }`}>
                              {isBreak ? (
                                <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <span className="font-bold text-lg">
                                  {period.period_number}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {isBreak ? period.break_name || 'Break' : `Period ${period.period_number}`}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {period.start_time} - {period.end_time}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {duration}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Day Columns */}
                        {DAYS.map(day => {
                          const entry = getEntry(day.value, period.id, period.period_number);
                          const isCurrentDay = isToday(day.index);
                          const isSaturday = day.value === 'saturday';

                          return (
                            <td
                              key={day.value}
                              className={`px-3 py-3 align-top ${
                                isCurrentDay ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10' : ''
                              }`}
                            >
                              {isBreak ? (
                                <div className="flex items-center justify-center h-full min-h-[80px]">
                                  <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                                    {period.break_name || 'Break'}
                                  </span>
                                </div>
                              ) : entry ? (
                                <div
                                  className="group p-3 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                                  style={{
                                    backgroundColor: `${entry.subject?.color_code || '#6366f1'}10`,
                                    borderLeft: `4px solid ${entry.subject?.color_code || '#6366f1'}`
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4" style={{ color: entry.subject?.color_code || '#6366f1' }} />
                                    <span
                                      className="font-semibold text-sm truncate"
                                      style={{ color: entry.subject?.color_code || '#6366f1' }}
                                    >
                                      {entry.subject?.subject_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                      {entry.class?.full_name}
                                    </span>
                                  </div>
                                  {entry.room_number && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Home className="w-3 h-3 text-slate-400" />
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Room {entry.room_number}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full min-h-[80px]">
                                  <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {periodSlots.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Timetable Found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your weekly schedule hasn't been configured yet.
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Please contact your administrator.
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {periodSlots.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{periodSlots.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Periods</p>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {new Set(schedule.map(s => s.subject?.subject_name)).size}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Subjects</p>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                  <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {periodSlots.filter(p => p.is_break).length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Breaks</p>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Math.round(periodSlots.filter(p => !p.is_break).length * 0.45 * 5)}h
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Weekly Hours</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-5 py-4 glass-card rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Teaching Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Break</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Current Period</span>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium mb-2">Timetable Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Hover over any class to see more details</li>
                  <li>Use navigation arrows to view different weeks</li>
                  <li>Today's column is highlighted for easy reference</li>
                  <li>Breaks are marked with coffee icon for easy identification</li>
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
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
      `}</style>
    </div>
  );
}