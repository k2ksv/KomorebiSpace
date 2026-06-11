'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Flame, Clock, Calendar, PieChart as PieIcon, TrendingUp, HelpCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Page States
  const [days, setDays] = useState(7);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Protect Route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Set mounted state to bypass Next SSR for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Analytics from Backend
  const fetchAnalytics = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchAnalytics();
    }
  }, [user, token, days]);

  // Helper formatting functions
  const formatTotalTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatAverageTime = (avgSecs: number) => {
    const mins = Math.round(avgSecs / 60);
    return `${mins} mins`;
  };

  const formatChartYAxis = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      return `${Math.floor(mins / 60)}h`;
    }
    return `${mins}m`;
  };

  // Recharts Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const seconds = payload[0].value;
      const formatted = formatTotalTime(seconds);
      return (
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl shadow-xl font-mono text-xs text-zinc-300">
          <p className="font-semibold text-white mb-1">{payload[0].payload.date}</p>
          <p className="text-emerald-400">Time Focused: <span className="font-bold">{formatted}</span></p>
        </div>
      );
    }
    return null;
  };

  // Pie Chart Colors mapping
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  if (authLoading || !user) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-zinc-950">
        <span className="text-zinc-500 animate-pulse font-mono">Loading analytics...</span>
      </div>
    );
  }

  // Pre-process Category Data for Pie Chart
  const pieData = analyticsData?.categoryDistribution?.map((cat: any) => ({
    name: cat.category,
    value: cat.durationSeconds,
  })) || [];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-zinc-900 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-sans">Performance Analytics</h1>
            <p className="text-zinc-400 text-sm mt-1">Visualize focus stats, category distributions, and daily habits</p>
          </div>

          {/* Days Filter */}
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/60 self-start sm:self-auto">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  days === d
                    ? 'bg-emerald-500 text-zinc-950 shadow shadow-emerald-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </header>

        {loading || !analyticsData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-500 font-mono text-xs">Compiling stats...</span>
          </div>
        ) : (
          <>
            {/* Metric Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Duration */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-850 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                    Total Focus
                  </span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {formatTotalTime(analyticsData.totalDurationSeconds)}
                  </span>
                </div>
              </div>

              {/* Total Sessions */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-850 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                    Total Sessions
                  </span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {analyticsData.totalSessions} sessions
                  </span>
                </div>
              </div>

              {/* Average Duration */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-850 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                    Average Duration
                  </span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {formatAverageTime(analyticsData.averageSessionDurationSeconds)}
                  </span>
                </div>
              </div>

              {/* Streak */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-850 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                    Focus Streak
                  </span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {analyticsData.currentStreak} days
                  </span>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Trend Area Chart */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col h-[400px]">
                <h2 className="text-md font-semibold text-white tracking-tight mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Daily Study Habits</span>
                </h2>

                <div className="flex-1 min-h-0">
                  {mounted && analyticsData.dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFocus" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="#52525b"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                          }}
                        />
                        <YAxis
                          stroke="#52525b"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatChartYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="durationSeconds"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorFocus)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                      No trend data available for this range
                    </div>
                  )}
                </div>
              </div>

              {/* Category Pie Chart */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col h-[400px]">
                <h2 className="text-md font-semibold text-white tracking-tight mb-6 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  <span>Focus Track Breakdown</span>
                </h2>

                <div className="flex-1 min-h-0 flex flex-col justify-center items-center">
                  {mounted && pieData.length > 0 ? (
                    <>
                      <div className="w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#18181b" strokeWidth={1} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatTotalTime(Number(value || 0)), 'Time Focused']}
                              contentStyle={{ background: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#d4d4d8' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Custom Category Legend */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] w-full text-zinc-400 font-medium">
                        {pieData.map((entry: any, index: number) => (
                          <div key={entry.name} className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="truncate block">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs text-center px-4">
                      No logs logged yet. Complete study sessions on the dashboard to visualize distribution.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
