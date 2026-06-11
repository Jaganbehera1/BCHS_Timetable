import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, BookOpen, Search } from 'lucide-react';
import { getCollectionData, addDocument, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const selectedColor = watch('color_code') || '#3b82f6';

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    const data = await getCollectionData<any>('subjects');
    setSubjects((data || []).sort((a:any,b:any) => (a.subject_name||'').localeCompare(b.subject_name||'')));
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    if (editingId) {
      await updateDocument('subjects', editingId, data);
    } else {
      await addDocument('subjects', { ...data, is_active: true });
    }
    setModalOpen(false); reset(); setEditingId(null); fetchSubjects(); setSaving(false);
  };

  const toggleActive = async (subject: any) => {
    await updateDocument('subjects', subject.id, { is_active: !subject.is_active });
    fetchSubjects();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    await deleteDocument('subjects', id);
    fetchSubjects();
  };

  const openEdit = (subject: any) => { setEditingId(subject.id); reset(subject); setModalOpen(true); };
  const openAdd = () => { setEditingId(null); reset({ subject_name: '', subject_code: '', color_code: '#3b82f6' }); setModalOpen(true); };

  const filtered = subjects.filter(s => s.subject_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <PageLoader message="Loading subjects..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subject Management</h1>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
      </div>
      <div className="glass-card p-4">
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-12" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(subject => (
          <div key={subject.id} className={`glass-card p-4 ${!subject.is_active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: subject.color_code }}><BookOpen className="w-6 h-6 text-white" /></div>
                <div><h3 className="font-semibold">{subject.subject_name}</h3><p className="text-sm text-slate-500">{subject.subject_code}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(subject)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteSubject(subject.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => toggleActive(subject)} className="text-sm text-slate-600 hover:text-primary-600">{subject.is_active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label-text">Subject Name</label><input {...register('subject_name', { required: true })} className={`input-field ${errors.subject_name ? 'input-error' : ''}`} /></div>
          <div><label className="label-text">Subject Code</label><input {...register('subject_code')} className="input-field" /></div>
          <div><label className="label-text">Color</label><div className="flex gap-2 flex-wrap">{colors.map(c => <button key={c} type="button" onClick={() => setValue('color_code', c)} className={`w-8 h-8 rounded-lg ${selectedColor === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} style={{ backgroundColor: c }} />)}</div></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
