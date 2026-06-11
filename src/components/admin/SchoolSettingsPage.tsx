import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save, Building2, Bell, Calendar, Clock, Volume2, CheckCircle,
  AlertCircle, Info,
} from 'lucide-react';
import { getCollectionData, addDocument, updateDocument } from '../../lib/firestore-helpers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const settingsSchema = z.object({
  school_name: z.string().min(2, 'School name must be at least 2 characters'),
  notification_lead_minutes: z.number().min(1).max(60),
  notification_sound_enabled: z.boolean(),
});

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
];

export function SchoolSettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      school_name: '',
      notification_lead_minutes: 5,
      notification_sound_enabled: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const all = await getCollectionData<any>('school_settings');
    if (all && all.length > 0) {
      const d = all[0];
      setSettingsId(d.id);
      setValue('school_name', d.school_name || '');
      setValue('notification_lead_minutes', d.notification_lead_minutes || 5);
      setValue('notification_sound_enabled', d.notification_sound_enabled ?? true);
      if (d.working_days) setWorkingDays(d.working_days);
    }
    setLoading(false);
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    setMessage(null);

    const payload = {
      ...data,
      working_days: workingDays,
    };

    try {
      if (settingsId) {
        await updateDocument('school_settings', settingsId, payload);
      } else {
        await addDocument('school_settings', payload);
      }
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
    setSaving(false);
  };

  if (loading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">School Settings</h1>
            <p className="text-blue-100">Configure your school information and preferences</p>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {message.text}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* School Information */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">School Information</h2>
          </div>

          <div className="p-6">
            <label className="label-text">School Name</label>
            <input
              {...register('school_name')}
              className={`input-field ${errors.school_name ? 'input-error' : ''}`}
              placeholder="Enter your school name"
            />
            {errors.school_name && (
              <p className="text-sm text-red-600 mt-1">{errors.school_name.message}</p>
            )}
          </div>
        </div>

        {/* Working Days */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Working Days</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
              {DAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWorkingDay(day.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    workingDays.includes(day.value)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="block font-bold">{day.short}</span>
                  <span className="block text-xs opacity-80">{day.label.slice(0, 3)}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selected: {workingDays.length} days per week
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="label-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Reminder Time (minutes before class)
              </label>
              <input
                type="number"
                {...register('notification_lead_minutes', { valueAsNumber: true })}
                className="input-field max-w-xs"
                min={1}
                max={60}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Teachers will receive notifications this many minutes before their class starts.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Notification Sound</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Play sound when notifications arrive</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('notification_sound_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* School Timing Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">School Timings</h3>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p><strong>Monday-Friday:</strong> 10:15 AM - 4:00 PM</p>
                <p><strong>Saturday:</strong> 6:15 AM - 11:30 AM</p>
                <p><strong>First 4 periods:</strong> 45 minutes each</p>
                <p><strong>Lunch Break:</strong> 45 minutes (Mon-Fri)</p>
                <p><strong>After lunch periods:</strong> 40 minutes each</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="btn-primary"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
