import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit2, Trash2, GraduationCap, Search, Filter, X, 
  ChevronDown, ChevronUp, Users, BookOpen, Clock, MoreVertical,
  Copy, Archive, Eye, AlertCircle, CheckCircle, Download, Grid3x3, List,
  User, Mail, Phone, Calendar, Award
} from 'lucide-react';
import { getCollectionData, addDocument, updateDocument, deleteDocument, queryWhere } from '../../lib/firestore-helpers';
import { Modal } from '../shared/Modal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { PageLoader } from '../shared/LoadingSpinner';

interface ClassType {
  id: string;
  class_name: string;
  section: string;
  class_teacher_id: string;
  class_teacher_name?: string;
  class_teacher_email?: string;
  number_of_students: number;
  is_active: boolean;
  full_name?: string;
  academic_year: string;
  room_number?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  subject?: string;
}

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassType | null>(null);
  const [viewingClass, setViewingClass] = useState<ClassType | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalStudents: 0,
    avgStudentsPerClass: 0
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

  useEffect(() => { 
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersData = await queryWhere('users', 'role', '==', 'teacher');
      const activeTeachers = teachersData.filter(t => t.is_active !== false);
      setTeachers(activeTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await getCollectionData<any>('classes');
      const formattedData = (data || []).map((cls: any) => ({
        ...cls,
        full_name: `${cls.class_name || ''} ${cls.section || ''}`.trim(),
        class_teacher_name: cls.class_teacher_name || 'Not Assigned',
      }));
      const sorted = formattedData.sort((a: ClassType, b: ClassType) => 
        (a.full_name || '').localeCompare(b.full_name || '')
      );
      setClasses(sorted);
      
      // Update stats
      const active = sorted.filter((c: ClassType) => c.is_active).length;
      const inactive = sorted.filter((c: ClassType) => !c.is_active).length;
      const totalStudents = sorted.reduce((sum, c) => sum + (c.number_of_students || 0), 0);
      const avgStudentsPerClass = sorted.length > 0 ? Math.round(totalStudents / sorted.length) : 0;
      
      setStats({
        total: sorted.length,
        active,
        inactive,
        totalStudents,
        avgStudentsPerClass
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      // Get teacher details
      const selectedTeacher = teachers.find(t => t.id === data.class_teacher_id);
      
      const classData = {
        class_name: data.class_name,
        section: data.section,
        class_teacher_id: data.class_teacher_id,
        class_teacher_name: selectedTeacher?.full_name || '',
        class_teacher_email: selectedTeacher?.email || '',
        number_of_students: parseInt(data.number_of_students) || 0,
        academic_year: data.academic_year,
        room_number: data.room_number || '',
        description: data.description || '',
        is_active: true,
        updated_at: new Date().toISOString()
      };
      
      if (editingId) {
        await updateDocument('classes', editingId, classData);
      } else {
        await addDocument('classes', { 
          ...classData, 
          created_at: new Date().toISOString() 
        });
      }
      setModalOpen(false);
      reset();
      setEditingId(null);
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cls: ClassType) => {
    await updateDocument('classes', cls.id, { is_active: !cls.is_active });
    fetchClasses();
  };

  const confirmDelete = (cls: ClassType) => {
    setDeletingClass(cls);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingClass) {
      await deleteDocument('classes', deletingClass.id);
      setDeleteModalOpen(false);
      setDeletingClass(null);
      fetchClasses();
    }
  };

  const openEdit = (cls: ClassType) => { 
    setEditingId(cls.id); 
    reset({
      class_name: cls.class_name,
      section: cls.section,
      class_teacher_id: cls.class_teacher_id,
      number_of_students: cls.number_of_students,
      academic_year: cls.academic_year,
      room_number: cls.room_number,
      description: cls.description
    }); 
    setModalOpen(true); 
  };
  
  const openAdd = () => { 
    setEditingId(null); 
    reset({ 
      class_name: '', 
      section: '', 
      class_teacher_id: '',
      number_of_students: '',
      academic_year: new Date().getFullYear().toString(),
      room_number: '',
      description: ''
    }); 
    setModalOpen(true); 
  };

  const viewDetails = (cls: ClassType) => {
    setViewingClass(cls);
    setViewDetailsModalOpen(true);
  };

  const exportData = () => {
    const data = classes.map(c => ({
      'Class Name': c.class_name,
      'Section': c.section,
      'Class Teacher': c.class_teacher_name,
      'Number of Students': c.number_of_students,
      'Academic Year': c.academic_year,
      'Room Number': c.room_number || '',
      'Status': c.is_active ? 'Active' : 'Inactive',
      'Description': c.description || ''
    }));
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classes_export.csv';
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

  const getFilteredClasses = () => {
    let filtered = [...classes];
    
    if (search) {
      filtered = filtered.filter(c => 
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.class_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.section?.toLowerCase().includes(search.toLowerCase()) ||
        c.class_teacher_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filterActive === 'active') {
      filtered = filtered.filter(c => c.is_active);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(c => !c.is_active);
    }
    
    return filtered;
  };

  const filtered = getFilteredClasses();

  if (loading) return <PageLoader message="Loading classes..." />;

  // Get current academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-sm font-medium">Class Management</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Manage Classes & Sections</h1>
                <p className="text-indigo-100 mt-1">Create, edit, and organize academic classes with teacher assignments</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Export</span>
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-semibold shadow-lg">
                  <Plus className="w-4 h-4" />
                  Add New Class
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Classes</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">{stats.active} active classes</div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">Across all classes</div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg Students/Class</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.avgStudentsPerClass}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Class Teachers</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{teachers.length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
                  placeholder="Search by class name, section, or teacher..." 
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
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
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
                    onClick={() => setFilterActive('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    All Classes
                  </button>
                  <button
                    onClick={() => setFilterActive('active')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'active' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterActive === 'inactive' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Classes Display */}
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Classes Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {search ? "Try adjusting your search or filters" : "Get started by adding your first class"}
              </p>
              {!search && filterActive === 'all' && (
                <button onClick={openAdd} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((cls, index) => (
                <div 
                  key={cls.id} 
                  className={`group relative glass-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    !cls.is_active ? 'opacity-60' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${cls.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}>
                    {cls.is_active && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 animate-ping"></span>}
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${
                        cls.is_active 
                          ? 'from-indigo-500 to-purple-600' 
                          : 'from-slate-400 to-slate-500'
                      } shadow-lg transform transition-transform group-hover:scale-105`}>
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => viewDetails(cls)} 
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEdit(cls)} 
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(cls)} 
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {cls.class_name} {cls.section}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {cls.academic_year}
                      </p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          Teacher: {cls.class_teacher_name || 'Not Assigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          Students: {cls.number_of_students || 0}
                        </span>
                      </div>
                      {cls.room_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="text-slate-600 dark:text-slate-300">
                            Room: {cls.room_number}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="text-xs text-slate-500">
                        {cls.class_teacher_email || ''}
                      </div>
                      <button 
                        onClick={() => toggleActive(cls)} 
                        className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                          cls.is_active 
                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {cls.is_active ? 'Deactivate' : 'Activate'}
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
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Class</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Class Teacher</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Students</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Academic Year</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Room</th>
                      <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cls) => (
                      <tr key={cls.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              cls.is_active ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-700'
                            }`}>
                              <GraduationCap className={`w-5 h-5 ${cls.is_active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{cls.class_name} {cls.section}</p>
                              <p className="text-xs text-slate-500">{cls.full_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-slate-700 dark:text-slate-300">{cls.class_teacher_name || 'Not Assigned'}</p>
                            <p className="text-xs text-slate-500">{cls.class_teacher_email || ''}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{cls.number_of_students || 0}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{cls.academic_year}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{cls.room_number || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cls.is_active 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {cls.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => viewDetails(cls)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => confirmDelete(cls)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
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

      {/* Add/Edit Modal - FIXED SCROLLING */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Class' : 'Add New Class'}>
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Class Name *</label>
                <input 
                  {...register('class_name', { required: 'Class name is required' })} 
                  className={`input-field ${errors.class_name ? 'input-error' : ''}`}
                  placeholder="e.g., Class 10, Class 12"
                />
                {errors.class_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.class_name.message as string}</p>
                )}
              </div>
              
              <div>
                <label className="label-text block mb-2">Section *</label>
                <input 
                  {...register('section', { required: 'Section is required' })} 
                  className={`input-field ${errors.section ? 'input-error' : ''}`}
                  placeholder="e.g., A, B, C"
                />
                {errors.section && (
                  <p className="text-red-500 text-xs mt-1">{errors.section.message as string}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="label-text block mb-2">Class Teacher *</label>
              <select 
                {...register('class_teacher_id', { required: 'Please select a class teacher' })} 
                className={`input-field ${errors.class_teacher_id ? 'input-error' : ''}`}
              >
                <option value="">Select Class Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.employee_id}) - {teacher.subject || 'No Subject'}
                  </option>
                ))}
              </select>
              {errors.class_teacher_id && (
                <p className="text-red-500 text-xs mt-1">{errors.class_teacher_id.message as string}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-2">Number of Students *</label>
                <input 
                  type="number"
                  {...register('number_of_students', { 
                    required: 'Number of students is required',
                    min: { value: 1, message: 'Minimum 1 student' },
                    max: { value: 100, message: 'Maximum 100 students' }
                  })} 
                  className={`input-field ${errors.number_of_students ? 'input-error' : ''}`}
                  placeholder="e.g., 45"
                />
                {errors.number_of_students && (
                  <p className="text-red-500 text-xs mt-1">{errors.number_of_students.message as string}</p>
                )}
              </div>
              
              <div>
                <label className="label-text block mb-2">Academic Year *</label>
                <select 
                  {...register('academic_year', { required: 'Academic year is required' })} 
                  className={`input-field ${errors.academic_year ? 'input-error' : ''}`}
                >
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="label-text block mb-2">Room Number</label>
              <input 
                {...register('room_number')} 
                className="input-field"
                placeholder="e.g., Room 101, Lab 2"
              />
            </div>
            
            <div>
              <label className="label-text block mb-2">Description (Optional)</label>
              <textarea 
                {...register('description')} 
                className="input-field"
                rows={3}
                placeholder="Additional notes about this class..."
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
                {saving ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Class' : 'Create Class')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={viewDetailsModalOpen} onClose={() => setViewDetailsModalOpen(false)} title="Class Details">
        {viewingClass && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {viewingClass.class_name} {viewingClass.section}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{viewingClass.academic_year}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <User className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Class Teacher</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingClass.class_teacher_name || 'Not Assigned'}</p>
                    <p className="text-sm text-slate-500">{viewingClass.class_teacher_email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Users className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingClass.number_of_students || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Room Number</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{viewingClass.room_number || 'Not Assigned'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Award className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      viewingClass.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {viewingClass.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              {viewingClass.description && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</p>
                  <p className="text-slate-700 dark:text-slate-300">{viewingClass.description}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-4 -mb-4">
                <button 
                  onClick={() => setViewDetailsModalOpen(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setViewDetailsModalOpen(false);
                    openEdit(viewingClass);
                  }} 
                  className="btn-primary"
                >
                  Edit Class
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Class">
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
              You are about to delete class <strong>{deletingClass?.full_name}</strong>.<br />
              This will also remove all associated timetable entries and student records.
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
              Delete Class
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}