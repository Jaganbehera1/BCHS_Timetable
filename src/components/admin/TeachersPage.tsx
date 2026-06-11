import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Users, Search, Mail, Phone, BookOpen } from 'lucide-react';
import { getCollectionData, queryWhere, addDocument, updateDocument, deleteDocument } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

export function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const selectedSubjects: string[] = watch('subject_ids') || [];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const tRes = await getCollectionData<any>('users');
    const sRes = await getCollectionData<any>('subjects');
    const tsRes = await getCollectionData<any>('teacher_subjects');
    setTeachers((tRes || []).filter(u => u.role === 'teacher').sort((a,b) => (a.full_name||'').localeCompare(b.full_name||'')));
    setSubjects((sRes || []).filter((s:any) => s.is_active === true).sort((a:any,b:any) => (a.subject_name||'').localeCompare(b.subject_name||'')));
    const map: Record<string, any[]> = {};
    tsRes?.forEach((ts: any) => { if (!map[ts.teacher_id]) map[ts.teacher_id] = []; if (ts.subject_id) {
      const subj = (sRes || []).find((s: any) => s.id === ts.subject_id);
      if (subj) map[ts.teacher_id].push(subj);
    } });
    setTeacherSubjects(map);
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    let tid = editingId;
    if (!editingId) {
      const newId = await addDocument('users', { email: data.email, full_name: data.full_name, role: 'teacher', employee_id: data.employee_id, whatsapp_number: data.whatsapp_number, is_active: true });
      tid = newId || undefined;
    } else {
      await updateDocument('users', editingId as string, { full_name: data.full_name, employee_id: data.employee_id, whatsapp_number: data.whatsapp_number });
    }
    if (tid && selectedSubjects.length > 0) {
      const existing = await queryWhere('teacher_subjects', 'teacher_id', '==', tid);
      const deletions = (existing || []).map((d:any) => deleteDocument('teacher_subjects', d.id));
      await Promise.all(deletions);
      const inserts = selectedSubjects.map((sid:string) => addDocument('teacher_subjects', { teacher_id: tid, subject_id: sid }));
      await Promise.all(inserts);
    }
    setModalOpen(false); reset(); setEditingId(null); fetchData(); setSaving(false);
  };

  const toggleActive = async (t: any) => { await updateDocument('users', t.id, { is_active: !t.is_active }); fetchData(); };
  const deleteTeacher = async (id: string) => { if (!confirm('Delete this teacher?')) return; const existing = await queryWhere('teacher_subjects', 'teacher_id', '==', id); const dels = (existing||[]).map((d:any) => deleteDocument('teacher_subjects', d.id)); await Promise.all(dels); await deleteDocument('users', id); fetchData(); };
  const toggleSubject = (id: string) => { const current = selectedSubjects || []; setValue('subject_ids', current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id]); };

  const openEdit = (t: any) => { setEditingId(t.id); reset({ ...t, subject_ids: teacherSubjects[t.id]?.map(s => s.id) || [] }); setModalOpen(true); };
  const openAdd = () => { setEditingId(null); reset({ full_name: '', email: '', password: '', employee_id: '', whatsapp_number: '', subject_ids: [] }); setModalOpen(true); };

  const filtered = teachers.filter(t => (t.full_name || '').toLowerCase().includes(search.toLowerCase()) || (t.email || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <PageLoader message="Loading teachers..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teacher Management</h1>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Teacher</button>
      </div>
      <div className="glass-card p-4"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-12" /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className={`glass-card p-4 ${!t.is_active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">{t.full_name.charAt(0)}</div>
                <div><h3 className="font-semibold">{t.full_name}</h3><p className="text-sm text-slate-500">{t.employee_id}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteTeacher(t.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1"><div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4" />{t.email}</div>{t.whatsapp_number && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4" />{t.whatsapp_number}</div>}</div>
            <div className="mt-3 flex flex-wrap gap-1">{teacherSubjects[t.id]?.map((s: any) => <span key={s.id} className="badge-info" style={{ backgroundColor: s.color_code + '20', color: s.color_code }}>{s.subject_name}</span>)}</div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center"><span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>{t.is_active ? 'Active' : 'Inactive'}</span><button onClick={() => toggleActive(t)} className="text-sm text-slate-600 hover:text-primary-600">Toggle</button></div>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">Full Name</label><input {...register('full_name', { required: true })} className={`input-field ${errors.full_name ? 'input-error' : ''}`} /></div>
            <div><label className="label-text">Email</label><input {...register('email', { required: true })} className="input-field" disabled={!!editingId} /></div>
          </div>
          {!editingId && <div><label className="label-text">Password</label><input type="password" {...register('password')} className="input-field" /></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">Employee ID</label><input {...register('employee_id')} className="input-field" /></div>
            <div><label className="label-text">WhatsApp</label><input {...register('whatsapp_number')} className="input-field" /></div>
          </div>
          <div><label className="label-text">Assign Subjects</label><div className="flex flex-wrap gap-2 mt-2">{subjects.map(s => <button key={s.id} type="button" onClick={() => toggleSubject(s.id)} className={`px-3 py-2 rounded-lg text-sm ${(selectedSubjects || []).includes(s.id) ? 'text-white' : 'bg-slate-100 dark:bg-slate-700'}`} style={(selectedSubjects || []).includes(s.id) ? { backgroundColor: s.color_code } : undefined}>{s.subject_name}</button>)}</div></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
