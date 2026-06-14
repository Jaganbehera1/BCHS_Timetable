import { useState, useEffect } from 'react';
import {
  Clock, Coffee, AlertCircle, Calendar, Info, ChevronDown, ChevronUp,
  Settings, Edit, Save, X, Plus, Trash2, RefreshCw, Sun, Moon,
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Printer,
  Download, Bell, BookOpen, Users, Layers, BarChart3
} from 'lucide-react';
import { getCollectionData, addDocument, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
import { PageLoader } from '../shared/LoadingSpinner';
import { Modal } from '../shared/Modal';
import { useForm } from 'react-hook-form';

interface PeriodSlot {
  id: string;
  period_number: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_name: string | null;
  duration?: string;
}

interface SchoolSetting {
  working_days: number[];
  sunday_holiday: boolean;
  school_name: string;
}

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon', full: 'Monday' },
  { value: 1, label: 'Tuesday', short: 'Tue', full: 'Tuesday' },
  { value: 2, label: 'Wednesday', short: 'Wed', full: 'Wednesday' },
  { value: 3, label: 'Thursday', short: 'Thu', full: 'Thursday' },
  { value: 4, label: 'Friday', short: 'Fri', full: 'Friday' },
  { value: 5, label: 'Saturday', short: 'Sat', full: 'Saturday' },
];

const DEFAULT_SCHEDULES = {
  weekdays: {
    periods: [
      { number: 1, start: '08:00', end: '08:45', type: 'class' },
      { number: 2, start: '08:50', end: '09:35', type: 'class' },
      { number: 3, start: '09:40', end: '10:25', type: 'class' },
      { number: 4, start: '10:30', end: '11:15', type: 'class' },
      { number: 0, start: '11:15', end: '12:00', type: 'break', name: 'Lunch Break' },
      { number: 5, start: '12:00', end: '12:45', type: 'class' },
      { number: 6, start: '12:50', end: '13:35', type: 'class' },
      { number: 7, start: '13:40', end: '14:25', type: 'class' },
      { number: 8, start: '14:30', end: '15:15', type: 'class' },
    ],
    totalPeriods: 8
  },
  saturday: {
    periods: [
      { number: 1, start: '08:00', end: '08:45', type: 'class' },
      { number: 2, start: '08:50', end: '09:35', type: 'class' },
      { number: 3, start: '09:40', end: '10:25', type: 'class' },
      { number: 0, start: '10:25', end: '10:40', type: 'break', name: 'Short Break' },
      { number: 4, start: '10:40', end: '11:25', type: 'class' },
      { number: 5, start: '11:30', end: '12:15', type: 'class' },
      { number: 6, start: '12:20', end: '13:05', type: 'class' },
    ],
    totalPeriods: 6
  }
};

