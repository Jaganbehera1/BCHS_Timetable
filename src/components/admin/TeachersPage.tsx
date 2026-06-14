import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit2, Trash2, Users, Search, Mail, Phone, BookOpen,
  Filter, ChevronDown, ChevronUp, Download, Eye, Award,
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  GraduationCap, BookMarked, UserCheck, TrendingUp,
  Grid3x3, List, MessageSquare, Shield, Star, Briefcase
} from 'lucide-react';
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<any | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalSubjects: 0
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const selectedSubjects: string[] = watch('subject_ids') || [];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const tRes = await getCollectionData<any>('users');
      const sRes = await getCollectionData<any>('subjects');
      const tsRes = await getCollectionData<any>('teacher_subjects');
      
      const teachersData = (tRes || [])
        .filter(u => u.role === 'teacher')
        .map(t => ({
          ...t,
          joining_date: t.joining_date || '',
          assigned_classes: t.assigned_classes || 0,
          performance_rating: t.performance_rating || 3.0
        }))
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
      
      setTeachers(teachersData);
      setSubjects((sRes || []).filter((s: any) => s.is_active === true).sort((a: any, b: any) => (a.subject_name || '').localeCompare(b.subject_name || '')));
      
      const map: Record<string, any[]> = {};
      tsRes?.forEach((ts: any) => {
        if (!map[ts.teacher_id]) map[ts.teacher_id] = [];
        if (ts.subject_id) {
          const subj = (sRes || []).find((s: any) => s.id === ts.subject_id);
          if (subj) map[ts.teacher_id].push(subj);
        }
      });
      setTeacherSubjects(map);
      
      // Update stats
      const active = teachersData.filter(t => t.is_active !== false).length;
      const inactive = teachersData.filter(t => t.is_active === false).length;
      const totalSubjectsAssigned = Object.values(map).reduce((sum, subs) => sum + subs.length, 0);
      
      setStats({
        total: teachersData.length,
        active,
        inactive,
        totalSubjects: totalSubjectsAssigned
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      let tid = editingId;
      if (!editingId) {
        const newId = await addDocument('users', {
          email: data.email,
          full_name: data.full_name,
          role: 'teacher',
          employee_id: data.employee_id,
          whatsapp_number: data.whatsapp_number,
          is_active: true,
          created_at: new Date().toISOString(),
          joining_date: data.joining_date,
          assigned_classes: parseInt(data.assigned_classes) || 0,
          performance_rating: parseFloat(data.performance_rating) || 3.0,
          password_hash: data.password ? btoa(data.password) : null
        });
        tid = newId || undefined;
      } else {
        await updateDocument('users', editingId as string, {
          full_name: data.full_name,
          employee_id: data.employee_id,
          whatsapp_number: data.whatsapp_number,
          joining_date: data.joining_date,
          assigned_classes: parseInt(data.assigned_classes) || 0,
          performance_rating: parseFloat(data.performance_rating) || 3.0,
          updated_at: new Date().toISOString()
        });
      }
      
      if (tid && selectedSubjects.length > 0) {
        const existing = await queryWhere('teacher_subjects', 'teacher_id', '==', tid);
        const deletions = (existing || []).map((d: any) => deleteDocument('teacher_subjects', d.id));
        await Promise.all(deletions);
        
        const inserts = selectedSubjects.map((sid: string) => 
          addDocument('teacher_subjects', { 
            teacher_id: tid, 
            subject_id: sid,
            assigned_at: new Date().toISOString()
          })
        );
        await Promise.all(inserts);
      }
      
      setModalOpen(false);
      reset();
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Failed to save teacher. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (teacher: any) => {
    await updateDocument('users', teacher.id, { is_active: !teacher.is_active });
    fetchData();
  };

  const confirmDelete = (teacher: any) => {
    setDeletingTeacher(teacher);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingTeacher) {
      const existing = await queryWhere('teacher_subjects', 'teacher_id', '==', deletingTeacher.id);
      const dels = (existing || []).map((d: any) => deleteDocument('teacher_subjects', d.id));
      await Promise.all(dels);
      await deleteDocument('users', deletingTeacher.id);
      setDeleteModalOpen(false);
      setDeletingTeacher(null);
      fetchData();
    }
  };

  const toggleSubject = (id: string) => {
    const current = selectedSubjects || [];
    setValue('subject_ids', current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id]);
  };

  const openEdit = (teacher: any) => {
    setEditingId(teacher.id);
    reset({
      full_name: teacher.full_name,
      email: teacher.email,
      employee_id: teacher.employee_id,
      whatsapp_number: teacher.whatsapp_number,
      joining_date: teacher.joining_date?.split('T')[0] || '',
      assigned_classes: teacher.assigned_classes || 0,
      performance_rating: teacher.performance_rating || 3.0,
      subject_ids: teacherSubjects[teacher.id]?.map(s => s.id) || []
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    reset({
      full_name: '',
      email: '',
      password: '',
      employee_id: '',
      whatsapp_number: '',
      joining_date: '',
      assigned_classes: 0,
      performance_rating: 3.0,
      subject_ids: []
    });
    setModalOpen(true);
  };

  const viewDetails = (teacher: any) => {
    setViewingTeacher(teacher);
    setDetailsModalOpen(true);
  };

  const exportData = () => {
    const data = teachers.map(t => ({
      'Full Name': t.full_name,
      'Email': t.email,
      'Employee ID': t.employee_id,
      'WhatsApp Number': t.whatsapp_number,
      'Joining Date': t.joining_date ? new Date(t.joining_date).toLocaleDateString() : 'N/A',
      'Assigned Classes': t.assigned_classes,
      'Performance Rating': t.performance_rating,
      'Status': t.is_active ? 'Active' : 'Inactive',
      'Subjects': teacherSubjects[t.id]?.map(s => s.subject_name).join(', ') || 'None'
    }));
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  const getFilteredTeachers = () => {
    let filtered = [...teachers];
    
    if (search) {
      filtered = filtered.filter(t =>
        t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.employee_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filterStatus === 'active') {
      filtered = filtered.filter(t => t.is_active !== false);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(t => t.is_active === false);
    }
    
    return filtered;
  };

  const filteredTeachers = getFilteredTeachers();
  
  const getPerformanceStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return { fullStars, hasHalfStar };
  };

  if (loading) return <PageLoader message="Loading teachers..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-green-100 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Faculty Management</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Teacher Management</h1>
                <p className="text-green-100 mt-1">Manage faculty members and their subject assignments</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-600 hover:bg-teal-50 rounded-xl transition-all font-semibold shadow-lg">
                  <Plus className="w-4 h-4" />
                  Add Teacher
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Teachers</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Teachers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Subject Assignments</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalSubjects}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg Performance</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {(teachers.reduce((sum, t) => sum + (parseFloat(t.performance_rating) || 0), 0) / (teachers.length || 1)).toFixed(1)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
                  placeholder="Search by name, email, or employee ID..."
                  className="input-field pl-12 pr-4 py-2.5"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                    showFilters ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-down">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    All Teachers
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setFilterStatus('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'inactive' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Teachers Display */}
          {filteredTeachers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Teachers Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {search ? "Try adjusting your search or filters" : "Get started by adding your first teacher"}
              </p>
              {!search && filterStatus === 'all' && (
                <button onClick={openAdd} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teacher
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeachers.map((teacher, index) => {
                const performance = parseFloat(teacher.performance_rating) || 3.0;
                const { fullStars, hasHalfStar } = getPerformanceStars(performance);
                
                return (
                  <div
                    key={teacher.id}
                    className={`group relative glass-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      teacher.is_active === false ? 'opacity-60' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${teacher.is_active !== false ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}>
                      {teacher.is_active !== false && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 animate-ping"></span>}
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {teacher.full_name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                              {teacher.full_name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              ID: {teacher.employee_id || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => viewDetails(teacher)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(teacher)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(teacher)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300 truncate">{teacher.email}</span>
                        </div>
                        {teacher.whatsapp_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">{teacher.whatsapp_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">{teacher.assigned_classes || 0} Classes</span>
                        </div>
                        {teacher.joining_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Joined: {new Date(teacher.joining_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Performance Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <div className="flex gap-0.5">
                          {[...Array(fullStars)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          ))}
                          {hasHalfStar && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-slate-300" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">{performance.toFixed(1)}</span>
                      </div>
                      
                      {/* Subjects */}
                      {teacherSubjects[teacher.id] && teacherSubjects[teacher.id].length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {teacherSubjects[teacher.id].slice(0, 3).map((subject: any) => (
                            <span
                              key={subject.id}
                              className="text-xs px-2 py-1 rounded-lg"
                              style={{ backgroundColor: subject.color_code + '20', color: subject.color_code }}
                            >
                              {subject.subject_name}
                            </span>
                          ))}
                          {teacherSubjects[teacher.id].length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600">
                              +{teacherSubjects[teacher.id].length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                        <span className={`badge ${teacher.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                          {teacher.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleActive(teacher)}
                          className="text-sm text-slate-600 hover:text-primary-600"
                        >
                          Toggle
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Teacher</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Contact</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Joining Date</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Classes</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Rating</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                              {teacher.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{teacher.full_name}</p>
                              <p className="text-xs text-slate-500">{teacher.employee_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-600 dark:text-slate-300">{teacher.email}</div>
                          <div className="text-xs text-slate-500">{teacher.whatsapp_number}</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{teacher.assigned_classes || 0}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">{teacher.performance_rating || 3.0}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`badge ${teacher.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                            {teacher.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => viewDetails(teacher)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(teacher)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => confirmDelete(teacher)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Teacher' : 'Add New Teacher'} size="lg">
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Full Name *</label>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  className={`input-field ${errors.full_name ? 'input-error' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message as string}</p>}
              </div>
              
              <div>
                <label className="label-text block mb-2">Email *</label>
                <input
                  {...register('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
                  className="input-field"
                  disabled={!!editingId}
                  placeholder="teacher@school.edu"
                />
              </div>
            </div>
            
            {!editingId && (
              <div>
                <label className="label-text block mb-2">Password *</label>
                <input
                  type="password"
                  {...register('password', { required: !editingId, minLength: 6 })}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Employee ID</label>
                <input
                  {...register('employee_id')}
                  className="input-field"
                  placeholder="e.g., TCH001"
                />
              </div>
              
              <div>
                <label className="label-text block mb-2">WhatsApp Number</label>
                <input
                  {...register('whatsapp_number')}
                  className="input-field"
                  placeholder="+91 12345 67890"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Joining Date</label>
                <input
                  type="date"
                  {...register('joining_date')}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label-text block mb-2">Assigned Classes</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  {...register('assigned_classes', { valueAsNumber: true })}
                  className="input-field"
                  placeholder="Number of classes"
                />
              </div>
            </div>
            
            <div>
              <label className="label-text block mb-2">Performance Rating (0-5)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  {...register('performance_rating', { valueAsNumber: true })}
                  className="flex-1"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register('performance_rating', { valueAsNumber: true })}
                  className="input-field w-24 text-center"
                />
              </div>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${watch('performance_rating') > i ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="label-text block mb-2">Assign Subjects</label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded-xl">
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all transform hover:scale-105 ${
                      (selectedSubjects || []).includes(subject.id)
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    style={(selectedSubjects || []).includes(subject.id) ? { backgroundColor: subject.color_code } : undefined}
                  >
                    {subject.subject_name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Selected: {selectedSubjects.length} subjects</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-4 -mb-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary min-w-[100px]">
                {saving ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Teacher' : 'Add Teacher')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Teacher Details" size="lg">
        {viewingTeacher && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-6 pb-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  {viewingTeacher.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingTeacher.full_name}</h3>
                  <p className="text-sm text-slate-500">ID: {viewingTeacher.employee_id || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Mail className="w-5 h-5 text-teal-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email Address</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Phone className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">WhatsApp Number</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.whatsapp_number || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Joining Date</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {viewingTeacher.joining_date ? new Date(viewingTeacher.joining_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Briefcase className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Assigned Classes</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingTeacher.assigned_classes || 0} Classes</p>
                  </div>
                </div>
              </div>
              
              {/* Performance Rating */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-medium text-slate-500 mb-2">Performance Rating</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${(viewingTeacher.performance_rating || 3) > i ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-lg">{(viewingTeacher.performance_rating || 3).toFixed(1)} / 5.0</span>
                </div>
              </div>
              
              {/* Assigned Subjects */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-medium text-slate-500 mb-2">Assigned Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {teacherSubjects[viewingTeacher.id]?.length > 0 ? (
                    teacherSubjects[viewingTeacher.id].map((subject: any) => (
                      <span
                        key={subject.id}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: subject.color_code + '20', color: subject.color_code }}
                      >
                        {subject.subject_name}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No subjects assigned</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setDetailsModalOpen(false)} className="btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openEdit(viewingTeacher);
                  }}
                  className="btn-primary"
                >
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Teacher">
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
              You are about to delete teacher <strong>{deletingTeacher?.full_name}</strong>.<br />
              This will also remove all subject assignments and timetable entries.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
              Delete Teacher
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}