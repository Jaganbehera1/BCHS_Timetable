import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Hash, Save, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const profileSchema = z.object({
  full_name: z.string().min(2),
  whatsapp_number: z.string().optional(),
  employee_id: z.string().optional(),
});

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({ resolver: zodResolver(profileSchema) });

  useEffect(() => { if (user) reset({ full_name: user.full_name, whatsapp_number: user.whatsapp_number || '', employee_id: user.employee_id || '' }); }, [user, reset]);

  const onSubmit = async (data: any) => {
    setSaving(true); setMessage(null);
    const { error } = await updateProfile(data);
    if (error) setMessage({ type: 'error', text: 'Failed to update' });
    else setMessage({ type: 'success', text: 'Profile updated!' });
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1><p className="text-slate-600 dark:text-slate-400 mt-1">Manage your personal information</p></div>
      {message && <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">{user.full_name?.charAt(0).toUpperCase() || 'U'}</div>
            <button className="absolute -bottom-2 -right-2 p-2 rounded-full bg-white dark:bg-slate-700 shadow-md"><Camera className="w-4 h-4" /></button>
          </div>
          <div><h2 className="text-xl font-bold">{user.full_name}</h2><p className="text-slate-500">{user.email}</p><div className="flex items-center gap-2 mt-2"><span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>{user.is_active && <span className="badge-success">Active</span>}</div></div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div><label className="label-text"><User className="w-4 h-4 inline mr-2" />Full Name</label><input {...register('full_name')} className={`input-field ${errors.full_name ? 'input-error' : ''}`} /></div>
          <div><label className="label-text"><Mail className="w-4 h-4 inline mr-2" />Email</label><input value={user.email} disabled className="input-field opacity-60" /></div>
          <div><label className="label-text"><Hash className="w-4 h-4 inline mr-2" />Employee ID</label><input {...register('employee_id')} className="input-field" /></div>
          <div><label className="label-text"><Phone className="w-4 h-4 inline mr-2" />WhatsApp</label><input {...register('whatsapp_number')} className="input-field" /></div>
          <div className="flex justify-end"><button type="submit" disabled={saving || !isDirty} className="btn-primary">{saving ? <><LoadingSpinner size="sm" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}</button></div>
        </form>
      </div>
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b"><span>Created</span><span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span></div>
          <div className="flex justify-between py-3 border-b"><span>Last Updated</span><span className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</span></div>
          <div className="flex justify-between py-3"><span>Status</span><span className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</span></div>
        </div>
      </div>
    </div>
  );
}
