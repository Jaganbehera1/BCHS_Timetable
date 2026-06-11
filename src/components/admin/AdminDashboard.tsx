import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Calendar, Clock, ClipboardList,
  TrendingUp, Bell, FileText, CheckCircle, AlertCircle, ArrowRight,
  Building2, CalendarDays, UserCheck, BookMarked,
} from 'lucide-react';
import { getCollectionData, queryWhere, countDocuments } from '../../lib/firestore-helpers';
import { StatsCard } from '../shared/StatsCard';
import { PageLoader } from '../shared/LoadingSpinner';

interface Activity {
  id: string;
  type: 'leave' | 'notice' | 'timetable';
  message: string;
  time: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalPeriods: 0,
    pendingLeaves: 0,
    activeNotices: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('Smart School');

  useEffect(() => {
    fetchStats();
    fetchSchoolName();
  }, []);

  const fetchSchoolName = async () => {
    const schools = await getCollectionData<any>('school_settings');
    if (schools && schools.length > 0 && schools[0]?.school_name) {
      setSchoolName(schools[0].school_name);
    }
  };

  const fetchStats = async () => {
    try {
      const teachers = await queryWhere('users', 'role', '==', 'teacher');
      const activeTeachers = teachers.filter(t => t.is_active === true);
      const classes = await queryWhere('classes', 'is_active', '==', true);
      const subjects = await queryWhere('subjects', 'is_active', '==', true);
      const periods = await getCollectionData<any>('period_slots');
      const pendingLeaves = await queryWhere('leave_requests', 'status', '==', 'pending');
      const notices = await queryWhere('notices', 'is_active', '==', true);

      setStats({
        totalTeachers: activeTeachers.length || 0,
        totalClasses: classes.length || 0,
        totalSubjects: subjects.length || 0,
        totalPeriods: periods.length || 0,
        pendingLeaves: pendingLeaves.length || 0,
        activeNotices: notices.length || 0,
      });

      // Fetch recent activity
      const recentLeaves = await getCollectionData<any>('leave_requests');
      const recentNotices = await getCollectionData<any>('notices');

      const activities: Activity[] = [];

      recentLeaves.slice(0, 3).forEach((leave) => {
        const created = leave.created_at && (typeof leave.created_at === 'string' ? new Date(leave.created_at) : new Date());
        activities.push({ id: leave.id, type: 'leave', message: `New leave request submitted`, time: created ? created.toLocaleDateString() : '' });
      });

      recentNotices.slice(0, 3).forEach((notice) => {
        const created = notice.created_at && (typeof notice.created_at === 'string' ? new Date(notice.created_at) : new Date());
        activities.push({ id: notice.id, type: 'notice', message: `Notice: ${notice.title}`, time: created ? created.toLocaleDateString() : '' });
      });

      setRecentActivity(activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const quickActions = [
    { icon: Users, label: 'Add Teacher', href: '/admin/teachers', color: 'blue' },
    { icon: GraduationCap, label: 'Add Class', href: '/admin/classes', color: 'green' },
    { icon: BookOpen, label: 'Add Subject', href: '/admin/subjects', color: 'purple' },
    { icon: Calendar, label: 'Timetable', href: '/admin/timetable', color: 'orange' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">{schoolName}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold">Welcome, Administrator</h1>
            <p className="text-blue-100 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/notices"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notices</span>
              {stats.activeNotices > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">{stats.activeNotices}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Teachers"
          value={stats.totalTeachers}
          icon={UserCheck}
          color="primary"
          subtitle="Active staff"
        />
        <StatsCard
          title="Classes"
          value={stats.totalClasses}
          icon={GraduationCap}
          color="success"
          subtitle="Active classes"
        />
        <StatsCard
          title="Subjects"
          value={stats.totalSubjects}
          icon={BookMarked}
          color="info"
          subtitle="Subjects offered"
        />
        <StatsCard
          title="Periods"
          value={stats.totalPeriods}
          icon={Clock}
          color="warning"
          subtitle="Time slots"
        />
        <StatsCard
          title="Leave Pending"
          value={stats.pendingLeaves}
          icon={ClipboardList}
          color="danger"
          subtitle="Awaiting review"
        />
        <StatsCard
          title="Notices"
          value={stats.activeNotices}
          icon={FileText}
          color="accent"
          subtitle="Active notices"
        />
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    action.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    action.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    action.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            </div>
            <div className="p-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'leave' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {activity.type === 'leave' ? <ClipboardList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{activity.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">System Status</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Database</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notifications</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">PWA Status</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Working Days</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300">
                  Mon - Sat
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
