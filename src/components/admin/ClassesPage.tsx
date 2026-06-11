import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, GraduationCap, Search } from 'lucide-react';
import { getCollectionData, addDocument, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

export function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const data = await getCollectionData<any>('classes');
    setClasses((data || []).sort((a:any,b:any) => (a.class_name||'').localeCompare(b.class_name||'')));
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    if (editingId) {
      await updateDocument('classes', editingId, data);
    } else {
      await addDocument('classes', { ...data, is_active: true });
    }
    setModalOpen(false); reset(); setEditingId(null); fetchClasses(); setSaving(false);
  };

  const toggleActive = async (cls: any) => {
    await updateDocument('classes', cls.id, { is_active: !cls.is_active });
    fetchClasses();
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    await deleteDocument('classes', id);
    fetchClasses();
  };

  const openEdit = (cls: any) => { setEditingId(cls.id); reset(cls); setModalOpen(true); };
  const openAdd = () => { setEditingId(null); reset({ class_name: '', section: '' }); setModalOpen(true); };

  const filtered = classes.filter(c => {
    const display = (c.full_name || `${c.class_name || ''} ${c.section || ''}`).trim();
    return display.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <PageLoader message="Loading classes..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Class Management</h1>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
      </div>
      <div className="glass-card p-4">
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-12" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(cls => (
          <div key={cls.id} className={`glass-card p-4 ${!cls.is_active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cls.is_active ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-slate-300'}`}><GraduationCap className="w-6 h-6 text-white" /></div>
                <div><h3 className="font-semibold">{cls.full_name || `${cls.class_name || ''} ${cls.section || ''}`}</h3><p className="text-sm text-slate-500">{cls.is_active ? 'Active' : 'Inactive'}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cls)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteClass(cls.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => toggleActive(cls)} className="text-sm text-slate-600 hover:text-primary-600">{cls.is_active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label-text">Class Name</label><input {...register('class_name', { required: true })} className={`input-field ${errors.class_name ? 'input-error' : ''}`} /></div>
          <div><label className="label-text">Section</label><input {...register('section', { required: true })} className={`input-field ${errors.section ? 'input-error' : ''}`} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