export function PeriodSetupPage() {
  const [periodsByDay, setPeriodsByDay] = useState<Record<number, PeriodSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedView, setExpandedView] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodSlot | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSetting | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'class' | 'break'>('class');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchPeriods();
    fetchSchoolSettings();
  }, []);

  const fetchPeriods = async () => {
    try {
      const data = await getCollectionData<PeriodSlot>('period_slots') || [];
      const grouped: Record<number, PeriodSlot[]> = {};
      
      data.forEach((period: PeriodSlot) => {
        if (!grouped[period.day_of_week]) {
          grouped[period.day_of_week] = [];
        }
        grouped[period.day_of_week].push(period);
      });
      
      // Sort periods by number
      Object.keys(grouped).forEach(day => {
        grouped[parseInt(day)].sort((a, b) => a.period_number - b.period_number);
      });
      
      setPeriodsByDay(grouped);
    } catch (error) {
      console.error('Error fetching periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolSettings = async () => {
    try {
      const settings = await getCollectionData<any>('school_settings');
      if (settings && settings.length > 0) {
        setSchoolSettings(settings[0]);
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setSelectedPeriodType('class');
    reset({
      period_number: (periodsByDay[selectedDay]?.length || 0) + 1,
      start_time: '09:00',
      end_time: '09:45',
      is_break: false,
      break_name: '',
    });
    setModalOpen(true);
  };

  const handleEditPeriod = (period: PeriodSlot) => {
    setEditingPeriod(period);
    setSelectedPeriodType(period.is_break ? 'break' : 'class');
    reset({
      period_number: period.period_number,
      start_time: period.start_time,
      end_time: period.end_time,
      is_break: period.is_break,
      break_name: period.break_name || '',
    });
    setModalOpen(true);
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    try {
      await deleteDocument('period_slots', periodId);
      fetchPeriods();
    } catch (error) {
      console.error('Error deleting period:', error);
      alert('Failed to delete period');
    }
  };

  const onSubmitPeriod = async (data: any) => {
    setSaving(true);
    try {
      const periodData = {
        period_number: parseInt(data.period_number),
        day_of_week: selectedDay,
        start_time: data.start_time,
        end_time: data.end_time,
        is_break: selectedPeriodType === 'break',
        break_name: selectedPeriodType === 'break' ? data.break_name : null,
      };

      if (editingPeriod) {
        await updateDocument('period_slots', editingPeriod.id, periodData);
      } else {
        await addDocument('period_slots', periodData);
      }
      
      setModalOpen(false);
      fetchPeriods();
    } catch (error) {
      console.error('Error saving period:', error);
      alert('Failed to save period');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('This will reset all periods to default schedule. Continue?')) return;
    
    setSaving(true);
    try {
      // Delete existing periods
      for (const day of DAYS) {
        const existingPeriods = periodsByDay[day.value] || [];
        for (const period of existingPeriods) {
          await deleteDocument('period_slots', period.id);
        }
      }
      
      // Create default periods
      const isSaturday = (day: number) => day === 5;
      const schedule = (day: number) => isSaturday(day) ? DEFAULT_SCHEDULES.saturday.periods : DEFAULT_SCHEDULES.weekdays.periods;
      
      for (const day of DAYS) {
        const periods = schedule(day.value);
        for (const period of periods) {
          await addDocument('period_slots', {
            period_number: period.number,
            day_of_week: day.value,
            start_time: period.start,
            end_time: period.end,
            is_break: period.type === 'break',
            break_name: period.type === 'break' ? period.name : null,
          });
        }
      }
      
      await fetchPeriods();
      alert('Schedule reset to default successfully!');
    } catch (error) {
      console.error('Error resetting schedule:', error);
      alert('Failed to reset schedule');
    } finally {
      setSaving(false);
    }
  };

  const exportSchedule = () => {
    const exportData: any[] = [];
    
    DAYS.forEach(day => {
      const periods = periodsByDay[day.value] || [];
      periods.forEach(period => {
        exportData.push({
          'Day': day.label,
          'Period Number': period.period_number,
          'Type': period.is_break ? 'Break' : 'Class',
          'Break Name': period.break_name || '',
          'Start Time': period.start_time,
          'End Time': period.end_time,
          'Duration': getDuration(period.start_time, period.end_time)
        });
      });
    });
    
    const csv = convertToCSV(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `period_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';
    array.forEach(item => {
      let line = '';
      headers.forEach(header => {
        line += `"${item[header] || ''}",`;
      });
      str += line.slice(0, -1) + '\r\n';
    });
    return str;
  };

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = endMinutes - startMinutes;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getTotalPeriods = (day: number) => {
    return periodsByDay[day]?.filter(p => !p.is_break).length || 0;
  };

  const getTotalBreaks = (day: number) => {
    return periodsByDay[day]?.filter(p => p.is_break).length || 0;
  };

  const getDayTiming = (day: number) => {
    const periods = periodsByDay[day] || [];
    if (periods.length === 0) return 'Not configured';
    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    return `${firstPeriod.start_time} - ${lastPeriod.end_time}`;
  };

  if (loading) return <PageLoader message="Loading period schedule..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Period Schedule Setup</h1>
                  <p className="text-blue-100 mt-1">Configure school timing and period slots</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
                <button 
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium hidden sm:inline">Reset Default</span>
                </button>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    editMode 
                      ? 'bg-white text-blue-600 hover:bg-blue-50' 
                      : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20'
                  }`}
                >
                  {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  <span className="text-sm font-medium">{editMode ? 'Save Mode' : 'Edit Mode'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Working Days</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">6 Days</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">Monday - Saturday</div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg Periods/Day</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {Math.round(DAYS.reduce((sum, day) => sum + getTotalPeriods(day.value), 0) / 6)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Breaks</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {DAYS.reduce((sum, day) => sum + getTotalBreaks(day.value), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Slots</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {DAYS.reduce((sum, day) => sum + (periodsByDay[day.value]?.length || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`flex-1 min-w-[80px] px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDay === day.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{day.short}</span>
                    <span className="text-xs mt-1 opacity-75">{getTotalPeriods(day.value)} periods</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Period Schedule for Selected Day */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                    {DAYS[selectedDay].full} Schedule
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Timing: {getDayTiming(selectedDay)}
                  </p>
                </div>
                {editMode && (
                  <button
                    onClick={handleAddPeriod}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Period
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              {periodsByDay[selectedDay] && periodsByDay[selectedDay].length > 0 ? (
                <div className="space-y-3">
                  {periodsByDay[selectedDay].map((period, idx) => (
                    <div
                      key={period.id}
                      className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        period.is_break
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800 dark:hover:to-slate-700/50'
                      }`}
                    >
                      {/* Period Number */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        period.is_break
                          ? 'bg-amber-100 dark:bg-amber-900/40'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {period.is_break ? (
                          <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {period.period_number}
                          </span>
                        )}
                      </div>

                      {/* Period Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {period.is_break
                              ? period.break_name || 'Break'
                              : `Period ${period.period_number}`}
                          </p>
                          {period.is_break && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                              Break
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {period.start_time} - {period.end_time}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="text-right">
                        <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
                          {getDuration(period.start_time, period.end_time)}
                        </span>
                      </div>

                      {/* Actions */}
                      {editMode && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditPeriod(period)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePeriod(period.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Periods Configured
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    {DAYS[selectedDay].full} schedule is not set up yet
                  </p>
                  {editMode && (
                    <button onClick={handleAddPeriod} className="btn-primary inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add First Period
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Weekly Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quick view of all days schedule</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Day</th>
                    <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Timing</th>
                    <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Periods</th>
                    <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Breaks</th>
                    <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => {
                    const periods = periodsByDay[day.value] || [];
                    const hasSchedule = periods.length > 0;
                    return (
                      <tr key={day.value} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-medium text-slate-900 dark:text-white">{day.label}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{hasSchedule ? getDayTiming(day.value) : 'Not configured'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{getTotalPeriods(day.value)}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{getTotalBreaks(day.value)}</td>
                        <td className="p-4">
                          {hasSchedule ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Period Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPeriod ? 'Edit Period' : 'Add New Period'}>
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmitPeriod)} className="space-y-5 pb-4">
            <div>
              <label className="label-text block mb-2">Period Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodType('class')}
                  className={`flex-1 px-4 py-3 rounded-xl transition-all ${
                    selectedPeriodType === 'class'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  Class Period
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodType('break')}
                  className={`flex-1 px-4 py-3 rounded-xl transition-all ${
                    selectedPeriodType === 'break'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Coffee className="w-5 h-5 mx-auto mb-1" />
                  Break Time
                </button>
              </div>
            </div>

            {selectedPeriodType === 'class' ? (
              <div>
                <label className="label-text block mb-2">Period Number *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  {...register('period_number', { required: 'Period number is required', min: 1 })}
                  className={`input-field ${errors.period_number ? 'input-error' : ''}`}
                  placeholder="e.g., 1, 2, 3"
                />
                {errors.period_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.period_number.message as string}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="label-text block mb-2">Break Name *</label>
                <input
                  {...register('break_name', { required: 'Break name is required' })}
                  className={`input-field ${errors.break_name ? 'input-error' : ''}`}
                  placeholder="e.g., Lunch Break, Short Break, Recess"
                />
                {errors.break_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.break_name.message as string}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Start Time *</label>
                <input
                  type="time"
                  step="60"
                  {...register('start_time', { required: 'Start time is required' })}
                  className={`input-field ${errors.start_time ? 'input-error' : ''}`}
                />
              </div>
              <div>
                <label className="label-text block mb-2">End Time *</label>
                <input
                  type="time"
                  step="60"
                  {...register('end_time', { required: 'End time is required' })}
                  className={`input-field ${errors.end_time ? 'input-error' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary min-w-[100px]">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : (editingPeriod ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}