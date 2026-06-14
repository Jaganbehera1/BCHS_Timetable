import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit2, Trash2, MessageSquare, Search, Filter, 
  ChevronDown, ChevronUp, Download, Eye, Calendar, 
  Bell, AlertCircle, CheckCircle, XCircle, Clock,
  User, Pin, PinOff, Share2, Copy, Award, TrendingUp
} from 'lucide-react';
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingNotice, setViewingNotice] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const { user } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { 
    fetchNotices(); 
  }, []);

  const fetchNotices = async () => {
    try {
      const all = await getCollectionData<any>('notices');
      const data = (all || []).map(d => ({ 
        ...d, 
        created_at: d.created_at ? (typeof d.created_at === 'string' ? d.created_at : new Date(d.created_at).toISOString()) : undefined,
        expires_at: d.expires_at || null,
        is_expired: d.expires_at ? new Date(d.expires_at) < new Date() : false
      }));
      
      // Sort by date or priority
      data.sort((a, b) => {
        if (sortBy === 'priority') {
          return (b.priority || 0) - (a.priority || 0);
        }
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
      
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (editingId) {
        await updateDocument('notices', editingId, { 
          ...data, 
          updated_at: new Date().toISOString(),
          priority: parseInt(data.priority) || 0
        });
      } else {
        await addDocument('notices', { 
          ...data, 
          created_by: user?.id,
          created_by_name: user?.full_name || 'Admin',
          is_active: true,
          created_at: new Date().toISOString(),
          priority: parseInt(data.priority) || 0
        });
      }
      setModalOpen(false);
      reset();
      setEditingId(null);
      fetchNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save notice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (notice: any) => { 
    await updateDocument('notices', notice.id, { is_active: !notice.is_active }); 
    fetchNotices(); 
  };

  const deleteNotice = async (id: string) => { 
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) return; 
    await deleteDocument('notices', id); 
    fetchNotices(); 
  };

  const openEdit = (notice: any) => { 
    setEditingId(notice.id); 
    reset({ 
      title: notice.title, 
      content: notice.content, 
      priority: notice.priority,
      expires_at: notice.expires_at?.split('T')[0] || '' 
    }); 
    setModalOpen(true); 
  };
  
  const openAdd = () => { 
    setEditingId(null); 
    reset({ title: '', content: '', priority: 5, expires_at: '' }); 
    setModalOpen(true); 
  };

  const viewDetails = (notice: any) => {
    setViewingNotice(notice);
    setDetailsModalOpen(true);
  };

  const exportData = () => {
    const data = filteredNotices.map(n => ({
      'Title': n.title,
      'Content': n.content,
      'Priority': n.priority,
      'Status': n.is_active ? 'Active' : 'Inactive',
      'Posted On': format(new Date(n.created_at), 'MMM dd, yyyy'),
      'Expires On': n.expires_at ? format(new Date(n.expires_at), 'MMM dd, yyyy') : 'Never',
      'Posted By': n.created_by_name || 'Admin'
    }));
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notices_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

  const getPriorityInfo = (priority: number) => {
    if (priority >= 7) {
      return { 
        label: 'High Priority', 
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: AlertCircle,
        badge: 'High'
      };
    } else if (priority >= 4) {
      return { 
        label: 'Medium Priority', 
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: Bell,
        badge: 'Medium'
      };
    } else {
      return { 
        label: 'Low Priority', 
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: MessageSquare,
        badge: 'Low'
      };
    }
  };

  const getStatusInfo = (notice: any) => {
    if (!notice.is_active) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle };
    }
    if (notice.is_expired) {
      return { label: 'Expired', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Clock };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
  };

  const getFilteredNotices = () => {
    let filtered = [...notices];
    
    // Search filter
    if (search) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => {
        if (filterPriority === 'high') return n.priority >= 7;
        if (filterPriority === 'medium') return n.priority >= 4 && n.priority <= 6;
        if (filterPriority === 'low') return n.priority <= 3;
        return true;
      });
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => {
        if (filterStatus === 'active') return n.is_active && !n.is_expired;
        if (filterStatus === 'inactive') return !n.is_active || n.is_expired;
        return true;
      });
    }
    
    return filtered;
  };

  const filteredNotices = getFilteredNotices();
  
  // Stats
  const stats = {
    total: notices.length,
    active: notices.filter(n => n.is_active && !n.is_expired).length,
    expired: notices.filter(n => n.is_expired).length,
    highPriority: notices.filter(n => n.priority >= 7).length
  };

  if (loading) return <PageLoader message="Loading notices..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-100 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">Notice Board</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Notice Management</h1>
                <p className="text-amber-100 mt-1">Create and manage announcements for teachers and staff</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl transition-all font-semibold shadow-lg">
                  <Plus className="w-4 h-4" />
                  Post Notice
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Notices</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Notices</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Expired</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.expired}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.highPriority}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
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
                  placeholder="Search notices by title or content..." 
                  className="input-field pl-12 pr-4 py-2.5"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setSortBy('date')}
                    className={`px-3 py-2 transition-colors ${sortBy === 'date' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSortBy('priority')}
                    className={`px-3 py-2 transition-colors ${sortBy === 'priority' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => setFilterPriority(priority)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            filterPriority === priority 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'active', 'inactive'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            filterStatus === status 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notices List */}
          {filteredNotices.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Notices Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {search ? "Try adjusting your search or filters" : "Get started by posting your first notice"}
              </p>
              {!search && (
                <button onClick={openAdd} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Notice
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice, index) => {
                const priorityInfo = getPriorityInfo(notice.priority);
                const statusInfo = getStatusInfo(notice);
                const PriorityIcon = priorityInfo.icon;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div 
                    key={notice.id} 
                    className={`glass-card p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in ${
                      !notice.is_active || notice.is_expired ? 'opacity-75' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {notice.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${priorityInfo.color}`}>
                            <PriorityIcon className="w-3.5 h-3.5" />
                            {priorityInfo.badge}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </span>
                          {notice.priority >= 8 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-500 text-white animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                          {notice.content}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Posted: {format(new Date(notice.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                          {notice.expires_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Expires: {format(new Date(notice.expires_at), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          {notice.created_by_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              <span>By: {notice.created_by_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => viewDetails(notice)} 
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEdit(notice)} 
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteNotice(notice.id)} 
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleActive(notice)} 
                          className={`p-2 rounded-lg transition-colors ${
                            notice.is_active && !notice.is_expired
                              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100'
                              : 'text-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                          }`}
                          title={notice.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {notice.is_active && !notice.is_expired ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Notice' : 'Post New Notice'} size="lg">
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
            <div>
              <label className="label-text block mb-2">Notice Title *</label>
              <input 
                {...register('title', { required: 'Title is required' })} 
                className={`input-field ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter notice title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>
              )}
            </div>
            
            <div>
              <label className="label-text block mb-2">Content *</label>
              <textarea 
                rows={5} 
                {...register('content', { required: 'Content is required' })} 
                className={`input-field resize-none ${errors.content ? 'input-error' : ''}`}
                placeholder="Write the notice content here..."
              />
              {errors.content && (
                <p className="text-red-500 text-xs mt-1">{errors.content.message as string}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Priority (0-10)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min={0} 
                    max={10} 
                    step={1}
                    {...register('priority', { valueAsNumber: true })} 
                    className="input-field"
                  />
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 transition-all" style={{ width: `${(parseInt(register('priority').value) || 0) * 10}%` }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">0-3: Low, 4-6: Medium, 7-10: High</p>
              </div>
              
              <div>
                <label className="label-text block mb-2">Expiration Date (Optional)</label>
                <input 
                  type="date" 
                  {...register('expires_at')} 
                  className="input-field"
                />
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
                {saving ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Notice' : 'Post Notice')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Notice Details" size="lg">
        {viewingNotice && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-6 pb-4">
              <div className={`p-4 rounded-xl ${
                viewingNotice.priority >= 7 ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30' :
                viewingNotice.priority >= 4 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30' :
                'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingNotice.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityInfo(viewingNotice.priority).badge === 'High' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                          <AlertCircle className="w-3 h-3" />
                          High Priority
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusInfo(viewingNotice).color}`}>
                        {getStatusInfo(viewingNotice).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewingNotice.content}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Priority Level</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {viewingNotice.priority}/10 - {getPriorityInfo(viewingNotice.priority).label}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Posted On</label>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {format(new Date(viewingNotice.created_at), 'EEEE, MMMM dd, yyyy h:mm a')}
                  </p>
                </div>
                {viewingNotice.expires_at && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Expires On</label>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">
                      {format(new Date(viewingNotice.expires_at), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {viewingNotice.created_by_name && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Posted By</label>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1">
                      {viewingNotice.created_by_name}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setDetailsModalOpen(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openEdit(viewingNotice);
                  }} 
                  className="btn-primary"
                >
                  Edit Notice
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}