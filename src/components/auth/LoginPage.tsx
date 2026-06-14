import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  GraduationCap, Eye, EyeOff, Mail, Lock, 
  Shield, School, Sparkles, ArrowRight, 
  Fingerprint, Smartphone, Bell, CheckCircle,
  AlertCircle, Globe, Users, BookOpen, Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      const role = user.user_metadata?.role || user.role;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setSubmitting(true);

    try {
      const { error: signInError } = await signIn(data.email, data.password);

      if (signInError) {
        const errorMessage = signInError.message || 'Failed to sign in';

        if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Please verify your email address first. Check your inbox.');
        } else if (errorMessage.includes('too many requests')) {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(errorMessage);
        }
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
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
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float-particle" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full animate-float-particle" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-float-particle" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-float-particle" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-32 right-20 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-float-particle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-purple-300 rounded-full animate-float-particle" style={{ animationDelay: '0.8s' }} />
        
        {/* Floating shapes */}
        <div className="absolute top-1/4 right-1/6 w-12 h-12 border-4 border-indigo-200/20 rounded-xl animate-rotate-slow" />
        <div className="absolute bottom-1/3 left-1/5 w-16 h-16 border-4 border-purple-200/20 rounded-full animate-rotate-reverse" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Time and Date Display - Floating */}
        <div className="text-center mb-6 animate-float">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border border-white/20 dark:border-slate-700/50">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatTime()}</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate()}</span>
          </div>
        </div>

        {/* Main Login Card - Floating Glassmorphism */}
        <div className="relative animate-float-card">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500" />
          
          <div className="relative glass-card p-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl mb-5 relative group animate-float-logo">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-pulse-slow opacity-50" />
                <GraduationCap className="w-10 h-10 text-white relative z-10" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-700 dark:from-white dark:via-indigo-300 dark:to-slate-300 bg-clip-text text-transparent">
                Smart Teacher Assistant
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Welcome back! Please sign in to continue
              </p>
            </div>

            {/* Error Message - Floating */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 animate-slide-down">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Authentication Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field - Floating Label Effect */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600" htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`input-field pl-12 transition-all duration-300 focus:scale-[1.02] ${errors.email ? 'input-error' : ''}`}
                    placeholder="teacher@school.edu"
                    disabled={submitting}
                    autoComplete="email"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field - Floating Label Effect */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600" htmlFor="password">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`input-field pl-12 pr-12 transition-all duration-300 focus:scale-[1.02] ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-transform group-hover:scale-110"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all hover:translate-x-1 inline-flex items-center gap-1"
                >
                  Forgot password?
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Submit Button - Floating Effect */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3.5 text-base relative overflow-hidden group mt-6 transform transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all inline-flex items-center gap-1 group"
                >
                  Register here
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Floating */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 animate-float">
          <div className="flex items-center justify-center gap-2">
            <School className="w-3 h-3" />
            <span>Smart Teacher Assistant v2.0</span>
            <Bell className="w-3 h-3" />
          </div>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-30px) translateX(20px); }
          50% { transform: translateY(20px) translateX(-20px); }
          75% { transform: translateY(-10px) translateX(10px); }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          50% { transform: translateY(-40px) translateX(20px); opacity: 1; }
        }
        
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes float-logo {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(5deg); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slow 12s ease-in-out infinite reverse;
        }
        
        .animate-float-particle {
          animation: float-particle 6s ease-in-out infinite;
        }
        
        .animate-float-card {
          animation: float-card 4s ease-in-out infinite;
        }
        
        .animate-float-logo {
          animation: float-logo 3s ease-in-out infinite;
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        
        .animate-rotate-reverse {
          animation: rotate-reverse 15s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float-card 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}