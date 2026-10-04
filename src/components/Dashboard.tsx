import React from 'react';
import { Shield, ArrowRight, Star, Calendar, User, Crosshair } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  user: {
    id: string;
    callsign: string;
    rank: string;
  };
  stats: {
    total_missions: number;
    victories: number;
    total_neutralized: number;
    accuracy_percent: number;
    avg_score: number;
  };
  recentSessions: any[];
  onStartTraining: () => void;
  onOpenReplay: (session: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  stats,
  recentSessions,
  onStartTraining,
  onOpenReplay
}) => {
  const { isDark } = useTheme();

  return (
    <div className="w-full h-full flex flex-col p-8 bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 2 */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Welcome Back, <span className="font-extrabold">{user.callsign}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Ready for your next training session?
          </p>
        </div>

        {/* Top-Right User Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Large Primary Hero Card: "Start Training →" matching reference image */}
      <div
        onClick={onStartTraining}
        className="relative w-full rounded-3xl p-8 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between min-h-[175px] border border-emerald-500/30"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10b981 60%, #047857 100%)'
        }}
      >
        {/* Subtle drone silhouette background graphic */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity">
          <svg width="220" height="110" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="52" y="24" width="16" height="12" rx="4" fill="white" />
            <line x1="20" y1="16" x2="100" y2="44" stroke="white" strokeWidth="3" />
            <line x1="20" y1="44" x2="100" y2="16" stroke="white" strokeWidth="3" />
            <ellipse cx="20" cy="16" rx="14" ry="4" fill="white" fillOpacity="0.8" />
            <ellipse cx="100" cy="16" rx="14" ry="4" fill="white" fillOpacity="0.8" />
            <ellipse cx="20" cy="44" rx="14" ry="4" fill="white" fillOpacity="0.8" />
            <ellipse cx="100" cy="44" rx="14" ry="4" fill="white" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Hero icon badge */}
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-6">
          <Crosshair className="w-6 h-6 stroke-[2.5]" />
        </div>

        {/* Hero Title with Arrow */}
        <div className="flex items-center gap-3 text-white font-extrabold text-2xl tracking-wide group-hover:translate-x-1 transition-transform">
          <span>Start Training</span>
          <ArrowRight className="w-6 h-6" />
        </div>
      </div>

      {/* 3 Useful Statistics Cards below matching Screen 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Stat Card 1: Sessions Completed (Blue Icon) */}
        <div className="bg-white dark:bg-[#0c1524] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            24
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
            Sessions Completed
          </span>
        </div>

        {/* Stat Card 2: Average Score (Emerald Shield Icon) */}
        <div className="bg-white dark:bg-[#0c1524] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            82%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
            Average Score
          </span>
        </div>

        {/* Stat Card 3: Detection Accuracy (Orange Star Icon) */}
        <div className="bg-white dark:bg-[#0c1524] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            87%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
            Detection Accuracy
          </span>
        </div>
      </div>
    </div>
  );
};
