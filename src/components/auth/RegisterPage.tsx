import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  GraduationCap, Eye, EyeOff, Mail, Lock, User, Hash, Phone,
  Shield, School, Sparkles, ArrowRight, CheckCircle, Bell,
  AlertCircle, Globe, Users, BookOpen, Award, Heart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  employee_id: z.string().optional(),
  whatsapp_number: z.string().optional(),
  agree_terms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { signUp } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agree_terms: false,
    },
  });

  const password = watch('password', '');
  
  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(Math.min(5, strength));
  }, [password]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(false);

    const { error: signUpError } = await signUp(
      data.email,
      data.password,
      data.full_name,
      'teacher',
      data.employee_id,
      data.whatsapp_number
    );

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
      } else {
        setError(signUpError.message || 'Failed to create account. Please try again.');
      }
    } else {
      setSuccess(true);
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

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-3xl opacity-20 animate-float-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-float-slower" />
        </div>

        <div className="relative w-full max-w-md animate-float-card">
          <div className="glass-card p-8 text-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl mb-5 animate-float-logo">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-green-700 dark:from-white dark:to-green-300 bg-clip-text text-transparent mb-2">
              Account Created!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your teacher account has been created successfully. You can now sign in.
            </p>
            <Link
              to="/login"
              className="btn-primary py-3 px-6 inline-flex items-center gap-2 group"
            >
              Go to Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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
        {/* Time and Date Display */}
        <div className="text-center mb-6 animate-float">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border border-white/20 dark:border-slate-700/50">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatTime()}</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate()}</span>
          </div>
        </div>

        {/* Main Registration Card */}
        <div className="relative animate-float-card">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500" />
          
          <div className="relative glass-card p-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl mb-5 relative group animate-float-logo">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-pulse-slow opacity-50" />
                <GraduationCap className="w-10 h-10 text-white relative z-10" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-700 dark:from-white dark:via-indigo-300 dark:to-slate-300 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Join Smart Teacher Assistant
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 animate-slide-down">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Registration Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                    {error.includes('already registered') && (
                      <Link
                        to="/login"
                        className="block mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1"
                      >
                        Click here to login
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Field */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="full_name"
                    type="text"
                    {...register('full_name')}
                    className={`input-field pl-12 transition-all duration-300 focus:scale-[1.02] ${errors.full_name ? 'input-error' : ''}`}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
                {errors.full_name && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3 h-3" />
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`input-field pl-12 transition-all duration-300 focus:scale-[1.02] ${errors.email ? 'input-error' : ''}`}
                    placeholder="teacher@school.edu"
                    disabled={isSubmitting}
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

              {/* Employee ID Field */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Employee ID (Optional)
                </label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="employee_id"
                    type="text"
                    {...register('employee_id')}
                    className="input-field pl-12 transition-all duration-300 focus:scale-[1.02]"
                    placeholder="EMP001"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* WhatsApp Number Field */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 inline mr-2" />
                  WhatsApp Number (Optional)
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="whatsapp_number"
                    type="tel"
                    {...register('whatsapp_number')}
                    className="input-field pl-12 transition-all duration-300 focus:scale-[1.02]"
                    placeholder="+91 12345 67890"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Password Field with Strength Indicator */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`input-field pl-12 pr-12 transition-all duration-300 focus:scale-[1.02] ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password (min 6 characters)"
                    disabled={isSubmitting}
                    autoComplete="new-password"
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
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? getPasswordStrengthColor() : 'bg-slate-200 dark:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${
                      passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 4 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      Password strength: {getPasswordStrengthLabel()}
                    </p>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label className="label-text block mb-2 text-slate-700 dark:text-slate-300 transition-all group-focus-within:text-indigo-600">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirm_password')}
                    className={`input-field pl-12 pr-12 transition-all duration-300 focus:scale-[1.02] ${errors.confirm_password ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
                {errors.confirm_password && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-shake">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register('agree_terms')}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm text-slate-600 dark:text-slate-400">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agree_terms && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.agree_terms.message}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3.5 text-base relative overflow-hidden group mt-6 transform transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all inline-flex items-center gap-1 group"
                >
                  Sign in
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 animate-float">
          <div className="flex items-center justify-center gap-2">
            <School className="w-3 h-3" />
            <span>Smart Teacher Assistant v2.0</span>
            <Bell className="w-3 h-3" />
          </div>
          <p className="mt-1">Join thousands of teachers managing their schedules</p>
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
        
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slow 12s ease-in-out infinite reverse; }
        .animate-float-particle { animation: float-particle 6s ease-in-out infinite; }
        .animate-float-card { animation: float-card 4s ease-in-out infinite; }
        .animate-float-logo { animation: float-logo 3s ease-in-out infinite; }
        .animate-rotate-slow { animation: rotate-slow 20s linear infinite; }
        .animate-rotate-reverse { animation: rotate-reverse 15s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-float { animation: float-card 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}