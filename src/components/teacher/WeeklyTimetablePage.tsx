import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import {
  BookOpen, GraduationCap, Calendar, ChevronLeft, ChevronRight,
  Coffee, AlertCircle,
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
  { value: 'monday', label: 'Monday', short: 'Mon', index: 0 },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue', index: 1 },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed', index: 2 },
  { value: 'thursday', label: 'Thursday', short: 'Thu', index: 3 },
  { value: 'friday', label: 'Friday', short: 'Fri', index: 4 },
  { value: 'saturday', label: 'Saturday', short: 'Sat', index: 5 },
];

const DAY_MAPPING = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_PERIOD_TIMES: Record<'weekday' | 'saturday', Record<number, { start_time: string; end_time: string; is_break: boolean; break_name: string | null }>> = {
  weekday: {
    1: { start_time: '10:15', end_time: '11:00', is_break: false, break_name: null },
    2: { start_time: '11:00', end_time: '11:45', is_break: false, break_name: null },
    3: { start_time: '11:45', end_time: '12:30', is_break: false, break_name: null },
    4: { start_time: '12:30', end_time: '13:15', is_break: false, break_name: null },
    5: { start_time: '13:15', end_time: '14:00', is_break: true, break_name: 'Lunch Break' },
    6: { start_time: '14:00', end_time: '14:40', is_break: false, break_name: null },
    7: { start_time: '14:40', end_time: '15:20', is_break: false, break_name: null },
    8: { start_time: '15:20', end_time: '16:00', is_break: false, break_name: null },
  },
  saturday: {
    1: { start_time: '06:15', end_time: '07:00', is_break: false, break_name: null },
    2: { start_time: '07:00', end_time: '07:45', is_break: false, break_name: null },
    3: { start_time: '07:45', end_time: '08:30', is_break: false, break_name: null },
    4: { start_time: '08:30', end_time: '09:15', is_break: false, break_name: null },
    5: { start_time: '09:15', end_time: '09:30', is_break: true, break_name: 'Short Break' },
    6: { start_time: '09:30', end_time: '10:10', is_break: false, break_name: null },
    7: { start_time: '10:10', end_time: '10:50', is_break: false, break_name: null },
    8: { start_time: '10:50', end_time: '11:30', is_break: false, break_name: null },
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

const getDefaultPeriodInfo = (periodNumber: number) => {
  return DEFAULT_PERIOD_TIMES.weekday[periodNumber] ?? { start_time: '10:15', end_time: '11:00', is_break: false, break_name: null };
};

export function WeeklyTimetablePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Get unique period slots (one day is enough since structure is same)
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
          const fallback = getDefaultPeriodInfo(periodNumber);
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
    // Convert Sunday-based (0=Sun) to Monday-based (0=Mon)
    const todayIndex = today === 0 ? 6 : today - 1;
    return todayIndex === dayIndex;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  };

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  if (loading) return <PageLoader message="Loading timetable..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Weekly Timetable</h1>
              <p className="text-blue-100">Your complete weekly schedule</p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 font-medium bg-white/10 rounded-lg">
              {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 5), 'MMM dd, yyyy')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-32">
                  Time
                </th>
                {DAYS.map(day => (
                  <th
                    key={day.value}
                    className={`px-4 py-3 text-center ${
                      isToday(day.index)
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {day.short}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {format(addDays(weekStart, day.index), 'MMM dd')}
                      </span>
                      {isToday(day.index) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          Today
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {periodSlots.map((period) => {
                const duration = getDuration(period.start_time, period.end_time);

                return (
                  <tr
                    key={period.id}
                    className={period.is_break ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
                  >
                    {/* Time Column */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          period.is_break
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {period.is_break ? (
                            <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {period.period_number}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {period.is_break ? period.break_name : `Period ${period.period_number}`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {period.start_time} - {period.end_time}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {duration} min
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Day Columns */}
                    {DAYS.map(day => {
                      const entry = getEntry(day.value, period.id, period.period_number);
                      const today = isToday(day.index);

                      return (
                        <td
                          key={day.value}
                          className={`px-2 py-2 ${today ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                        >
                          {period.is_break ? (
                            <div className="flex items-center justify-center h-full py-4">
                              <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                                {period.break_name || 'Break'}
                              </span>
                            </div>
                          ) : entry ? (
                            <div
                              className="p-3 rounded-xl"
                              style={{
                                backgroundColor: `${entry.subject?.color_code || '#3b82f6'}15`,
                                borderLeft: `4px solid ${entry.subject?.color_code || '#3b82f6'}`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4" style={{ color: entry.subject?.color_code || '#3b82f6' }} />
                                <span
                                  className="font-semibold text-sm"
                                  style={{ color: entry.subject?.color_code || '#3b82f6' }}
                                >
                                  {entry.subject?.subject_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {entry.class?.full_name}
                                </span>
                              </div>
                              {entry.room_number && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                                  Room: {entry.room_number}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full py-4">
                              <span className="text-slate-300 dark:text-slate-600">-</span>
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
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400">No periods configured</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <span className="text-sm text-slate-500 dark:text-slate-400">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Teaching Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Break</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Today</span>
        </div>
      </div>
    </div>
  );
}
