import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock, GraduationCap, Calendar, Coffee,
  CheckCircle, Play, AlertCircle, User,
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

const DAY_INFO: Record<number, { name: string; startTime: string; endTime: string }> = {
  0: { name: 'Sunday', startTime: '-', endTime: '-' },
  1: { name: 'Monday', startTime: '10:15 AM', endTime: '4:00 PM' },
  2: { name: 'Tuesday', startTime: '10:15 AM', endTime: '4:00 PM' },
  3: { name: 'Wednesday', startTime: '10:15 AM', endTime: '4:00 PM' },
  4: { name: 'Thursday', startTime: '10:15 AM', endTime: '4:00 PM' },
  5: { name: 'Friday', startTime: '10:15 AM', endTime: '4:00 PM' },
  6: { name: 'Saturday', startTime: '6:15 AM', endTime: '11:30 AM' },
};

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

const getDefaultPeriodInfo = (dayIndex: number, periodNumber: number) => {
  const bucket = dayIndex === 6 ? DEFAULT_PERIOD_TIMES.saturday : DEFAULT_PERIOD_TIMES.weekday;
  return bucket[periodNumber] ?? { start_time: '00:00', end_time: '00:00', is_break: false, break_name: null };
};

export function TodaySchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);

  const today = new Date();
  const dayOfWeek = DAYS[today.getDay()];
  const dayIndex = today.getDay();

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
      // Get periods for today (day_index matches day_of_week in DB)
      const ttData = await getCollectionData<any>('timetable_entries');
        let ttFiltered = ttData.filter(t => t.teacher_id === user.id && matchesDayValue(t.day_of_week));
        console.debug('[TodaySchedule] raw timetable entries count', ttData.length);
        console.debug('[TodaySchedule] filtered by teacher+day', ttFiltered.map((t:any) => ({ id: t.id, teacher_id: t.teacher_id, day_of_week: t.day_of_week, period_number: t.period_number, period_slot_id: t.period_slot_id })));

      const allPeriodSlots = await getCollectionData<any>('period_slots');
        const periodSlotDayIndex = dayIndex === 0 ? 0 : dayIndex - 1; // admin stores 0..5 for Mon..Sat
      const pData = (allPeriodSlots || []).filter((p:any) => {
        // Match either numeric day index (0..5) or string day name
        if (p.day_of_week === periodSlotDayIndex) return true;
        const slotDay = normalizeDayValue(p.day_of_week);
        return slotDay === dayOfWeek;
      });

      // Fallback: if no timetable entries matched by explicit day, try loose matches
      if (!ttFiltered.length) {
        ttFiltered = ttData.filter((t:any) => {
          const teacherMatch = t.teacher_id === user.id || t.teacher_id === (user?.email || null) || t.teacher_id === (user?.id || null);
          if (!teacherMatch) return false;
          if (matchesDayValue(t.day_of_week)) return true;
          if (t.day_of_week === undefined || t.day_of_week === null) {
            // if admin saved entries without day_of_week but with period_number, include them
            return t.period_number != null;
          }
          // numeric match against periodSlotDayIndex
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
      console.debug('[TodaySchedule] period slots (matched)', sortedPeriods.map((p:any) => ({ id: p.id, day_of_week: p.day_of_week, period_number: p.period_number })));
      setPeriodSlots(sortedPeriods);
      console.debug('[TodaySchedule] built schedule entries', sData);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  const isValidTime = (time: string) => /^\d{2}:\d{2}$/.test(time);

  const getStatus = (period: PeriodSlot) => {
    if (period.is_break) return 'break';
    if (!isValidTime(period.start_time) || !isValidTime(period.end_time)) return 'upcoming';
    if (currentTime >= period.start_time && currentTime < period.end_time) return 'current';
    if (currentTime >= period.end_time) return 'completed';
    return 'upcoming';
  };

  const getCurrentPeriodInfo = () => {
    for (const period of periodSlots) {
      if (!isValidTime(period.start_time) || !isValidTime(period.end_time)) continue;
      if (currentTime >= period.start_time && currentTime < period.end_time) {
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
  const totalClasses = schedule.length;
  const completedClasses = periodSlots.filter(p => !p.is_break && currentTime >= p.end_time).length;
  const isWorkingDay = dayIndex >= 1 && dayIndex <= 6;
  const todayInfo = DAY_INFO[dayIndex];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Today's Schedule</h1>
              <p className="text-blue-100">
                {format(today, 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-blue-100">{todayInfo.name}</p>
              <p className="text-lg font-semibold">{todayInfo.startTime} - {todayInfo.endTime}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isWorkingDay && totalClasses > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Day Progress</span>
              <span>{completedClasses} of {periodSlots.filter(p => !p.is_break).length} periods done</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{
                  width: `${periodSlots.length > 0
                    ? (periodSlots.filter(p => currentTime >= p.end_time).length / periodSlots.length) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Status Card */}
      {currentInfo && (
        <div className={`rounded-2xl p-6 shadow-sm border ${
          currentInfo.status === 'current'
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : currentInfo.status === 'break'
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
            : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              currentInfo.status === 'break'
                ? 'bg-amber-100 dark:bg-amber-900/40'
                : currentInfo.status === 'current'
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              {currentInfo.status === 'break' ? (
                <Coffee className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              ) : currentInfo.status === 'current' ? (
                <Play className="w-7 h-7 text-green-600 dark:text-green-400" />
              ) : (
                <CheckCircle className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentInfo.status === 'break' ? 'Currently On Break' :
                 currentInfo.status === 'current' ? 'Currently Teaching' : 'Current Period'}
              </p>
              {currentInfo.entry ? (
                <div className="mt-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentInfo.entry.subject?.subject_name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {currentInfo.entry.class?.full_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentInfo.period.start_time} - {currentInfo.period.end_time}
                    </span>
                  </div>
                </div>
              ) : currentInfo.period.is_break ? (
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {currentInfo.period.break_name || 'Break Time'}
                </h3>
              ) : (
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Free Period</h3>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentTime}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Current Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Daily Schedule</h2>
        </div>

        {periodSlots.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {periodSlots.map((period) => {
              const entry = schedule.find(e => (
                e.period_slot_id ? e.period_slot_id === period.id : e.period_number === period.period_number
              ));
              const status = getStatus(period);

              return (
                <div
                  key={period.id}
                  className={`p-4 flex items-center gap-4 transition-colors ${
                    status === 'current' ? 'bg-green-50 dark:bg-green-900/10' :
                    status === 'break' ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                  }`}
                >
                  {/* Period Number */}
                  <div className="flex items-center gap-3 w-16">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      period.is_break
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : status === 'current'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {period.is_break ? (
                        <Coffee className="w-5 h-5" />
                      ) : (
                        period.period_number
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="w-24">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {period.start_time}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      to {period.end_time}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {period.is_break ? (
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        {period.break_name || 'Break'}
                      </p>
                    ) : entry ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.subject?.color_code || '#3b82f6' }}
                          />
                          <p className="font-medium text-slate-900 dark:text-white">
                            {entry.subject?.subject_name || 'Class'}
                          </p>
                          {status === 'current' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              Now
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.class?.full_name || 'Assigned class'}
                        </p>
                        {status === 'current' && !period.is_break && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Free Period</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400">No classes scheduled for today</p>
            {!isWorkingDay && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">It's a Sunday!</p>
            )}
          </div>
        )}
      </div>

      {/* Debug Panel */}
      <div className="mt-4">
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="text-xs text-slate-500 hover:underline"
        >
          {debugOpen ? 'Hide debug info' : 'Show debug info'}
        </button>
        {debugOpen && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded">
            <h4 className="font-medium mb-2">Debug: fetched data</h4>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <div className="mb-2">
                <strong>Schedule entries:</strong>
                <pre className="whitespace-pre-wrap text-[10px] max-h-40 overflow-auto">{JSON.stringify(schedule, null, 2)}</pre>
              </div>
              <div>
                <strong>Period slots:</strong>
                <pre className="whitespace-pre-wrap text-[10px] max-h-40 overflow-auto">{JSON.stringify(periodSlots, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
