import { useState, useEffect } from 'react';
import {
  Clock, Coffee, AlertCircle, Calendar, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getCollectionData } from '../../lib/firestore-helpers';
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

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
];

const DAY_SCHEDULES = [
  {
    type: 'Mon-Fri',
    timing: '10:15 AM - 4:00 PM',
    schedule: [
      { num: 1, time: '10:15 - 11:00', duration: '45 min', type: 'class' },
      { num: 2, time: '11:00 - 11:45', duration: '45 min', type: 'class' },
      { num: 3, time: '11:45 - 12:30', duration: '45 min', type: 'class' },
      { num: 4, time: '12:30 - 1:15', duration: '45 min', type: 'class' },
      { num: 0, time: '1:15 - 2:00', duration: '45 min', type: 'break', name: 'Lunch Break' },
      { num: 6, time: '2:00 - 2:40', duration: '40 min', type: 'class' },
      { num: 7, time: '2:40 - 3:20', duration: '40 min', type: 'class' },
      { num: 8, time: '3:20 - 4:00', duration: '40 min', type: 'class' },
    ]
  },
  {
    type: 'Saturday',
    timing: '6:15 AM - 11:30 AM',
    schedule: [
      { num: 1, time: '6:15 - 7:00', duration: '45 min', type: 'class' },
      { num: 2, time: '7:00 - 7:45', duration: '45 min', type: 'class' },
      { num: 3, time: '7:45 - 8:30', duration: '45 min', type: 'class' },
      { num: 4, time: '8:30 - 9:15', duration: '45 min', type: 'class' },
      { num: 0, time: '9:15 - 9:30', duration: '15 min', type: 'break', name: 'Short Break' },
      { num: 6, time: '9:30 - 10:10', duration: '40 min', type: 'class' },
      { num: 7, time: '10:10 - 10:50', duration: '40 min', type: 'class' },
      { num: 8, time: '10:50 - 11:30', duration: '40 min', type: 'class' },
    ]
  }
];

export function PeriodSetupPage() {
  const [periodsByDay, setPeriodsByDay] = useState<Record<number, PeriodSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedView, setExpandedView] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    const data = await getCollectionData<PeriodSlot>('period_slots') || [];

    const grouped: Record<number, PeriodSlot[]> = {};
    (data || []).forEach((period: PeriodSlot) => {
      if (!grouped[period.day_of_week]) {
        grouped[period.day_of_week] = [];
      }
      grouped[period.day_of_week].push(period);
    });
    setPeriodsByDay(grouped);
    setLoading(false);
  };

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return `${Math.floor(diff / 60) > 0 ? Math.floor(diff / 60) + 'h ' : ''}${diff % 60 > 0 ? (diff % 60) + 'm' : ''}`.trim();
  };

  if (loading) return <PageLoader message="Loading period schedule..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Period Schedule</h1>
            <p className="text-blue-100">School timing configuration</p>
          </div>
        </div>
      </div>

      {/* Schedule Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DAY_SCHEDULES.map((schedule, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className={`p-4 ${idx === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{schedule.type}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{schedule.timing}</p>
                </div>
                <button
                  onClick={() => setExpandedView(!expandedView)}
                  className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {expandedView ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {expandedView && (
              <div className="p-4 space-y-2">
                {schedule.schedule.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3 rounded-xl ${
                      item.type === 'break'
                        ? 'bg-amber-50 dark:bg-amber-900/10'
                        : 'bg-slate-50 dark:bg-slate-700/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'break'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {item.type === 'break' ? (
                        <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <span className="font-bold text-blue-600 dark:text-blue-400">{item.num}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.type === 'break' ? item.name : `Period ${item.num}`}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.time}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Day-by-Day View */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Detailed Period Configuration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click on a day to view period details</p>
        </div>

        {/* Day Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex overflow-x-auto">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day.value
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Periods List */}
        <div className="p-4">
          {periodsByDay[selectedDay] && periodsByDay[selectedDay].length > 0 ? (
            <div className="space-y-2">
              {periodsByDay[selectedDay].map((period) => (
                <div
                  key={period.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    period.is_break
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-700/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    period.is_break
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-blue-100 dark:bg-blue-900/40'
                  }`}>
                    {period.is_break ? (
                      <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {period.period_number}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {period.is_break
                        ? period.break_name || 'Break'
                        : `Period ${period.period_number}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {period.start_time} - {period.end_time}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                      {getDuration(period.start_time, period.end_time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-500 dark:text-slate-400">No periods configured for {DAYS[selectedDay].label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Working Days</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">6 Days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Periods/Day</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">8 Periods</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Breaks</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedDay === 5 ? '1 Short' : '1 Lunch'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
