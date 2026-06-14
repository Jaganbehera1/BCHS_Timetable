import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Calendar, Clock, ClipboardList,
  TrendingUp, Bell, FileText, CheckCircle, AlertCircle, ArrowRight,
  Building2, CalendarDays, UserCheck, BookMarked, ShieldCheck,
  Sparkles, Target, Award, BarChart3, Settings, RefreshCw, ChevronRight, Activity, Zap
} from 'lucide-react';
import { getCollectionData, queryWhere } from '../../lib/firestore-helpers';
import { StatsCard } from '../shared/StatsCard';
import { PageLoader } from '../shared/LoadingSpinner';

interface Activity {
  id: string;
  type: 'leave' | 'notice' | 'timetable' | 'teacher';
  message: string;
  time: string;
  status?: 'pending' | 'approved' | 'rejected';
  href?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  type: 'class' | 'meeting' | 'deadline';
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalPeriods: 0,
    pendingLeaves: 0,
    activeNotices: 0,
    attendanceRate: 0,
    classUtilization: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('PM SHRI B.C. HIGH SCHOOL, RANPUR');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchStats();
    fetchSchoolName();
    fetchUpcomingEvents();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    
    return () => clearInterval(timer);
  }, []);

  const fetchSchoolName = async () => {
    const schools = await getCollectionData<any>('school_settings');
    if (schools && schools.length > 0 && schools[0]?.school_name) {
      setSchoolName(schools[0].school_name);
    }
  };

  const fetchUpcomingEvents = async () => {
    // Mock upcoming events - replace with actual data fetch
    setUpcomingEvents([
      { id: '1', title: 'Staff Meeting', time: 'Today, 2:00 PM', type: 'meeting' },
      { id: '2', title: 'Class 10A - Mathematics', time: 'Today, 10:30 AM', type: 'class' },
      { id: '3', title: 'Submit Attendance Reports', time: 'Tomorrow, 5:00 PM', type: 'deadline' },
    ]);
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
      
      // Calculate attendance rate (mock calculation)
      const attendanceRate = Math.floor(Math.random() * 20) + 75; // 75-95%
      
      // Calculate class utilization (mock)
      const classUtilization = Math.floor(Math.random() * 30) + 65; // 65-95%

      setStats({
        totalTeachers: activeTeachers.length || 0,
        totalClasses: classes.length || 0,
        totalSubjects: subjects.length || 0,
        totalPeriods: periods.length || 0,
        pendingLeaves: pendingLeaves.length || 0,
        activeNotices: notices.length || 0,
        attendanceRate: attendanceRate,
        classUtilization: classUtilization,
      });

      // Fetch recent activity
      const recentLeaves = await getCollectionData<any>('leave_requests');
      const recentNotices = await getCollectionData<any>('notices');

      const activities: Activity[] = [];

      recentLeaves.slice(0, 3).forEach((leave) => {
        const created = leave.created_at && (typeof leave.created_at === 'string' ? new Date(leave.created_at) : new Date());
        const leaveStatus = leave.status === 'approved' ? 'approved' : leave.status === 'rejected' ? 'rejected' : 'pending';
        const leaveMessage = leaveStatus === 'approved'
          ? `${leave.teacher_name || 'A teacher'} leave approved`
          : leaveStatus === 'rejected'
          ? `${leave.teacher_name || 'A teacher'} leave rejected`
          : `${leave.teacher_name || 'A teacher'} submitted a leave request`;

        activities.push({ 
          id: leave.id, 
          type: 'leave', 
          message: leaveMessage,
          time: created ? created.toLocaleDateString() : '',
          status: leaveStatus,
          href: '/admin/leaves',
        } as Activity & { href: string });
      });

      recentNotices.slice(0, 3).forEach((notice) => {
        const created = notice.created_at && (typeof notice.created_at === 'string' ? new Date(notice.created_at) : new Date());
        activities.push({ 
          id: notice.id, 
          type: 'notice', 
          message: `New notice: "${notice.title}"`, 
          time: created ? created.toLocaleDateString() : ''
        });
      });

      setRecentActivity(activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  };

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const quickActions = [
    { icon: Users, label: 'Add Teacher', href: '/admin/teachers', color: 'blue', description: 'Register new faculty member' },
    { icon: GraduationCap, label: 'Add Class', href: '/admin/classes', color: 'green', description: 'Create new class section' },
    { icon: BookOpen, label: 'Add Subject', href: '/admin/subjects', color: 'purple', description: 'Add new subject' },
    { icon: Calendar, label: 'Timetable', href: '/admin/timetable', color: 'orange', description: 'Manage schedule' },
    { icon: Bell, label: 'Send Notice', href: '/admin/notices', color: 'red', description: 'Broadcast announcement' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', color: 'gray', description: 'Configure system' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Welcome Header with Gradient Animation */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-800 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium tracking-wide">{schoolName}</span>
              <div className="h-4 w-px bg-blue-300 mx-2"></div>
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">Admin Portal</span>
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">
              {greeting}, Administrator
            </h1>
            <p className="text-blue-100 mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="mx-2">•</span>
              <Clock className="w-4 h-4" />
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Alerts</span>
                {stats.pendingLeaves > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                    {stats.pendingLeaves}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in-down">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Notifications</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {stats.pendingLeaves > 0 && (
                      <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {stats.pendingLeaves} leave request(s) pending approval
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Just now</p>
                      </div>
                    )}
                    {stats.activeNotices > 0 && (
                      <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {stats.activeNotices} active notice(s) published
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Today</p>
                      </div>
                    )}
                    {stats.pendingLeaves === 0 && stats.activeNotices === 0 && (
                      <div className="p-6 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">All caught up! No new notifications.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Teachers"
          value={stats.totalTeachers}
          icon={UserCheck}
          color="primary"
          subtitle="Active staff members"
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

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">Attendance Rate</h3>
            </div>
            <span className="text-3xl font-bold">{stats.attendanceRate}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000"
              style={{ width: `${stats.attendanceRate}%` }}
            ></div>
          </div>
          <p className="text-emerald-100 text-sm">+5.2% from last month</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold">Class Utilization</h3>
            </div>
            <span className="text-3xl font-bold">{stats.classUtilization}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000"
              style={{ width: `${stats.classUtilization}%` }}
            ></div>
          </div>
          <p className="text-blue-100 text-sm">Optimal utilization target: 85%</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quick Actions</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Frequently used operations</p>
                </div>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.href}
                  className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    action.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    action.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    action.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    action.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    action.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full hover:shadow-xl transition-shadow duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Activity</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Latest updates from the system</p>
                </div>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="p-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Activities will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={activity.id} className="group relative">
                      <Link
                        to={(activity as any).href || '/admin'}
                        className="group relative block"
                      >
                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                            activity.type === 'leave' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            activity.type === 'notice' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {activity.type === 'leave' ? <ClipboardList className="w-5 h-5" /> : 
                             activity.type === 'notice' ? <FileText className="w-5 h-5" /> : 
                             <Calendar className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {activity.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                              {activity.status && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  activity.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  activity.status === 'rejected'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {activity.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                      {idx < recentActivity.length - 1 && (
                        <div className="absolute left-5 top-20 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status & Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Upcoming Events</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule for today & tomorrow</p>
                  </div>
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-300">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      event.type === 'class' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      event.type === 'meeting' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {event.type === 'class' ? <BookOpen className="w-5 h-5" /> :
                       event.type === 'meeting' ? <Users className="w-5 h-5" /> :
                       <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{event.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">System Health</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All systems operational</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Database</span>
                      <p className="text-xs text-slate-500">Real-time sync active</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Push Notifications</span>
                      <p className="text-xs text-slate-500">Ready to send</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">PWA Status</span>
                      <p className="text-xs text-slate-500">Installable app</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Enabled
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Working Days</span>
                      <p className="text-xs text-slate-500">Monday - Saturday</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold">89%</p>
          <p className="text-xs opacity-80 mt-1">Teacher Satisfaction</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium">vs Last Month</span>
          </div>
          <p className="text-2xl font-bold">+15%</p>
          <p className="text-xs opacity-80 mt-1">Engagement Rate</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold">234</p>
          <p className="text-xs opacity-80 mt-1">Classes Conducted</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-4 h-4 opacity-80" />
            <span className="text-xs font-medium">This Week</span>
          </div>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs opacity-80 mt-1">Achievements</p>
        </div>
      </div>
    </div>
  );
}