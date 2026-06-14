import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  LogIn, LogOut, CheckCircle, Clock, Calendar, TrendingUp, 
  Award, Activity, Target, Shield, Sparkles, Zap,
  ChevronDown, ChevronUp, BarChart3, History
} from 'lucide-react';
import { queryWhere, addDocument, updateDocument } from '../../lib/firestore-helpers';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../shared/LoadingSpinner';

export function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    completedDays: 0,
    completionRate: 0,
    averageHours: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { 
    if (user) fetchAttendance(); 
  }, [user]);

  const fetchAttendance = async () => {
    if (!user) return;
    const allRecords = await queryWhere('attendance_records', 'teacher_id', '==', user.id);
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    const todayRec = allRecords.find((r: any) => r.date === todayDate);
    if (todayRec) setTodayRecord({ id: todayRec.id, ...todayRec });
    
    const sorted = allRecords.sort((a: any, b: any) => 
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    ).slice(0, 30);
    setHistory(sorted);

    // Calculate stats
    const totalDays = allRecords.length;
    const completedDays = allRecords.filter((r: any) => r.check_in_time && r.check_out_time).length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    let totalHours = 0;
    allRecords.forEach((r: any) => {
      if (r.check_in_time && r.check_out_time) {
        const start = new Date(r.check_in_time);
        const end = new Date(r.check_out_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    setStats({
      totalDays,
      completedDays,
      completionRate,
      averageHours
    });
    
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      await addDocument('attendance_records', { 
        teacher_id: user.id, 
        date: today, 
        check_in_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      await fetchAttendance();
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setProcessing(true);
    try {
      await updateDocument('attendance_records', todayRecord.id, { 
        check_out_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      await fetchAttendance();
    } catch (error) {
      console.error('Error checking out:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (ts: string | null) => ts ? format(new Date(ts), 'hh:mm a') : '-';
  
  const calcDuration = (ci: string | null, co: string | null) => {
    if (!ci) return '-';
    const start = new Date(ci);
    const end = co ? new Date(co) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getCurrentGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <PageLoader message="Loading attendance records..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-5xl">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Attendance Tracking</h1>
                  <p className="text-green-100 mt-1">Check in and out to record your work hours</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                <span>Teacher Portal</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Days</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalDays}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Completed Days</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completedDays}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.completionRate}%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="glass-card p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg Hours/Day</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.averageHours.toFixed(1)}h</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Current Time Card */}
          <div className="glass-card p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                {getCurrentGreeting()}, {user?.full_name?.split(' ')[0] || 'Teacher'}!
              </div>
              
              <p className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white font-mono mb-2">
                {format(currentTime, 'hh:mm:ss a')}
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {format(currentTime, 'EEEE, MMMM dd, yyyy')}
              </p>
              
              <div className="mt-8">
                {!todayRecord ? (
                  <button 
                    onClick={handleCheckIn} 
                    disabled={processing} 
                    className="btn-success py-4 px-8 text-lg inline-flex items-center gap-3 group"
                  >
                    {processing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Check In
                      </>
                    )}
                  </button>
                ) : !todayRecord.check_out_time ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 animate-ping">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 relative" />
                      </div>
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">
                        Checked in at {formatTime(todayRecord.check_in_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {calcDuration(todayRecord.check_in_time, null)}</span>
                    </div>
                    <button 
                      onClick={handleCheckOut} 
                      disabled={processing} 
                      className="btn-danger py-4 px-8 text-lg inline-flex items-center gap-3 group"
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          Check Out
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <Award className="w-8 h-8 text-amber-500" />
                      <span className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                        Work Day Completed!
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {formatTime(todayRecord.check_in_time)} - {formatTime(todayRecord.check_out_time)}
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      Total Duration: {calcDuration(todayRecord.check_in_time, todayRecord.check_out_time)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Attendance History</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Last 30 days records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <BarChart3 className="w-3 h-3" />
                  <span>{stats.completedDays} of {stats.totalDays} days completed</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No attendance records found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Check in to start tracking</p>
                </div>
              ) : (
                history.map((record, index) => {
                  const isToday = record.date === today;
                  const isComplete = record.check_in_time && record.check_out_time;
                  const isInProgress = record.check_in_time && !record.check_out_time && isToday;
                  
                  return (
                    <div 
                      key={record.id} 
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 ${
                        isToday ? 'bg-green-50 dark:bg-green-900/10' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isComplete 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : isInProgress 
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {isComplete ? (
                              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : isInProgress ? (
                              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Calendar className="w-6 h-6 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {format(new Date(record.date), 'EEEE, MMMM dd, yyyy')}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {record.check_in_time && (
                                <div className="flex items-center gap-1">
                                  <LogIn className="w-3.5 h-3.5" />
                                  <span>{formatTime(record.check_in_time)}</span>
                                </div>
                              )}
                              {record.check_out_time && (
                                <div className="flex items-center gap-1">
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>{formatTime(record.check_out_time)}</span>
                                </div>
                              )}
                              {!record.check_in_time && !record.check_out_time && (
                                <span className="text-xs">No activity</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {calcDuration(record.check_in_time, record.check_out_time)}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isComplete 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : isInProgress 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {isComplete ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Complete
                                </>
                              ) : isInProgress ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  In Progress
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3 h-3" />
                                  Incomplete
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar for current day */}
                      {isInProgress && record.check_in_time && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, ((new Date().getTime() - new Date(record.check_in_time).getTime()) / (8 * 60 * 60 * 1000)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">Attendance Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check in when you start your work day</li>
                  <li>Check out when you finish your work day</li>
                  <li>Your attendance history helps track your work hours</li>
                  <li>Complete records help maintain accurate timesheets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}