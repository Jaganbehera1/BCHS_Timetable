import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ClipboardList, CheckCircle, XCircle, Clock, Search, 
  Filter, Calendar, User, Mail, FileText, AlertCircle,
  ChevronDown, ChevronUp, Download, Eye, MessageCircle,
  Check, X, History, TrendingUp, Award
} from 'lucide-react';
import { getCollectionData, getDocumentData, updateDocument, queryWhere } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { PageLoader } from '../shared/LoadingSpinner';

export function LeaveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0
  });

  useEffect(() => { 
    fetchRequests(); 
  }, []);

  const fetchRequests = async () => {
    try {
      const all = await getCollectionData<any>('leave_requests');
      const sorted = (all || []).sort((a, b) => 
        new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime()
      );
      
      const data = await Promise.all(sorted.map(async (d) => {
        const teacher = d.teacher_id ? await getDocumentData<any>('users', d.teacher_id) : null;
        return { 
          ...d, 
          teacher,
          full_name: teacher?.full_name || 'Unknown Teacher',
          employee_id: teacher?.employee_id || 'N/A'
        };
      }));
      
      setRequests(data);
      
      // Calculate stats
      const pending = data.filter(r => r.status === 'pending').length;
      const approved = data.filter(r => r.status === 'approved').length;
      const rejected = data.filter(r => r.status === 'rejected').length;
      const total = data.length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      
      setStats({
        total,
        pending,
        approved,
        rejected,
        approvalRate
      });
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (r: any) => {
    setProcessing(true);
    try {
      await updateDocument('leave_requests', r.id, { 
        status: 'approved', 
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // You can get actual admin ID here
      });
      setModalOpen(false);
      setSelected(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (r: any) => {
    setProcessing(true);
    try {
      await updateDocument('leave_requests', r.id, { 
        status: 'rejected', 
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin'
      });
      setModalOpen(false);
      setSelected(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = (request: any) => {
    setSelected(request);
    setDetailsModalOpen(true);
  };

  const exportData = () => {
    const data = filteredRequests.map(r => ({
      'Teacher Name': r.full_name,
      'Employee ID': r.employee_id,
      'Start Date': format(new Date(r.start_date), 'MMM dd, yyyy'),
      'End Date': format(new Date(r.end_date), 'MMM dd, yyyy'),
      'Duration': `${getDuration(r.start_date, r.end_date)} days`,
      'Reason': r.reason,
      'Status': r.status.charAt(0).toUpperCase() + r.status.slice(1),
      'Applied On': r.created_at ? format(new Date(r.created_at), 'MMM dd, yyyy') : 'N/A'
    }));
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';
    array.forEach(item => {
      let line = '';
      headers.forEach(header => {
        line += `"${item[header] || ''}",`;
      });
      str += line.slice(0, -1) + '\r\n';
    });
    return str;
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

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getDateFilter = (request: any) => {
    const requestDate = new Date(request.start_date);
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    
    switch(dateRange) {
      case 'week': return requestDate >= weekAgo;
      case 'month': return requestDate >= monthAgo;
      case 'year': return requestDate >= yearAgo;
      default: return true;
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                         r.reason?.toLowerCase().includes(search.toLowerCase()) ||
                         r.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchesDateRange = getDateFilter(r);
    return matchesFilter && matchesSearch && matchesDateRange;
  });

  if (loading) return <PageLoader message="Loading leave requests..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <ClipboardList className="w-5 h-5" />
                  <span className="text-sm font-medium">Leave Management</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Leave Requests</h1>
                <p className="text-blue-100 mt-1">Review and manage teacher leave applications</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              {stats.pending > 0 && <div className="mt-2 text-xs text-amber-600">Needs attention</div>}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Approval Rate</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.approvalRate}%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search by teacher name, reason, or employee ID..." 
                  className="input-field pl-12 pr-4 py-2.5"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Status Filter Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === f 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span className="ml-2 text-xs opacity-75">
                      ({f === 'pending' ? stats.pending : f === 'approved' ? stats.approved : stats.rejected})
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date Range:</span>
                  {(['all', 'week', 'month', 'year'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        dateRange === range 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {range === 'all' ? 'All Time' : 
                       range === 'week' ? 'Last 7 Days' : 
                       range === 'month' ? 'Last Month' : 'Last Year'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leave Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Leave Requests Found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {search ? "Try adjusting your search or filters" : "No leave requests to display"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <div 
                  key={request.id} 
                  className="glass-card p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {request.full_name?.charAt(0) || 'T'}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                            {request.full_name}
                          </h3>
                          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            ID: {request.employee_id}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              {getDuration(request.start_date, request.end_date)} days
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">
                            {request.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => viewDetails(request)} 
                        className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View Details</span>
                      </button>
                      
                      {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelected(request);
                              setModalOpen(true);
                            }} 
                            className="px-3 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Review</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Review Leave Request" size="lg">
        {selected && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-6 pb-4">
              {/* Teacher Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selected.full_name?.charAt(0) || 'T'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-slate-900 dark:text-white">{selected.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {selected.teacher?.email || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      ID: {selected.employee_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Start Date</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {format(new Date(selected.start_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">End Date</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {format(new Date(selected.end_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Duration</label>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-lg mt-1">
                  {getDuration(selected.start_date, selected.end_date)} days
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Reason for Leave
                </label>
                <p className="text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                  {selected.reason}
                </p>
              </div>

              {selected.created_at && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Applied On</label>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    {format(new Date(selected.created_at), 'MMMM dd, yyyy h:mm a')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-4 -mb-4">
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="btn-secondary"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleReject(selected)} 
                  disabled={processing} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject Request
                </button>
                <button 
                  onClick={() => handleApprove(selected)} 
                  disabled={processing} 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Leave Request Details" size="lg">
        {selected && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-6 pb-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selected.full_name?.charAt(0) || 'T'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-slate-900 dark:text-white">{selected.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-slate-500">{selected.teacher?.email}</p>
                    <p className="text-sm text-slate-500">ID: {selected.employee_id}</p>
                  </div>
                </div>
                {getStatusBadge(selected.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Start Date</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {format(new Date(selected.start_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">End Date</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {format(new Date(selected.end_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Duration</label>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xl mt-1">
                  {getDuration(selected.start_date, selected.end_date)} days
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Reason
                </label>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selected.reason}
                  </p>
                </div>
              </div>

              {selected.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviewed On</label>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    {format(new Date(selected.reviewed_at), 'MMMM dd, yyyy h:mm a')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setDetailsModalOpen(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
                {selected.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleReject(selected);
                      }} 
                      className="btn-danger"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleApprove(selected);
                      }} 
                      className="btn-accent"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}