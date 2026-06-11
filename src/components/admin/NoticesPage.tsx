import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, MessageSquare, Search } from 'lucide-react';
import { format } from 'date-fns';
import { getCollectionData, addDocument, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    const all = await getCollectionData<any>('notices');
    const data = (all || []).map(d => ({ ...d, created_at: d.created_at ? (typeof d.created_at === 'string' ? d.created_at : new Date(d.created_at).toISOString()) : undefined }));
    data.sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
    setNotices(data || []);
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    if (editingId) {
      await updateDocument('notices', editingId, data);
    } else {
      await addDocument('notices', { ...data, created_by: user?.id, is_active: true, created_at: new Date().toISOString() });
    }
    setModalOpen(false); reset(); setEditingId(null); fetchNotices(); setSaving(false);
  };

  const toggleActive = async (n: any) => { await updateDocument('notices', n.id, { is_active: !n.is_active }); fetchNotices(); };
  const deleteNotice = async (id: string) => { if (!confirm('Delete?')) return; await deleteDocument('notices', id); fetchNotices(); };

  const openEdit = (n: any) => { setEditingId(n.id); reset({ ...n, expires_at: n.expires_at?.split('T')[0] || '' }); setModalOpen(true); };
  const openAdd = () => { setEditingId(null); reset({ title: '', content: '', priority: 0, expires_at: '' }); setModalOpen(true); };

  const filtered = notices.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));
  const getPriority = (p: number) => p >= 7 ? 'bg-red-100 text-red-700' : p >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

  if (loading) return <PageLoader message="Loading notices..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notice Management</h1>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Notice</button>
      </div>
      <div className="glass-card p-4"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-12" /></div></div>
      <div className="space-y-4">
        {filtered.map(n => (
          <div key={n.id} className={`glass-card p-5 ${!n.is_active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{n.title}</h3>
                  <span className={`badge ${getPriority(n.priority)}`}>Priority {n.priority}</span>
                  <span className={`badge ${n.is_active ? 'badge-success' : 'badge-danger'}`}>{n.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-3">{n.content}</p>
                <div className="text-sm text-slate-500">Posted: {format(new Date(n.created_at), 'MMM dd, yyyy')}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(n)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteNotice(n.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t"><button onClick={() => toggleActive(n)} className="text-sm text-slate-600 hover:text-primary-600">{n.is_active ? 'Deactivate' : 'Activate'}</button></div>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Notice' : 'Add Notice'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label-text">Title</label><input {...register('title', { required: true })} className={`input-field ${errors.title ? 'input-error' : ''}`} /></div>
          <div><label className="label-text">Content</label><textarea rows={4} {...register('content', { required: true })} className={`input-field resize-none ${errors.content ? 'input-error' : ''}`} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">Priority (0-10)</label><input type="number" min={0} max={10} {...register('priority', { valueAsNumber: true })} className="input-field" /></div>
            <div><label className="label-text">Expires (optional)</label><input type="date" {...register('expires_at')} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
