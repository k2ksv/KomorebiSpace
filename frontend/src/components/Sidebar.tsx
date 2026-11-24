'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Clock3, ChartNoAxesColumnIncreasing, LogOut, User } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: 'Focus', href: '/dashboard', icon: Clock3, id: 'nav-dashboard' },
    { name: 'Insights', href: '/analytics', icon: ChartNoAxesColumnIncreasing, id: 'nav-analytics' },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-zinc-800/80 flex flex-col h-screen sticky top-0 text-zinc-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black shadow-lg shadow-emerald-500/20">
          K
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-wide block leading-none">
            KomorebiSpace
          </span>
          <span className="text-xs text-zinc-500 mt-1 block font-mono">v0.1.0 (Solo)</span>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="p-4 mx-4 my-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="block font-semibold text-white text-sm truncate">
              {user.username}
            </span>
            <span className="block text-xs text-zinc-500 truncate">
              {user.email}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              id={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'hover:bg-zinc-900 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-800/80">
        <button
          id="btn-logout"
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
