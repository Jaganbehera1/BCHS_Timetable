import { useState, useEffect, useCallback } from 'react';
import {
  Save, AlertCircle, Clock, CheckCircle, Copy, ChevronDown,
  Calendar, Users, BookOpen, RefreshCw, Loader2,
} from 'lucide-react';
import { getCollectionData, queryWhere, addDocument, deleteDocument } from '../../lib/firestore-helpers';
import { LoadingSpinner, PageLoader } from '../shared/LoadingSpinner';

const WEEKDAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
];

// Fixed period definitions - weekday timings
const WEEKDAY_PERIODS = [
  { period: 1, start: '10:15', end: '11:00', duration: 45, isBreak: false },
  { period: 2, start: '11:00', end: '11:45', duration: 45, isBreak: false },
  { period: 3, start: '11:45', end: '12:30', duration: 45, isBreak: false },
  { period: 4, start: '12:30', end: '13:15', duration: 45, isBreak: false },
  { period: 5, start: '13:15', end: '14:00', duration: 45, isBreak: true, breakName: 'Lunch Break' },
  { period: 6, start: '14:00', end: '14:40', duration: 40, isBreak: false },
  { period: 7, start: '14:40', end: '15:20', duration: 40, isBreak: false },
  { period: 8, start: '15:20', end: '16:00', duration: 40, isBreak: false },
];

// Saturday timings
const SATURDAY_PERIODS = [
  { period: 1, start: '06:15', end: '07:00', duration: 45, isBreak: false },
  { period: 2, start: '07:00', end: '07:45', duration: 45, isBreak: false },
  { period: 3, start: '07:45', end: '08:30', duration: 45, isBreak: false },
  { period: 4, start: '08:30', end: '09:15', duration: 45, isBreak: false },
  { period: 5, start: '09:15', end: '09:30', duration: 15, isBreak: true, breakName: 'Short Break' },
  { period: 6, start: '09:30', end: '10:10', duration: 40, isBreak: false },
  { period: 7, start: '10:10', end: '10:50', duration: 40, isBreak: false },
  { period: 8, start: '10:50', end: '11:30', duration: 40, isBreak: false },
];

interface ClassInfo {
  id: string;
  class_name: string;
  section: string;
  full_name: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code?: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: string;
  period_number: number;
  subject_id: string | null;
  teacher_id: string | null;
  subject?: Subject;
  teacher?: Teacher;
}

interface GridCell {
  subject_id: string;
  teacher_id: string;
  entry_id?: string;
}

