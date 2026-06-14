import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit2, Trash2, BookOpen, Search, Filter, 
  ChevronDown, ChevronUp, Download, Eye, AlertCircle,
  CheckCircle, XCircle, Clock, Layers, BookMarked,
  GraduationCap, Library, Sparkles, TrendingUp
} from 'lucide-react';
import { getCollectionData, addDocument, updateDocument, deleteDocument, queryWhere } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

const colors = [
  { code: '#3b82f6', name: 'Blue', class: 'bg-blue-500' },
  { code: '#22c55e', name: 'Green', class: 'bg-green-500' },
  { code: '#f59e0b', name: 'Orange', class: 'bg-amber-500' },
  { code: '#ef4444', name: 'Red', class: 'bg-red-500' },
  { code: '#8b5cf6', name: 'Purple', class: 'bg-purple-500' },
  { code: '#ec4899', name: 'Pink', class: 'bg-pink-500' },
  { code: '#06b6d4', name: 'Cyan', class: 'bg-cyan-500' },
  { code: '#84cc16', name: 'Lime', class: 'bg-lime-500' },
  { code: '#f97316', name: 'Orange', class: 'bg-orange-500' },
  { code: '#14b8a6', name: 'Teal', class: 'bg-teal-500' },
  { code: '#6366f1', name: 'Indigo', class: 'bg-indigo-500' },
  { code: '#a855f7', name: 'Purple', class: 'bg-purple-500' },
];

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<any | null>(null);
  const [viewingSubject, setViewingSubject] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    assignedTeachers: 0
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const selectedColor = watch('color_code') || '#3b82f6';

  useEffect(() => { 
    fetchSubjects(); 
    fetchStats();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await getCollectionData<any>('subjects');
      const formattedData = (data || []).map((subject: any) => ({
        ...subject,
        teacher_count: Math.floor(Math.random() * 5) + 1, // Mock data - replace with actual count
        class_count: Math.floor(Math.random() * 8) + 2, // Mock data
      }));
      const sorted = formattedData.sort((a: any, b: any) => 
        (a.subject_name || '').localeCompare(b.subject_name || '')
      );
      setSubjects(sorted);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const teachers = await queryWhere('teacher_subjects', 'status', '==', 'active');
      setStats(prev => ({ ...prev, assignedTeachers: teachers.length }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (editingId) {
        await updateDocument('subjects', editingId, { 
          ...data, 
          updated_at: new Date().toISOString() 
        });
      } else {
        await addDocument('subjects', { 
          ...data, 
          is_active: true, 
          created_at: new Date().toISOString() 
        });
      }
      setModalOpen(false);
      reset();
      setEditingId(null);
      fetchSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (subject: any) => {
    await updateDocument('subjects', subject.id, { is_active: !subject.is_active });
    fetchSubjects();
  };

  const confirmDelete = (subject: any) => {
    setDeletingSubject(subject);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingSubject) {
      await deleteDocument('subjects', deletingSubject.id);
      setDeleteModalOpen(false);
      setDeletingSubject(null);
      fetchSubjects();
    }
  };

  const openEdit = (subject: any) => { 
    setEditingId(subject.id); 
    reset({ 
      subject_name: subject.subject_name, 
      subject_code: subject.subject_code, 
      color_code: subject.color_code,
      description: subject.description || ''
    }); 
    setModalOpen(true); 
  };
  
  const openAdd = () => { 
    setEditingId(null); 
    reset({ 
      subject_name: '', 
      subject_code: '', 
      color_code: '#3b82f6',
      description: ''
    }); 
    setModalOpen(true); 
  };

  const viewDetails = (subject: any) => {
    setViewingSubject(subject);
    setDetailsModalOpen(true);
  };

  const exportData = () => {
    const data = subjects.map(s => ({
      'Subject Name': s.subject_name,
      'Subject Code': s.subject_code,
      'Status': s.is_active ? 'Active' : 'Inactive',
      'Assigned Teachers': s.teacher_count,
      'Classes': s.class_count,
      'Created At': s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'
    }));
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  const getFilteredSubjects = () => {
    let filtered = [...subjects];
    
    if (search) {
      filtered = filtered.filter(s => 
        s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
        s.subject_code?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filterActive === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(s => !s.is_active);
    }
    
    return filtered;
  };

  const filtered = getFilteredSubjects();
  
  // Update stats
  useEffect(() => {
    const active = subjects.filter(s => s.is_active).length;
    const inactive = subjects.filter(s => !s.is_active).length;
    setStats(prev => ({
      ...prev,
      total: subjects.length,
      active,
      inactive
    }));
  }, [subjects]);

  if (loading) return <PageLoader message="Loading subjects..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-100 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm font-medium">Subject Management</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Manage Subjects</h1>
                <p className="text-purple-100 mt-1">Create, edit, and organize academic subjects</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 hover:bg-purple-50 rounded-xl transition-all font-semibold shadow-lg">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Subjects</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Subjects</p>
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Inactive Subjects</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.inactive}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Assigned Teachers</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.assignedTeachers}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
                  placeholder="Search by subject name or code..." 
                  className="input-field pl-12 pr-4 py-2.5"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Library className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setFilterActive('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    All Subjects
                  </button>
                  <button
                    onClick={() => setFilterActive('active')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'active' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'inactive' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subjects Display */}
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Subjects Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {search ? "Try adjusting your search or filters" : "Get started by adding your first subject"}
              </p>
              {!search && filterActive === 'all' && (
                <button onClick={openAdd} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((subject, index) => (
                <div 
                  key={subject.id} 
                  className={`group relative glass-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    !subject.is_active ? 'opacity-60' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${subject.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}>
                    {subject.is_active && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 animate-ping"></span>}
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105"
                        style={{ backgroundColor: subject.color_code }}
                      >
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => viewDetails(subject)} 
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEdit(subject)} 
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(subject)} 
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {subject.subject_name}
                      </h3>
                      {subject.subject_code && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Code: {subject.subject_code}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Library className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="text-xs text-slate-500">
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <button 
                        onClick={() => toggleActive(subject)} 
                        className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                          subject.is_active 
                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {subject.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Subject</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Code</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Teachers</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Classes</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((subject) => (
                      <tr key={subject.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: subject.color_code }}
                            >
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{subject.subject_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{subject.subject_code || '-'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{subject.teacher_count}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{subject.class_count}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subject.is_active 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {subject.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => viewDetails(subject)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(subject)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => confirmDelete(subject)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add New Subject'}>
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
            <div>
              <label className="label-text block mb-2">Subject Name *</label>
              <input 
                {...register('subject_name', { required: 'Subject name is required' })} 
                className={`input-field ${errors.subject_name ? 'input-error' : ''}`}
                placeholder="e.g., Mathematics, Physics, English"
              />
              {errors.subject_name && (
                <p className="text-red-500 text-xs mt-1">{errors.subject_name.message as string}</p>
              )}
            </div>
            
            <div>
              <label className="label-text block mb-2">Subject Code</label>
              <input 
                {...register('subject_code')} 
                className="input-field"
                placeholder="e.g., MATH101, PHY202"
              />
              <p className="text-xs text-slate-500 mt-1">Optional unique identifier for the subject</p>
            </div>
            
            <div>
              <label className="label-text block mb-2">Color Theme</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {colors.map(color => (
                  <button
                    key={color.code}
                    type="button"
                    onClick={() => setValue('color_code', color.code)}
                    className={`w-10 h-10 rounded-xl transition-all transform hover:scale-110 ${
                      selectedColor === color.code 
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' 
                        : ''
                    }`}
                    style={{ backgroundColor: color.code }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label-text block mb-2">Description (Optional)</label>
              <textarea 
                {...register('description')} 
                className="input-field resize-none"
                rows={3}
                placeholder="Brief description of the subject..."
              />
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
                {saving ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Subject' : 'Create Subject')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Subject Details">
        {viewingSubject && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-6 pb-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: viewingSubject.color_code }}
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingSubject.subject_name}</h3>
                  {viewingSubject.subject_code && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Code: {viewingSubject.subject_code}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned Teachers</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingSubject.teacher_count}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Library className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Classes</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingSubject.class_count}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      viewingSubject.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {viewingSubject.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created At</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {viewingSubject.created_at ? new Date(viewingSubject.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {viewingSubject.description && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</p>
                  <p className="text-slate-700 dark:text-slate-300">{viewingSubject.description}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-4 -mb-4">
                <button 
                  onClick={() => setDetailsModalOpen(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openEdit(viewingSubject);
                  }} 
                  className="btn-primary"
                >
                  Edit Subject
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Subject">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              You are about to delete subject <strong>{deletingSubject?.subject_name}</strong>.<br />
              This will also remove all associated teacher assignments and timetable entries.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button 
              onClick={() => setDeleteModalOpen(false)} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete} 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Delete Subject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}