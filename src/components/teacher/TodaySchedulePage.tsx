import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock, BookOpen, GraduationCap, Calendar, Coffee,
  CheckCircle, Play, AlertCircle, User,
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
  period_slot_id: string;
  class: { id: string; full_name: string } | null;
  subject: { id: string; subject_name: string; color_code?: string } | null;
  room_number?: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_INFO: Record<number, { name: string; startTime: string; endTime: string }> = {
  0: { name: 'Sunday', startTime: '-', endTime: '-' },
  1: { name: 'Monday', startTime: '10:15 AM', endTime: '4:00 PM' },
  2: { name: 'Tuesday', startTime: '10:15 AM', endTime: '4:00 PM' },
  3: { name: 'Wednesday', startTime: '10:15 AM', endTime: '4:00 PM' },
  4: { name: 'Thursday', startTime: '10:15 AM', endTime: '4:00 PM' },
  5: { name: 'Friday', startTime: '10:15 AM', endTime: '4:00 PM' },
  6: { name: 'Saturday', startTime: '6:15 AM', endTime: '11:30 AM' },
};

export function TodaySchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dayOfWeek = DAYS[today.getDay()];
  const dayIndex = today.getDay();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Get periods for today (day_index matches day_of_week in DB)
      const ttData = await getCollectionData<any>('timetable_entries');
      const ttFiltered = ttData.filter(t => t.teacher_id === user.id && t.day_of_week === dayOfWeek);
      const pData = await queryWhere('period_slots', 'day_of_week', '==', dayIndex === 0 ? 1 : dayIndex);

      const sData = await Promise.all(ttFiltered.map(async (val) => {
        const classData = val.class_id ? await getDocumentData(`classes/${val.class_id}`) : null;
        const subjectData = val.subject_id ? await getDocumentData(`subjects/${val.subject_id}`) : null;
        return {
          id: val.id,
          period_slot_id: val.period_slot_id,
          room_number: val.room_number,
          class: classData ? { id: val.class_id, ...classData } : null,
          subject: subjectData ? { id: val.subject_id, ...subjectData } : null,
        } as ScheduleEntry;
      }));

      setSchedule(sData);
      const sortedPeriods = pData.sort((a: any, b: any) => (a.period_number || 0) - (b.period_number || 0));
      setPeriodSlots(sortedPeriods);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  const getStatus = (period: PeriodSlot) => {
    if (period.is_break) return 'break';
    if (currentTime >= period.start_time && currentTime < period.end_time) return 'current';
    if (currentTime >= period.end_time) return 'completed';
    return 'upcoming';
  };

  const getCurrentPeriodInfo = () => {
    for (const period of periodSlots) {
      if (currentTime >= period.start_time && currentTime < period.end_time) {
        const entry = schedule.find(e => e.period_slot_id === period.id);
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
              const entry = schedule.find(e => e.period_slot_id === period.id);
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
                            {entry.subject?.subject_name}
                          </p>
                          {status === 'current' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              Now
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.class?.full_name}
                          {entry.room_number && ` - Room ${entry.room_number}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500">Free Period</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {status === 'completed' && !period.is_break && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Done
                      </span>
                    )}
                    {status === 'current' && !period.is_break && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        In Progress
                      </span>
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
    </div>
  );
}
