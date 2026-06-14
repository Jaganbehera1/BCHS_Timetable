import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, Calendar, Clock, BookOpen, Settings, Bell, User, LogOut,
  Menu, X, Moon, Sun, GraduationCap, FileText, ClipboardList, MessageSquare,
  ChevronLeft, ChevronRight, Building2, Zap, Sparkles, Shield,
  Activity, BarChart3, Target, Award, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { icon: Home, label: 'Dashboard', path: '/admin', description: 'Overview & Stats' },
  { icon: Settings, label: 'School Settings', path: '/admin/settings', description: 'Configure School' },
  { icon: Clock, label: 'Period Setup', path: '/admin/periods', description: 'Manage Timings' },
  { icon: GraduationCap, label: 'Classes', path: '/admin/classes', description: 'Manage Classes' },
  { icon: BookOpen, label: 'Subjects', path: '/admin/subjects', description: 'Manage Subjects' },
  { icon: Users, label: 'Teachers', path: '/admin/teachers', description: 'Manage Faculty' },
  { icon: Calendar, label: 'Timetable', path: '/admin/timetable', description: 'Schedule Management' },
  { icon: MessageSquare, label: 'Notices', path: '/admin/notices', description: 'Announcements' },
  { icon: ClipboardList, label: 'Leave Requests', path: '/admin/leaves', description: 'Leave Management' },
];

const teacherNavItems = [
  { icon: Home, label: 'Dashboard', path: '/teacher', description: 'Overview' },
  { icon: Calendar, label: "Today's Schedule", path: '/teacher/today', description: 'Today\'s Classes' },
  { icon: Clock, label: 'Weekly Timetable', path: '/teacher/timetable', description: 'Full Week' },
  { icon: ClipboardList, label: 'Attendance', path: '/teacher/attendance', description: 'Mark Attendance' },
  { icon: FileText, label: 'Leave Application', path: '/teacher/leave', description: 'Apply Leave' },
  { icon: Bell, label: 'Notifications', path: '/teacher/notifications', description: 'Alerts' },
  { icon: MessageSquare, label: 'Notice Board', path: '/teacher/notices', description: 'Announcements' },
  { icon: User, label: 'My Profile', path: '/teacher/profile', description: 'Personal Info' },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 transform bg-white dark:bg-slate-800 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Branding */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">BCHSTMS</h1>
                  <p className="text-xs text-indigo-100">
                    {isAdmin ? 'Administrator Portal' : 'Teacher Portal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile User Info */}
          {user && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{user.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-3 h-3" />
                    {user.role === 'admin' ? 'Administrator' : 'Teacher'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : ''}`} />
                  <div className="flex-1">
                    <span>{item.label}</span>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.description}</p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 flex-col bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 z-30 shadow-xl ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Desktop Branding */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className={`relative flex items-center justify-between p-5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">BCHSTMS</h1>
                  <p className="text-xs text-indigo-100">
                    {isAdmin ? 'Admin Portal' : 'Teacher Portal'}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg text-white/80 hover:bg-white/10 transition-all ${sidebarCollapsed ? 'mx-auto' : ''}`}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop User Info */}
        {!sidebarCollapsed && user && (
          <div className="p-4 m-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-indigo-500" />
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : ''}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <span>{item.label}</span>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.description}</p>
                  </div>
                )}
                {!sidebarCollapsed && isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all w-full group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            ) : (
              <Sun className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            )}
            {!sidebarCollapsed && <span className="text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">BCHSTMS</span>
              </div>

              <div className="hidden lg:block">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">PM SHRI B.C. HIGH SCHOOL, RANPUR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Time Display */}
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{getGreeting()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime()} • {formatDate()}</p>
              </div>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {notifications > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-ping" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                  </>
                )}
              </button>

              {/* Theme Toggle (Mobile) */}
              <button
                onClick={toggleTheme}
                className="md:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-64px)] animate-fade-in">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}