'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Check, Flame, Pause, Play, RotateCcw, Save, Volume2, VolumeX } from 'lucide-react';

interface StudyLog {
  id: number;
  category: string;
  durationSeconds: number;
  startedAt: string;
}

const categories = ['DSA', 'Machine Learning', 'Web Development', 'General Study'];

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [category, setCategory] = useState('DSA');
  const [streak, setStreak] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(120);
  const [recentLogs, setRecentLogs] = useState<StudyLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    queueMicrotask(() => {
      const savedGoal = Number(localStorage.getItem('komorebi_daily_goal'));
      if (savedGoal > 0) setGoalMinutes(savedGoal);
      const saved = localStorage.getItem('komorebi_timer_state');
      if (!saved) return;
      try {
        const state = JSON.parse(saved) as {
          mode?: 'stopwatch' | 'pomodoro';
          pomodoroMinutes?: number;
          category?: string;
          isRunning?: boolean;
          startedAtTime?: number;
          elapsed?: number;
        };
        if (state && typeof state === 'object') {
          setMode(state.mode === 'pomodoro' ? 'pomodoro' : 'stopwatch');
          if (typeof state.pomodoroMinutes === 'number' && state.pomodoroMinutes > 0) {
            setPomodoroMinutes(state.pomodoroMinutes);
          }
          if (state.category && categories.includes(state.category)) {
            setCategory(state.category);
          }
          if (state.isRunning && state.startedAtTime) {
            startedAtRef.current = state.startedAtTime;
            setElapsed(Math.max(0, Math.floor((Date.now() - state.startedAtTime) / 1000)));
            setIsRunning(true);
          } else {
            setElapsed(typeof state.elapsed === 'number' ? Math.max(0, state.elapsed) : 0);
          }
        }
      } catch {
        localStorage.removeItem('komorebi_timer_state');
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('komorebi_timer_state', JSON.stringify({
      mode,
      pomodoroMinutes,
      category,
      isRunning,
      elapsed,
      startedAtTime: startedAtRef.current,
    }));
  }, [mode, pomodoroMinutes, category, isRunning, elapsed]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch only the 4 most recent logs using the new pagination limit
      const logsResponse = await fetch(`${API_BASE_URL}/logs?limit=4`, { credentials: 'include' });
      if (logsResponse.ok) {
        const logs = await logsResponse.json() as StudyLog[];
        setRecentLogs(logs);
      } else if (logsResponse.status === 401) {
        router.replace('/login');
        return;
      }

      // Fetch today's summary directly from optimized endpoint
      const todayResponse = await fetch(`${API_BASE_URL}/logs/today`, { credentials: 'include' });
      if (todayResponse.ok) {
        const todayData = await todayResponse.json() as { totalSeconds: number };
        setTodaySeconds(todayData.totalSeconds);
      }

      const analyticsResponse = await fetch(`${API_BASE_URL}/analytics?days=30`, { credentials: 'include' });
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setStreak(analytics.currentStreak);
      }
    } catch (error) {
      console.error('Failed to load focus stats', error);
    }
  }, [user, router]);

  useEffect(() => {
    if (user) queueMicrotask(loadStats);
  }, [loadStats, user]);

  const stopAmbientSound = useCallback(() => {
    noiseRef.current?.stop();
    noiseRef.current = null;
    void audioRef.current?.close();
    audioRef.current = null;
  }, []);

  const toggleAmbientSound = async () => {
    if (soundOn) {
      stopAmbientSound();
      setSoundOn(false);
      return;
    }
    const audio = new AudioContext();
    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.025;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(audio.destination);
    source.start();
    audioRef.current = audio;
    noiseRef.current = source;
    setSoundOn(true);
  };

  useEffect(() => () => stopAmbientSound(), [stopAmbientSound]);

  const startPause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      startedAtRef.current = null;
    } else {
      startedAtRef.current = Date.now() - elapsed * 1000;
      setIsRunning(true);
    }
  }, [elapsed, isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    startedAtRef.current = null;
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const next = Math.floor((Date.now() - startedAtRef.current) / 1000);
      if (mode === 'pomodoro' && next >= pomodoroMinutes * 60) {
        setElapsed(pomodoroMinutes * 60);
        setIsRunning(false);
        setMessage('Pomodoro complete. Save this session.');
        startedAtRef.current = null;
        return;
      }
      setElapsed(next);
    }, 250);
    return () => window.clearInterval(timer);
  }, [isRunning, mode, pomodoroMinutes]);

  const saveSession = useCallback(async () => {
    if (elapsed < 5 || saving) return;
    setSaving(true);
    setMessage('');
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - elapsed * 1000);
    try {
      const response = await fetch(`${API_BASE_URL}/logs/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          durationSeconds: elapsed,
          startedAt: startedAt.toISOString().slice(0, 19),
          endedAt: endedAt.toISOString().slice(0, 19),
        }),
      });
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok) throw new Error('Could not save the session');
      reset();
      setMessage('Session saved');
      await loadStats();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the session');
    } finally {
      setSaving(false);
    }
  }, [elapsed, saving, category, reset, loadStats, router]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === 'Space') { event.preventDefault(); startPause(); }
      if (event.key.toLowerCase() === 'r') reset();
      if (event.key.toLowerCase() === 's') void saveSession();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset, saveSession, startPause]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
      ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || !user) return null;

  const targetSeconds = pomodoroMinutes * 60;
  const displaySeconds = mode === 'pomodoro' ? Math.max(0, targetSeconds - elapsed) : elapsed;
  const progress = mode === 'pomodoro' ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;
  const goalProgress = Math.min(100, (todaySeconds / (goalMinutes * 60)) * 100);

  return (
    <div className="flex min-h-screen bg-[#0c0d10] text-zinc-100">
      <Sidebar />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.username}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">One thing at a time.</h1>
          </div>
          <button onClick={toggleAmbientSound} className="flex h-10 items-center gap-2 rounded-full border border-zinc-800 px-3 text-sm text-zinc-400 hover:text-white" title="Toggle quiet rain">
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundOn ? 'Rain on' : 'Sound off'}</span>
          </button>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-[560px] flex-col items-center justify-center rounded-[28px] border border-zinc-800/80 bg-zinc-950/60 px-6 py-10">
            <div className="mb-8 flex rounded-full border border-zinc-800 p-1">
              {(['stopwatch', 'pomodoro'] as const).map((item) => (
                <button key={item} onClick={() => { reset(); setMode(item); }} className={`rounded-full px-4 py-2 text-xs font-medium capitalize ${mode === item ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-200'}`}>
                  {item}
                </button>
              ))}
            </div>

            {mode === 'pomodoro' && (
              <div className="mb-5 flex gap-2">
                {[15, 25, 50].map((minutes) => (
                  <button key={minutes} onClick={() => { reset(); setPomodoroMinutes(minutes); }} className={`rounded-full px-3 py-1.5 text-xs ${pomodoroMinutes === minutes ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-500'}`}>{minutes}m</button>
                ))}
              </div>
            )}

            <div className="relative mb-8 flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
              <svg className="-rotate-90" width="100%" height="100%" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="148" fill="none" stroke="#27272a" strokeWidth="5" />
                {mode === 'pomodoro' && <circle cx="160" cy="160" r="148" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeDasharray={930} strokeDashoffset={930 - (930 * progress) / 100} />}
              </svg>
              <div className="absolute text-center">
                <span className="font-mono text-6xl font-light tracking-tighter sm:text-7xl">{formatTime(displaySeconds)}</span>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-600">{isRunning ? 'Focusing' : 'Ready'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={reset} className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-500 hover:text-white" title="Reset (R)"><RotateCcw className="h-4 w-4" /></button>
              <button onClick={startPause} className="flex h-14 min-w-36 items-center justify-center gap-2 rounded-full bg-zinc-100 px-6 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">
                {isRunning ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4 fill-current" /> Start</>}
              </button>
              <button onClick={() => void saveSession()} disabled={elapsed < 5 || saving || isRunning} className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-emerald-400 disabled:opacity-30" title="Save (S)"><Save className="h-4 w-4" /></button>
            </div>
            {message && <p className="mt-5 text-xs text-emerald-400">{message}</p>}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-zinc-800/80 p-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Focus track</p>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Daily goal</p>
                <span className="text-xs text-zinc-500">{Math.floor(todaySeconds / 60)} / {goalMinutes}m</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${goalProgress}%` }} />
              </div>
              <select value={goalMinutes} onChange={(event) => { const value = Number(event.target.value); setGoalMinutes(value); localStorage.setItem('komorebi_daily_goal', String(value)); }} className="mt-4 w-full bg-transparent text-xs text-zinc-400 outline-none">
                {[60, 90, 120, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 p-5">
              <div className="flex items-center gap-2 text-orange-400"><Flame className="h-4 w-4" /><span className="text-sm font-medium">{streak} day streak</span></div>
              <div className="mt-4 space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 truncate text-zinc-400"><Check className="h-3 w-3 text-emerald-500" />{log.category}</span>
                    <span className="ml-3 text-zinc-600">{formatTime(log.durationSeconds)}</span>
                  </div>
                ))}
                {recentLogs.length === 0 && <p className="text-xs text-zinc-600">No sessions yet</p>}
              </div>
            </div>

            <p className="px-1 text-[10px] text-zinc-700">Space start/pause · R reset · S save</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
