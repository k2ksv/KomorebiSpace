'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 border border-emerald-400 animate-pulse flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20">
          K
        </div>
        <span className="text-zinc-400 text-sm font-mono tracking-wide">Loading space...</span>
      </div>
    </div>
  );
}
