'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Play, Pause, RotateCcw, Save, Flame, Clock, Plus, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Timer States
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [pomodoroTargetMinutes, setPomodoroTargetMinutes] = useState(25);
  const [category, setCategory] = useState('DSA');
  const [notes, setNotes] = useState('');

  // UI Stats & Logs
  const [streak, setStreak] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingLog, setSavingLog] = useState(false);

  // Absolute timestamp references to handle sleeps and refreshes perfectly
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Protect Route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load Timer State from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem('komorebi_timer_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setMode(state.mode || 'stopwatch');
        setCategory(state.category || 'DSA');
        setPomodoroTargetMinutes(state.pomodoroTargetMinutes || 25);
        setNotes(state.notes || '');

        if (state.isRunning && state.startedAtTime) {
          startedAtRef.current = state.startedAtTime;
          setIsRunning(true);
          // Calculate elapsed time since start
          const elapsed = Math.floor((Date.now() - state.startedAtTime) / 1000);
          setSecondsElapsed(elapsed);
        } else {
          setSecondsElapsed(state.secondsElapsed || 0);
        }
      } catch (e) {
        console.error('Failed to parse timer state', e);
      }
    }
  }, []);

  // Save Timer State to LocalStorage on changes
  useEffect(() => {
    const state = {
      mode,
      category,
      pomodoroTargetMinutes,
      isRunning,
      secondsElapsed: isRunning ? secondsElapsed : secondsElapsed,
      startedAtTime: startedAtRef.current,
      notes,
    };
    localStorage.setItem('komorebi_timer_state', JSON.stringify(state));
  }, [mode, category, pomodoroTargetMinutes, isRunning, secondsElapsed, notes]);

  // Timer Tick Core Logic
  useEffect(() => {
    if (isRunning) {
      if (!startedAtRef.current) {
        startedAtRef.current = Date.now() - secondsElapsed * 1000;
      }

      intervalRef.current = setInterval(() => {
        if (startedAtRef.current) {
          const currentElapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);

          if (mode === 'pomodoro') {
            const totalSeconds = pomodoroTargetMinutes * 60;
            if (currentElapsed >= totalSeconds) {
              setSecondsElapsed(totalSeconds);
              setIsRunning(false);
              handleTimerComplete(totalSeconds);
            } else {
              setSecondsElapsed(currentElapsed);
            }
          } else {
            setSecondsElapsed(currentElapsed);
          }
        }
      }, 100); // Poll at 100ms for precision and display smoothness
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, pomodoroTargetMinutes]);

  // Load User Stats & Recent Logs from Backend
  const loadStatsAndLogs = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      // Load Logs
      const logsRes = await fetch(`${API_BASE_URL}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData.slice(0, 5)); // Keep last 5 logs
      }

      // Load Streak
      const analyticsRes = await fetch(`${API_BASE_URL}/analytics?days=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setStreak(analyticsData.currentStreak);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadStatsAndLogs();
    }
  }, [user, token]);

  const handleStartPause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      startedAtRef.current = null;
    } else {
      // Start
      startedAtRef.current = Date.now() - secondsElapsed * 1000;
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
    startedAtRef.current = null;
  };

  const handleTimerComplete = (duration: number) => {
    // Show notification or alert
    setAlertMessage({
      type: 'success',
      text: `Focus session completed! Great job focusing on ${category}. Click 'Save Session' below to log it.`,
    });
  };

  const handleSaveLog = async () => {
    if (secondsElapsed <= 5) {
      setAlertMessage({
        type: 'error',
        text: 'Session is too short to log. Focus for at least 5 seconds!',
      });
      return;
    }

    setSavingLog(true);
    setAlertMessage(null);

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - secondsElapsed * 1000);

    try {
      const response = await fetch(`${API_BASE_URL}/logs/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          durationSeconds: secondsElapsed,
          startedAt: startedAt.toISOString().split('.')[0], // Format to LocalDateTime (no millis)
          endedAt: endedAt.toISOString().split('.')[0],
        }),
      });

      if (response.ok) {
        setAlertMessage({
          type: 'success',
          text: `Focus session successfully saved to your space! (+${formatTime(secondsElapsed)})`,
        });
        handleReset();
        setNotes('');
        loadStatsAndLogs(); // Reload stats to update streak & history
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save focus session');
      }
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'An error occurred while saving',
      });
    } finally {
      setSavingLog(false);
    }
  };

  // Helper formatting functions
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = () => {
    if (mode === 'stopwatch') return 0;
    const totalSeconds = pomodoroTargetMinutes * 60;
    return (secondsElapsed / totalSeconds) * 100;
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-zinc-950">
        <span className="text-zinc-500 animate-pulse font-mono">Loading dashboard...</span>
      </div>
    );
  }

  // Display variables
  const displaySeconds = mode === 'pomodoro' ? Math.max(0, pomodoroTargetMinutes * 60 - secondsElapsed) : secondsElapsed;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-8">
        {/* Header Dashboard Banner */}
        <header className="flex justify-between items-center border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Focus Control Center</h1>
            <p className="text-zinc-400 text-sm mt-1">Select a track and optimize your learning rhythm</p>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold text-sm">
            <Flame className="w-5 h-5 fill-current" />
            <span>{streak} Day Focus Streak</span>
          </div>
        </header>

        {/* Alert Notifications */}
        {alertMessage && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${
              alertMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {alertMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <span className="flex-1">{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-zinc-400 hover:text-white font-bold ml-2 text-xs uppercase"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Grid Layout: Timer on Left, Configuration & Recent on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: The Core Timer Engine */}
          <section className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-10 rounded-2xl border border-zinc-800 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
              {/* Circular Visual Background for Timer */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none"></div>

              {/* Mode Selector Header */}
              <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800/60 mb-10 z-10">
                <button
                  id="mode-stopwatch"
                  onClick={() => {
                    handleReset();
                    setMode('stopwatch');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                    mode === 'stopwatch'
                      ? 'bg-emerald-500 text-zinc-950 shadow shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Stopwatch
                </button>
                <button
                  id="mode-pomodoro"
                  onClick={() => {
                    handleReset();
                    setMode('pomodoro');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                    mode === 'pomodoro'
                      ? 'bg-emerald-500 text-zinc-950 shadow shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pomodoro
                </button>
              </div>

              {/* Circular Ticking Clock Display */}
              <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                {/* SVG Progress Ring */}
                <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r="130"
                    className="stroke-zinc-900 fill-none"
                    strokeWidth="10"
                  />
                  {mode === 'pomodoro' && (
                    <circle
                      cx="144"
                      cy="144"
                      r="130"
                      className="stroke-emerald-500 transition-all duration-200 fill-none"
                      strokeWidth="10"
                      strokeDasharray="816.8" // 2 * pi * 130
                      strokeDashoffset={816.8 - (816.8 * getTimerProgress()) / 100}
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Internal Time Text */}
                <div className="text-center z-10">
                  <span className="block text-5xl font-mono font-bold tracking-tight text-white select-none">
                    {formatTime(displaySeconds)}
                  </span>
                  <span className="text-xs text-zinc-500 mt-2 block font-mono uppercase tracking-widest">
                    {isRunning ? 'Ticking...' : 'Paused'}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-4 z-10">
                <button
                  id="btn-timer-reset"
                  onClick={handleReset}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  id="btn-timer-toggle"
                  onClick={handleStartPause}
                  className={`px-8 py-3.5 rounded-xl text-zinc-950 font-bold transition-all flex items-center gap-2.5 ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 glow-active'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start Ticking</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-timer-save"
                  onClick={handleSaveLog}
                  disabled={savingLog || isRunning}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-zinc-850 transition-all"
                  title="Save Focus Session"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Column 3: Configuration & Logs history */}
          <section className="space-y-6">
            {/* Focus Session Settings */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h2 className="text-md font-semibold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Session Configuration</span>
              </h2>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Focus Track (Category)
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm outline-none"
                >
                  <option value="DSA">Data Structures & Algorithms</option>
                  <option value="Machine Learning">Machine Learning / AI</option>
                  <option value="Web Development">Web Development</option>
                  <option value="General Study">General Study / Reading</option>
                </select>
              </div>

              {/* Pomodoro Preset selector */}
              {mode === 'pomodoro' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Pomodoro Duration (Mins)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 25, 50].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          handleReset();
                          setPomodoroTargetMinutes(mins);
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-semibold ${
                          pomodoroTargetMinutes === mins
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Notes input */}
              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Focus Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What are you working on right now?"
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm outline-none resize-none placeholder:text-zinc-650"
                />
              </div>
            </div>

            {/* Recent Session Logs */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h2 className="text-md font-semibold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Recent Logs</span>
              </h2>

              {loadingStats ? (
                <div className="text-center py-4 text-xs text-zinc-500 font-mono animate-pulse">Loading log history...</div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs">
                  No sessions logged yet. Let&apos;s start focusing!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-850 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{log.category}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {new Date(log.startedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(log.startedAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      </div>
                      <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-mono font-semibold">
                        {formatTime(log.durationSeconds)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