export function TimetablePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [grid, setGrid] = useState<Record<string, Record<number, GridCell>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSection]);

  // Group classes by class_name to get sections
  useEffect(() => {
    if (classes.length > 0) {
      const classNumbers = [...new Set(classes.map(c => c.class_name))];
      if (classNumbers.length > 0 && !selectedClass) {
        // Select first class number
        const firstClass = classNumbers[0];
        const classSections = classes.filter(c => c.class_name === firstClass);
        setSections(classSections.map(c => c.section));
        setSelectedClass(firstClass);
        if (classSections.length > 0) {
          setSelectedSection(classSections[0].section);
        }
      }
    }
  }, [classes]);

  const fetchInitialData = async () => {
    try {
      const [cSnap, tSnap, sSnap] = await Promise.all([
        getCollectionData<any>('classes'),
        getCollectionData<any>('users'),
        getCollectionData<any>('subjects'),
      ]);

      setClasses((cSnap || []).filter((c:any) => c.is_active === true).sort((a:any,b:any) => (a.class_name||'').localeCompare(b.class_name||'')));
      setTeachers((tSnap || []).filter((u:any) => u.role === 'teacher' && u.is_active === true).sort((a:any,b:any) => (a.full_name||'').localeCompare(b.full_name||'')));
      setSubjects((sSnap || []).filter((s:any) => s.is_active === true).sort((a:any,b:any) => (a.subject_name||'').localeCompare(b.subject_name||'')));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedClass || !selectedSection) return;

    const classObj = classes.find(c => c.class_name === selectedClass && c.section === selectedSection);
    if (!classObj) return;

    const all = await getCollectionData<any>('timetable_entries');
    const data = (all || []).filter((e:any) => e.class_id === classObj.id);

    // Build grid from data
    const newGrid: Record<string, Record<number, GridCell>> = {};
    WEEKDAYS.forEach(day => {
      newGrid[day.key] = {};
      WEEKDAY_PERIODS.forEach(p => {
        newGrid[day.key][p.period] = { subject_id: '', teacher_id: '' };
      });
    });

    if (data) {
      data.forEach((entry: any) => {
        if (newGrid[entry.day_of_week] && newGrid[entry.day_of_week][entry.period_number]) {
          newGrid[entry.day_of_week][entry.period_number] = {
            subject_id: entry.subject_id || '',
            teacher_id: entry.teacher_id || '',
            entry_id: entry.id,
          };
        }
      });
    }

    setGrid(newGrid);
    setHasChanges(false);
  };

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    const classSections = classes.filter(c => c.class_name === className);
    setSections(classSections.map(c => c.section));
    if (classSections.length > 0) {
      setSelectedSection(classSections[0].section);
    }
  };

  const handleCellChange = (day: string, periodNum: number, field: 'subject_id' | 'teacher_id', value: string) => {
    setGrid(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [periodNum]: {
          ...prev[day]?.[periodNum],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  // Auto-save individual cell
  const autoSaveCell = useCallback(async (day: string, periodNum: number) => {
    const classObj = classes.find(c => c.class_name === selectedClass && c.section === selectedSection);
    if (!classObj) return;

    const cell = grid[day]?.[periodNum];
    if (!cell) return;

    setAutoSaving(`${day}-${periodNum}`);

    const cellKey = `${day}-${periodNum}`;
    setAutoSaving(cellKey);

    try {
      // Delete existing entry for this slot
      const delSnap = await queryWhere('timetable_entries', 'class_id', '==', classObj.id, 'day_of_week', undefined);
      // filter by day and period
      const toDelete = (delSnap || []).filter((d:any) => d.day_of_week === day && d.period_number === periodNum);
      const dels = toDelete.map((d:any) => deleteDocument('timetable_entries', d.id));
      await Promise.all(dels);

      // Insert new entry if subject or teacher selected
      if (cell.subject_id || cell.teacher_id) {
        await addDocument('timetable_entries', {
          class_id: classObj.id,
          day_of_week: day,
          period_number: periodNum,
          subject_id: cell.subject_id || null,
          teacher_id: cell.teacher_id || null,
        });
      }

      setHasChanges(false);
    } finally {
      setAutoSaving(null);
    }
  }, [classes, selectedClass, selectedSection, grid]);

  const saveAll = async () => {
    const classObj = classes.find(c => c.class_name === selectedClass && c.section === selectedSection);
    if (!classObj) return;

    setSaving(true);
    setMessage(null);

    try {
      // Delete all entries for this class
      const existing = await queryWhere('timetable_entries', 'class_id', '==', classObj.id);
      const dels = (existing || []).map((d:any) => deleteDocument('timetable_entries', d.id));
      await Promise.all(dels);

      // Insert all entries
      const entries: any[] = [];
      WEEKDAYS.forEach(day => {
        WEEKDAY_PERIODS.forEach(p => {
          if (p.isBreak) return; // Skip lunch break

          const cell = grid[day.key]?.[p.period];
          if (cell && (cell.subject_id || cell.teacher_id)) {
            entries.push({
              class_id: classObj.id,
              day_of_week: day.key,
              period_number: p.period,
              subject_id: cell.subject_id || null,
              teacher_id: cell.teacher_id || null,
            });
          }
        });
      });

      if (entries.length > 0) {
        const inserts = entries.map(e => addDocument('timetable_entries', e));
        await Promise.all(inserts);
      }

      setMessage({ type: 'success', text: 'Timetable saved successfully!' });
      setHasChanges(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save timetable. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const copyMondayToAll = () => {
    const mondayData = grid['monday'] || {};
    setGrid(prev => {
      const newGrid = { ...prev };
      WEEKDAYS.forEach(day => {
        if (day.key !== 'monday') {
          newGrid[day.key] = JSON.parse(JSON.stringify(mondayData));
        }
      });
      return newGrid;
    });
    setHasChanges(true);
    setMessage({ type: 'success', text: 'Monday copied to all days!' });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) return <PageLoader message="Loading timetable setup..." />;

  const classNumbers = [...new Set(classes.map(c => c.class_name))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Timetable Management</h1>
            <p className="text-blue-100">Create and manage class schedules</p>
          </div>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {classNumbers.map(num => (
                <option key={num} value={num}>Class {num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex-1 btn-primary justify-center"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Timetable
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={copyMondayToAll}
            className="btn-secondary text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy Monday to All Days
          </button>
          <button
            onClick={fetchTimetable}
            className="btn-secondary text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Timetable Grid - Weekdays */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Monday to Friday Schedule
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            School Hours: 10:15 AM - 4:00 PM | Periods 1-4: 45 min | Lunch: 45 min | Periods 6-8: 40 min
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-40">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-32">
                  Time
                </th>
                {WEEKDAYS.slice(0, 5).map(day => (
                  <th key={day.key} className="px-3 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {WEEKDAY_PERIODS.map((period) => (
                <tr
                  key={period.period}
                  className={period.isBreak
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }
                >
                  {/* Period Number */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        period.isBreak
                          ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        {period.isBreak ? (
                          <span className="text-lg">🍽</span>
                        ) : (
                          period.period
                        )}
                      </div>
                      <span className={`font-medium ${
                        period.isBreak
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {period.isBreak ? period.breakName : `Period ${period.period}`}
                      </span>
                    </div>
                  </td>

                  {/* Time Column */}
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatTime(period.start)}
                      </span>
                      <span className="text-slate-400 mx-1">-</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatTime(period.end)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {period.duration} min
                    </span>
                  </td>

                  {/* Day Cells */}
                  {WEEKDAYS.slice(0, 5).map(day => (
                    <td key={day.key} className="px-3 py-2">
                      {period.isBreak ? (
                        <div className="text-center py-4 text-amber-600 dark:text-amber-400 font-medium">
                          {period.breakName}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={grid[day.key]?.[period.period]?.subject_id || ''}
                            onChange={(e) => handleCellChange(day.key, period.period, 'subject_id', e.target.value)}
                            onBlur={() => autoSaveCell(day.key, period.period)}
                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          >
                            <option value="">-- Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.subject_name}</option>
                            ))}
                          </select>
                          <select
                            value={grid[day.key]?.[period.period]?.teacher_id || ''}
                            onChange={(e) => handleCellChange(day.key, period.period, 'teacher_id', e.target.value)}
                            onBlur={() => autoSaveCell(day.key, period.period)}
                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          >
                            <option value="">-- Teacher --</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                          </select>
                          {autoSaving === `${day.key}-${period.period}` && (
                            <div className="flex items-center justify-center gap-1 text-xs text-blue-500">
                              <Loader2 className="w-3 h-3 animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timetable Grid - Saturday */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Saturday Schedule
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            School Hours: 6:15 AM - 11:30 AM | Periods 1-4: 45 min | Break: 15 min | Periods 6-8: 40 min
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-40">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-32">
                  Time
                </th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Saturday
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {SATURDAY_PERIODS.map((period) => (
                <tr
                  key={period.period}
                  className={period.isBreak
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }
                >
                  {/* Period Number */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        period.isBreak
                          ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      }`}>
                        {period.isBreak ? (
                          <span className="text-lg">☕</span>
                        ) : (
                          period.period
                        )}
                      </div>
                      <span className={`font-medium ${
                        period.isBreak
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {period.isBreak ? period.breakName : `Period ${period.period}`}
                      </span>
                    </div>
                  </td>

                  {/* Time Column */}
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatTime(period.start)}
                      </span>
                      <span className="text-slate-400 mx-1">-</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatTime(period.end)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {period.duration} min
                    </span>
                  </td>

                  {/* Saturday Cell */}
                  <td className="px-3 py-2">
                    {period.isBreak ? (
                      <div className="text-center py-4 text-amber-600 dark:text-amber-400 font-medium">
                        {period.breakName}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={grid['saturday']?.[period.period]?.subject_id || ''}
                          onChange={(e) => handleCellChange('saturday', period.period, 'subject_id', e.target.value)}
                          onBlur={() => autoSaveCell('saturday', period.period)}
                          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        >
                          <option value="">-- Subject --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                          ))}
                        </select>
                        <select
                          value={grid['saturday']?.[period.period]?.teacher_id || ''}
                          onChange={(e) => handleCellChange('saturday', period.period, 'teacher_id', e.target.value)}
                          onBlur={() => autoSaveCell('saturday', period.period)}
                          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        >
                          <option value="">-- Teacher --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select Subject and Teacher from dropdowns - changes auto-save when you leave the field</li>
              <li>Use "Copy Monday to All Days" to quickly populate weekdays</li>
              <li>Saturday has different timings (6:15 AM - 11:30 AM)</li>
              <li>Lunch/Short Break rows are fixed and cannot be edited</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
