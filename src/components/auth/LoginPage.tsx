import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setSubmitting(true);

    try {
      const { error: signInError } = await signIn(data.email, data.password);

      if ( signInError) {
        const errorMessage = signInError.message || 'Failed to sign in';

        // Make error messages more user-friendly
        if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Please verify your email address first.');
        } else {
          setError(errorMessage);
        }
        setSubmitting(false);
      }
      // If no error, the auth state change will trigger navigation automatically
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Sign in to Smart Teacher Assistant</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
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
                  placeholder="Enter your password"
                  disabled={submitting}
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3.5 text-base relative"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
