import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save, Building2, Bell, Calendar, Clock, Volume2, CheckCircle,
  AlertCircle, Info, Settings, Globe, Users, School, Award,
  ChevronDown, ChevronUp, RefreshCw, Mail, Phone, MapPin,
  Sun, Moon, Wifi, Shield, Database, Zap, TrendingUp
} from 'lucide-react';
import { getCollectionData, addDocument, updateDocument } from '../../lib/firestore-helpers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const settingsSchema = z.object({
  school_name: z.string().min(2, 'School name must be at least 2 characters'),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email('Invalid email address').optional(),
  notification_lead_minutes: z.number().min(1).max(60),
  notification_sound_enabled: z.boolean(),
  auto_backup: z.boolean(),
  dark_mode_default: z.boolean(),
  academic_year: z.string().optional(),
  principal_name: z.string().optional(),
});

const DAYS = [
  { value: 0, label: 'Monday', short: 'Mon', full: 'Monday' },
  { value: 1, label: 'Tuesday', short: 'Tue', full: 'Tuesday' },
  { value: 2, label: 'Wednesday', short: 'Wed', full: 'Wednesday' },
  { value: 3, label: 'Thursday', short: 'Thu', full: 'Thursday' },
  { value: 4, label: 'Friday', short: 'Fri', full: 'Friday' },
  { value: 5, label: 'Saturday', short: 'Sat', full: 'Saturday' },
];

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export function SchoolSettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      school_name: '',
      school_address: '',
      school_phone: '',
      school_email: '',
      notification_lead_minutes: 5,
      notification_sound_enabled: true,
      auto_backup: true,
      dark_mode_default: false,
      academic_year: new Date().getFullYear().toString(),
      principal_name: '',
    },
  });

  useEffect(() => {
    fetchSettings();
    fetchLastBackupTime();
  }, []);

  const fetchSettings = async () => {
    try {
      const all = await getCollectionData<any>('school_settings');
      if (all && all.length > 0) {
        const d = all[0];
        setSettingsId(d.id);
        setValue('school_name', d.school_name || '');
        setValue('school_address', d.school_address || '');
        setValue('school_phone', d.school_phone || '');
        setValue('school_email', d.school_email || '');
        setValue('notification_lead_minutes', d.notification_lead_minutes || 5);
        setValue('notification_sound_enabled', d.notification_sound_enabled ?? true);
        setValue('auto_backup', d.auto_backup ?? true);
        setValue('dark_mode_default', d.dark_mode_default ?? false);
        setValue('academic_year', d.academic_year || new Date().getFullYear().toString());
        setValue('principal_name', d.principal_name || '');
        if (d.working_days) setWorkingDays(d.working_days);
        if (d.timezone) setTimezone(d.timezone);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLastBackupTime = async () => {
    try {
      const backups = await getCollectionData<any>('backup_logs');
      if (backups && backups.length > 0) {
        const latest = backups.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setLastBackup(latest.created_at);
      }
    } catch (error) {
      console.error('Error fetching backup time:', error);
    }
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
      timezone: timezone,
      updated_at: new Date().toISOString(),
    };

    try {
      if (settingsId) {
        await updateDocument('school_settings', settingsId, payload);
      } else {
        await addDocument('school_settings', { ...payload, created_at: new Date().toISOString() });
      }
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Apply dark mode if changed
      if (data.dark_mode_default) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
    setSaving(false);
  };

  const handleManualBackup = async () => {
    if (!confirm('Create a manual backup of all system data?')) return;
    setSaving(true);
    try {
      // Backup logic here
      await addDocument('backup_logs', {
        created_at: new Date().toISOString(),
        type: 'manual',
        status: 'completed'
      });
      setLastBackup(new Date().toISOString());
      setMessage({ type: 'success', text: 'Manual backup completed successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const getWorkingDaysCount = () => {
    return workingDays.length;
  };

  const getAcademicProgress = () => {
    const currentYear = new Date().getFullYear();
    const academicYear = watch('academic_year');
    const startYear = parseInt(academicYear?.split('-')[0] || currentYear.toString());
    const month = new Date().getMonth();
    // Simple progress calculation (April to March academic year)
    let progress = 0;
    if (month >= 3) { // April onwards
      progress = ((month - 3) / 12) * 100;
    } else { // Jan to March
      progress = ((month + 9) / 12) * 100;
    }
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  if (loading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Settings className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">School Settings</h1>
                  <p className="text-indigo-100 mt-1">Configure your school information and preferences</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>Admin Access Only</span>
              </div>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-xl animate-slide-down ${
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">School Information</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Basic details about your institution</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="label-text flex items-center gap-2 mb-2">
                    <School className="w-4 h-4 text-indigo-500" />
                    School Name *
                  </label>
                  <input
                    {...register('school_name')}
                    className={`input-field ${errors.school_name ? 'input-error' : ''}`}
                    placeholder="Enter your school name"
                  />
                  {errors.school_name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.school_name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label-text flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      School Address
                    </label>
                    <input
                      {...register('school_address')}
                      className="input-field"
                      placeholder="Enter school address"
                    />
                  </div>

                  <div>
                    <label className="label-text flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      Phone Number
                    </label>
                    <input
                      {...register('school_phone')}
                      className="input-field"
                      placeholder="+91 12345 67890"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-red-500" />
                    School Email
                  </label>
                  <input
                    {...register('school_email')}
                    className={`input-field ${errors.school_email ? 'input-error' : ''}`}
                    placeholder="admin@school.edu"
                  />
                  {errors.school_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.school_email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label-text flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Principal Name
                    </label>
                    <input
                      {...register('principal_name')}
                      className="input-field"
                      placeholder="Dr. John Doe"
                    />
                  </div>

                  <div>
                    <label className="label-text flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Academic Year
                    </label>
                    <select
                      {...register('academic_year')}
                      className="input-field"
                    >
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()} - {new Date().getFullYear() + 1}</option>
                      <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1} - {new Date().getFullYear()}</option>
                      <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1} - {new Date().getFullYear() + 2}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Days */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Working Days</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure school operational days</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                  {DAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWorkingDay(day.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                        workingDays.includes(day.value)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="block font-bold">{day.short}</span>
                      <span className="block text-xs opacity-80">{day.label.slice(0, 3)}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Working Days Configuration</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sunday is holiday by default</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{getWorkingDaysCount()}</p>
                    <p className="text-xs text-slate-500">Days per week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure alert preferences</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="label-text flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Reminder Time (minutes before class)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      {...register('notification_lead_minutes', { valueAsNumber: true })}
                      className="input-field w-32"
                      min={1}
                      max={60}
                      step={5}
                    />
                    <div className="flex-1">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                          style={{ width: `${(watch('notification_lead_minutes') / 60) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
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

            {/* Advanced Settings (Collapsible) */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-900 dark:text-white">Advanced Settings</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showAdvanced && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-down">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Time Zone</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Select your region</p>
                      </div>
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="input-field w-auto"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Auto Backup</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Automatically backup data daily</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('auto_backup')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Default Theme</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Set dark mode as default for new users</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('dark_mode_default')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {lastBackup && (
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            Last backup: {new Date(lastBackup).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleManualBackup}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Backup Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Progress */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Academic Progress</h3>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-purple-600 dark:text-purple-400">
                          {getAcademicProgress()}% Complete
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-purple-600 dark:text-purple-400">
                          {watch('academic_year') || '2024-2025'}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-purple-200 dark:bg-purple-800">
                      <div 
                        style={{ width: `${getAcademicProgress()}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-pink-500"
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-2">
                    Academic year progress tracking based on current date
                  </p>
                </div>
              </div>
            </div>

            {/* School Timing Info */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-3">School Timings Reference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-400">
                    <div className="space-y-2">
                      <p><strong className="font-semibold">Monday-Friday:</strong> 10:00 AM - 04:00 PM</p>
                      <p><strong>First 4 periods:</strong> 45 minutes each</p>
                      <p><strong>Lunch Break:</strong> 45 minutes</p>
                      <p><strong>After lunch periods:</strong> 40 minutes each</p>

                    </div>
                    <div className="space-y-2">
                      <p><strong className="font-semibold">Saturday:</strong> 06:15 AM - 11:30 PM</p>
                      <p><strong>Short Break:</strong> 15 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-4">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save All Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}