import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Mail, Phone, Hash, Save, Camera, 
  Calendar, Clock, Shield, CheckCircle, 
  Award, TrendingUp, BookOpen, Users,
  Sparkles, Zap, Edit2, Check, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  whatsapp_number: z.string().optional(),
  employee_id: z.string().optional(),
});

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => { 
    if (user) {
      reset({ 
        full_name: user.full_name, 
        whatsapp_number: user.whatsapp_number || '', 
        employee_id: user.employee_id || '' 
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await updateProfile(data);
      if (error) {
        setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    return user?.full_name?.charAt(0).toUpperCase() || 'U';
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'Recently';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-4xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">My Profile</h1>
                  <p className="text-indigo-100 mt-1">Manage your personal information</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>{user.role === 'admin' ? 'Administrator' : 'Teacher'} Portal</span>
              </div>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-xl animate-slide-down ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {/* Profile Card */}
          <div className="glass-card overflow-hidden">
            {/* Cover Image / Banner */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Avatar Section */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-white dark:ring-slate-800 transition-transform group-hover:scale-105">
                    {getInitials()}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all hover:scale-110"
                    title="Change avatar"
                  >
                    <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle avatar upload
                      console.log('Avatar upload:', e.target.files?.[0]);
                    }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.full_name}</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {user.role === 'admin' ? 'Administrator' : 'Teacher'}
                    </span>
                    {user.is_active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Calendar className="w-3 h-3" />
                      Member since {getMemberSince()}
                    </span>
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      reset({ 
                        full_name: user.full_name, 
                        whatsapp_number: user.whatsapp_number || '', 
                        employee_id: user.employee_id || '' 
                      });
                    }}
                    className="text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 animate-slide-down">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-text block mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input 
                        {...register('full_name')} 
                        className={`input-field ${errors.full_name ? 'input-error' : ''}`}
                        placeholder="Enter your full name"
                      />
                      {errors.full_name && (
                        <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label-text block mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <input 
                        value={user.email} 
                        disabled 
                        className="input-field opacity-60 bg-slate-100 dark:bg-slate-700"
                      />
                      <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="label-text block mb-2">
                        <Hash className="w-4 h-4 inline mr-2" />
                        Employee ID
                      </label>
                      <input 
                        {...register('employee_id')} 
                        className="input-field"
                        placeholder="e.g., TCH001"
                      />
                    </div>

                    <div>
                      <label className="label-text block mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        WhatsApp Number
                      </label>
                      <input 
                        {...register('whatsapp_number')} 
                        className="input-field"
                        placeholder="+91 12345 67890"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        reset({ 
                          full_name: user.full_name, 
                          whatsapp_number: user.whatsapp_number || '', 
                          employee_id: user.employee_id || '' 
                        });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
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
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Profile Details View */}
            {!isEditing && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Full Name</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.full_name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email Address</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Employee ID</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.employee_id || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">WhatsApp Number</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{user.whatsapp_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Information Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Account details and security</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Account Created</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Account Status</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium mb-2">Profile Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep your WhatsApp number updated for important notifications</li>
                  <li>Your employee ID helps identify you in the system</li>
                  <li>Contact admin if you need to update your email address</li>
                  <li>Regularly update your profile to keep information current</li>
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
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
}