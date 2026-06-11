import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getCollectionData, addDocument, queryWhere } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const leaveSchema = z.object({
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().min(10),
}).refine(d => new Date(d.start_date) <= new Date(d.end_date), { message: 'End date must be after start date', path: ['end_date'] });

export function LeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(leaveSchema) });

  useEffect(() => { if (user) fetchLeaves(); }, [user]);

  const fetchLeaves = async () => {
    if (!user) return;
    const data = await queryWhere('leave_requests', 'teacher_id', '==', user.id);
    const sortedData = data.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    setLeaves(sortedData || []);
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    setSaving(true);
    await addDocument('leave_requests', { teacher_id: user.id, ...data, status: 'pending' });
    setModalOpen(false); reset(); fetchLeaves(); setSaving(false);
  };

  const getDuration = (s: string, e: string) => `${Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1} days`;
  const getStatus = (s: string) => s === 'approved' ? <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span> : s === 'rejected' ? <span className="badge-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span> : <span className="badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;

  if (loading) return <PageLoader message="Loading..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Requests</h1><p className="text-slate-600 dark:text-slate-400 mt-1">Submit and track your leave requests</p></div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Request Leave</button>
      </div>
      <div className="space-y-4">
        {leaves.map(l => (
          <div key={l.id} className="glass-card p-5">
            <div className="flex justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${l.status === 'approved' ? 'bg-green-100 text-green-600' : l.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><Calendar className="w-6 h-6" /></div>
                <div><div className="flex items-center gap-3 mb-1"><h3 className="font-semibold">{format(new Date(l.start_date), 'MMM dd')} - {format(new Date(l.end_date), 'MMM dd, yyyy')}</h3><span className="badge-info">{getDuration(l.start_date, l.end_date)}</span></div><p className="text-slate-600 text-sm">{l.reason}</p>{l.review_notes && <p className="mt-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-lg p-2"><strong>Admin Note:</strong> {l.review_notes}</p>}</div>
              </div>
              {getStatus(l.status)}
            </div>
          </div>
        ))}
        {leaves.length === 0 && <div className="text-center py-12"><Calendar className="w-12 h-12 mx-auto text-slate-300" /><p className="mt-4 text-slate-500">No leave requests submitted yet</p><button onClick={() => setModalOpen(true)} className="btn-secondary mt-4">Submit your first request</button></div>}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">Start Date</label><input type="date" {...register('start_date')} className={`input-field ${errors.start_date ? 'input-error' : ''}`} min={format(new Date(), 'yyyy-MM-dd')} /></div>
            <div><label className="label-text">End Date</label><input type="date" {...register('end_date')} className={`input-field ${errors.end_date ? 'input-error' : ''}`} min={format(new Date(), 'yyyy-MM-dd')} /></div>
          </div>
          <div><label className="label-text">Reason</label><textarea rows={4} {...register('reason')} className={`input-field resize-none ${errors.reason ? 'input-error' : ''}`} placeholder="Describe the reason..." /></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : 'Submit'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
