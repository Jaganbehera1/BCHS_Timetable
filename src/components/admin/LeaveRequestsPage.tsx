import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ClipboardList, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { getCollectionData, getDocumentData, updateDocument } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { PageLoader } from '../shared/LoadingSpinner';

export function LeaveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    const all = await getCollectionData<any>('leave_requests');
    const data = await Promise.all((all || []).map(async (d) => {
      const teacher = d.teacher_id ? await getDocumentData<any>('users', d.teacher_id) : null;
      return { ...d, teacher };
    }));
    setRequests(data || []);
    setLoading(false);
  };
  const handleApprove = async (r: any) => { setProcessing(true); await updateDocument('leave_requests', r.id, { status: 'approved', reviewed_at: new Date().toISOString() }); setModalOpen(false); setSelected(null); fetchRequests(); setProcessing(false); };
  const handleReject = async (r: any) => { setProcessing(true); await updateDocument('leave_requests', r.id, { status: 'rejected', reviewed_at: new Date().toISOString() }); setModalOpen(false); setSelected(null); fetchRequests(); setProcessing(false); };

  const filtered = requests.filter(r => (filter === 'all' || r.status === filter) && (r.teacher?.full_name?.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase())));
  const getStatus = (s: string) => s === 'approved' ? <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span> : s === 'rejected' ? <span className="badge-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span> : <span className="badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
  const getDuration = (s: string, e: string) => `${Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1} days`;

  if (loading) return <PageLoader message="Loading leave requests..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Requests</h1>
      <div className="flex gap-4">
        <div className="glass-card p-4 flex-1"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-12" /></div></div>
        <div className="flex gap-2">{(['all', 'pending', 'approved', 'rejected'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-medium ${filter === f ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
      </div>
      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r.id} className="glass-card p-5">
            <div className="flex justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">{r.teacher?.full_name?.charAt(0) || 'T'}</div>
                <div><h3 className="font-semibold">{r.teacher?.full_name || 'Unknown'}</h3><div className="flex items-center gap-3 text-sm text-slate-500 mt-1"><span>{format(new Date(r.start_date), 'MMM dd')} - {format(new Date(r.end_date), 'MMM dd, yyyy')}</span><span className="badge-info">{getDuration(r.start_date, r.end_date)}</span></div></div>
              </div>
              <div className="flex items-center gap-3">{getStatus(r.status)}{r.status === 'pending' && <button onClick={() => { setSelected(r); setModalOpen(true); }} className="btn-primary text-sm py-2">Review</button>}</div>
            </div>
            <div className="mt-4 pt-4 border-t"><p className="text-slate-600">{r.reason}</p></div>
          </div>
        ))}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Review Leave Request" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">{selected.teacher?.full_name?.charAt(0)}</div>
              <div><h3 className="font-semibold">{selected.teacher?.full_name}</h3><p className="text-sm text-slate-500">{selected.teacher?.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label-text">Start</label><p className="font-medium">{format(new Date(selected.start_date), 'MMMM dd, yyyy')}</p></div><div><label className="label-text">End</label><p className="font-medium">{format(new Date(selected.end_date), 'MMMM dd, yyyy')}</p></div></div>
            <div><label className="label-text">Duration</label><p className="font-medium">{getDuration(selected.start_date, selected.end_date)}</p></div>
            <div><label className="label-text">Reason</label><p className="text-slate-700">{selected.reason}</p></div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => handleReject(selected)} disabled={processing} className="btn-danger"><XCircle className="w-4 h-4" /> Reject</button>
              <button onClick={() => handleApprove(selected)} disabled={processing} className="btn-accent"><CheckCircle className="w-4 h-4" /> Approve</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
