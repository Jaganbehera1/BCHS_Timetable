import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Plus, Calendar, Clock, CheckCircle, XCircle, 
  History, Filter, ChevronDown, ChevronUp, 
  CalendarDays, AlertCircle, Info, Sparkles,
  TrendingUp, Award, Shield, MessageCircle
} from 'lucide-react';
import { getCollectionData, addDocument, queryWhere } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const leaveSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
}).refine(d => new Date(d.start_date) <= new Date(d.end_date), { 
  message: 'End date must be after start date', 
  path: ['end_date'] 
});

export function LeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalDays: 0
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      reason: ''
    }
  });

  // Watch form values for duration preview
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => { 
    if (user) fetchLeaves(); 
  }, [user]);

  const fetchLeaves = async () => {
    if (!user) return;
    try {
      const data = await queryWhere('leave_requests', 'teacher_id', '==', user.id);
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      setLeaves(sortedData || []);
      
      // Calculate stats
      const pending = sortedData.filter((l: any) => l.status === 'pending').length;
      const approved = sortedData.filter((l: any) => l.status === 'approved').length;
      const rejected = sortedData.filter((l: any) => l.status === 'rejected').length;
      const total = sortedData.length;
      
      let totalDays = 0;
      sortedData.forEach((l: any) => {
        if (l.status === 'approved') {
          const days = Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
          totalDays += days;
        }
      });
      
      setStats({
        total,
        pending,
        approved,
        rejected,
        totalDays
      });
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    setSaving(true);
    try {
      await addDocument('leave_requests', { 
        teacher_id: user.id, 
        ...data, 
        status: 'pending',
        created_at: new Date().toISOString(),
        teacher_name: user.full_name,
        teacher_email: user.email
      });
      setModalOpen(false);
      reset();
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDuration = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    return `${diff} day${diff > 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3.5 h-3.5" />
          Approved
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          Pending Review
        </span>;
    }
  };

  const getFilteredLeaves = () => {
    if (filter === 'all') return leaves;
    return leaves.filter(l => l.status === filter);
  };

  const filteredLeaves = getFilteredLeaves();

  if (loading) return <PageLoader message="Loading leave requests..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Leave Management</h1>
                  <p className="text-amber-100 mt-1">Submit and track your leave requests</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>Teacher Portal</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              {stats.pending > 0 && <div className="mt-2 text-xs text-amber-600">Awaiting review</div>}
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.approved}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Days Taken</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalDays}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Request New Leave
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        filter === f 
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      <span className="ml-1 text-xs opacity-75">
                        ({f === 'all' ? stats.total : f === 'pending' ? stats.pending : f === 'approved' ? stats.approved : stats.rejected})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leave Requests List */}
          {filteredLeaves.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Leave Requests Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {filter !== 'all' ? "No requests match the selected filter" : "You haven't submitted any leave requests yet"}
              </p>
              {filter === 'all' && (
                <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Request Leave
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaves.map((leave, index) => (
                <div 
                  key={leave.id} 
                  className="glass-card p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        leave.status === 'approved' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : leave.status === 'rejected' 
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        {leave.status === 'approved' ? (
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : leave.status === 'rejected' ? (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                            {format(new Date(leave.start_date), 'MMMM dd')} - {format(new Date(leave.end_date), 'MMMM dd, yyyy')}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <CalendarDays className="w-3 h-3" />
                            {getDuration(leave.start_date, leave.end_date)}
                          </span>
                        </div>
                        
                        <div className="flex items-start gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                            {leave.reason}
                          </p>
                        </div>
                        
                        {leave.review_notes && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                  Admin Note
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {leave.review_notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                          <span>Submitted: {format(new Date(leave.created_at), 'MMM dd, yyyy h:mm a')}</span>
                          {leave.reviewed_at && (
                            <span>Reviewed: {format(new Date(leave.reviewed_at), 'MMM dd, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(leave.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-2">Leave Request Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Submit leave requests at least 3 days in advance</li>
                  <li>Provide a detailed reason for better approval chances</li>
                  <li>Check your request status regularly for updates</li>
                  <li>Contact admin if urgent leave is needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Leave Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Leave" size="md">
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Start Date *</label>
                <input 
                  type="date" 
                  {...register('start_date')} 
                  className={`input-field ${errors.start_date ? 'input-error' : ''}`} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.start_date && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.start_date.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="label-text block mb-2">End Date *</label>
                <input 
                  type="date" 
                  {...register('end_date')} 
                  className={`input-field ${errors.end_date ? 'input-error' : ''}`} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.end_date && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label-text block mb-2">Reason for Leave *</label>
              <textarea 
                rows={5} 
                {...register('reason')} 
                className={`input-field resize-none ${errors.reason ? 'input-error' : ''}`} 
                placeholder="Please provide a detailed reason for your leave request..."
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reason.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">Minimum 10 characters</p>
            </div>

            {/* Leave Duration Preview */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Duration Preview</p>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {startDate && endDate 
                    ? getDuration(startDate, endDate)
                    : 'Select dates to see duration'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-4 -mb-4">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="btn-primary min-w-[100px]"
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}