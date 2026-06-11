import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LogIn, LogOut, CheckCircle } from 'lucide-react';
import { getCollectionData, queryWhere, addDocument, updateDocument } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

export function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { if (user) fetchAttendance(); }, [user]);

  const fetchAttendance = async () => {
    if (!user) return;
    const allRecords = await queryWhere('attendance_records', 'teacher_id', '==', user.id);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRec = allRecords.find((r: any) => r.date === today);
    if (todayRec) setTodayRecord({ id: todayRec.id, ...todayRec });
    const sorted = allRecords.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 30);
    setHistory(sorted);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setProcessing(true);
    await addDocument('attendance_records', { teacher_id: user.id, date: today, check_in_time: new Date().toISOString() });
    await fetchAttendance(); setProcessing(false);
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setProcessing(true);
    await updateDocument(`attendance_records/${todayRecord.id}`, { check_out_time: new Date().toISOString() });
    await fetchAttendance(); setProcessing(false);
  };

  const formatTime = (ts: string | null) => ts ? format(new Date(ts), 'hh:mm a') : '-';
  const calcDuration = (ci: string | null, co: string | null) => {
    if (!ci) return '-';
    const start = new Date(ci);
    const end = co ? new Date(co) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  if (loading) return <PageLoader message="Loading attendance..." />;

  const now = new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance</h1><p className="text-slate-600 dark:text-slate-400 mt-1">Check in and out</p></div>
      <div className="glass-card p-6">
        <div className="text-center py-8">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{format(now, 'hh:mm a')}</p>
          <p className="text-lg text-slate-500 mt-1">{format(now, 'EEEE, MMMM dd, yyyy')}</p>
          {!todayRecord ? (
            <button onClick={handleCheckIn} disabled={processing} className="btn-success py-4 px-8 text-lg mt-6">{processing ? 'Processing...' : <><LogIn className="w-6 h-6" /> Check In</>}</button>
          ) : !todayRecord.check_out_time ? (
            <div className="mt-6">
              <div className="flex items-center justify-center gap-3 mb-4"><CheckCircle className="w-6 h-6 text-green-500" /><span className="text-lg font-medium text-green-600">Checked in at {formatTime(todayRecord.check_in_time)}</span></div>
              <button onClick={handleCheckOut} disabled={processing} className="btn-danger py-4 px-8 text-lg">{processing ? 'Processing...' : <><LogOut className="w-6 h-6" /> Check Out</>}</button>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex items-center justify-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-500" /><span className="text-lg font-medium text-green-600">Work day completed!</span></div>
              <div className="text-slate-500">{formatTime(todayRecord.check_in_time)} - {formatTime(todayRecord.check_out_time)}</div>
              <div className="mt-2 text-lg font-semibold">Total: {calcDuration(todayRecord.check_in_time, todayRecord.check_out_time)}</div>
            </div>
          )}
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {history.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <div><p className="font-medium">{format(new Date(r.date), 'EEE, MMM dd')}</p><div className="flex gap-4 mt-1 text-sm text-slate-500">{r.check_in_time && <><LogIn className="w-3.5 h-3.5" />{formatTime(r.check_in_time)}</>}{r.check_out_time && <><LogOut className="w-3.5 h-3.5" />{formatTime(r.check_out_time)}</>}</div></div>
              <div className="text-right"><p className="font-medium">{calcDuration(r.check_in_time, r.check_out_time)}</p>{r.check_out_time ? <span className="badge-success">Complete</span> : r.date === today ? <span className="badge-warning">In Progress</span> : <span className="badge-danger">Incomplete</span>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
