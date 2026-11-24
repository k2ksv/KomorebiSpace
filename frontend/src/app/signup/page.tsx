'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { user, register, isLoading, error, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      clearError();
      setFormError(null);
    });
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !username || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const success = await register(email, username, password);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-zinc-800 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-black shadow-lg shadow-emerald-500/20 mx-auto mb-4 text-2xl">
            K
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your Account</h1>
          <p className="text-zinc-400 text-sm mt-2">Start tracking and sharing your study habits</p>
        </div>

        {/* Action Error Alerts */}
        {(formError || error) && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{formError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="study_buddy"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/80 rounded-xl text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/80 rounded-xl text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Password (6+ characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/80 rounded-xl text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/10 text-sm"
              />
            </div>
          </div>

          <button
            id="btn-signup-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 group mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Get Started'}
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center border-t border-zinc-850 pt-6">
          <p className="text-zinc-500 text-sm">
            Already have an account?{' '}
            <Link
              id="link-to-login"
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
