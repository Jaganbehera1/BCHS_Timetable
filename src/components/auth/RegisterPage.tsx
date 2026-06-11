import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, Hash } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  employee_id: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(false);

    const { error: signUpError } = await signUp(
      data.email,
      data.password,
      data.full_name,
      'teacher',
      data.employee_id
    );

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account. Please try again.');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative w-full max-w-md">
          <div className="glass-card p-8 animate-slide-up text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg mb-4">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your teacher account has been created successfully. You can now sign in.
            </p>
            <Link
              to="/login"
              className="btn-primary py-3 px-6 inline-block"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Join Smart Teacher Assistant</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              {error.includes('already registered') && (
                <Link
                  to="/login"
                  className="block mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
                >
                  Click here to log in instead
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-text" htmlFor="full_name">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className={`input-field pl-12 ${errors.full_name ? 'input-error' : ''}`}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="label-text" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`input-field pl-12 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label-text" htmlFor="employee_id">Employee ID (Optional)</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="employee_id"
                  type="text"
                  {...register('employee_id')}
                  className="input-field pl-12"
                  placeholder="EMP001"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="label-text" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`input-field pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a password (min 6 characters)"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label-text" htmlFor="confirm_password">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirm_password"
                  type="password"
                  {...register('confirm_password')}
                  className={`input-field pl-12 ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm_password && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3.5 text-base relative mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
