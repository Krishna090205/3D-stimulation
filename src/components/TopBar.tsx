import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Clock,
  Radio,
  Crosshair,
  Shield,
  Bell,
  Sun,
  Moon,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface TopBarProps {
  sessionTitle: string;
  sessionSubtitle?: string;
  durationSeconds: number;
  detectedCount: number;
  engagedCount: number;
  remainingCount: number;
  onEndSession: () => void;
  onOpenSettings: () => void;
  currentStep?: 'MISSION' | 'DETECT' | 'IDENTIFY' | 'DECISION' | 'ENGAGE' | 'REVIEW';
}

export const TopBar: React.FC<TopBarProps> = ({
  sessionTitle,
  sessionSubtitle = 'Swarm Attack',
  durationSeconds,
  detectedCount,
  engagedCount,
  remainingCount,
  onEndSession,
  onOpenSettings,
  currentStep = 'MISSION'
}) => {
  const { theme, toggleTheme } = useTheme();

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} / 05:00`;

  return (
    <header className="h-14 px-6 glass-panel border-b border-[var(--border-color)] flex items-center justify-between z-20 select-none">
      {/* Session Title & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs">
          🛡️
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
            {sessionTitle}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {sessionSubtitle}
          </span>
        </div>
      </div>

      {/* Center Soldier Flow Steps: Choose mission -> Detect -> Identify -> Make decision -> Engage -> Review */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel-subtle border border-[var(--border-subtle)] text-[10px] font-mono shadow-sm">
        <span className={currentStep === 'MISSION' ? 'text-emerald-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
          1. Mission
        </span>
        <span className="text-[var(--text-muted)]">➔</span>
        <span className={currentStep === 'DETECT' ? 'text-amber-500 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}>
          2. Detect
        </span>
        <span className="text-[var(--text-muted)]">➔</span>
        <span className={currentStep === 'IDENTIFY' ? 'text-amber-500 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}>
          3. Identify
        </span>
        <span className="text-[var(--text-muted)]">➔</span>
        <span className={currentStep === 'DECISION' ? 'text-amber-500 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}>
          4. Decision
        </span>
        <span className="text-[var(--text-muted)]">➔</span>
        <span className={currentStep === 'ENGAGE' ? 'text-red-500 font-bold animate-pulse' : 'text-[var(--text-secondary)]'}>
          5. Engage
        </span>
        <span className="text-[var(--text-muted)]">➔</span>
        <span className={currentStep === 'REVIEW' ? 'text-emerald-500 font-bold' : 'text-[var(--text-muted)]'}>
          6. Review
        </span>
      </div>

      {/* Telemetry Status Badges & Timer */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-panel-subtle text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-bold">{timeFormatted}</span>
        </div>

        {/* Status Badges */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Detected */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Detected</span>
            <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {detectedCount}
            </span>
          </div>

          {/* Engaged */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Engaged</span>
            <span className="ml-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {engagedCount}
            </span>
          </div>

          {/* Remaining */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Remaining</span>
            <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {remainingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* End Session Button */}
        <button
          onClick={onEndSession}
          className="px-3.5 py-1.5 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/15 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>End Session</span>
        </button>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl glass-button text-[var(--text-secondary)] hover:text-emerald-500 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl glass-button text-[var(--text-secondary)] hover:text-emerald-500 cursor-pointer"
          title="Open Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center font-bold text-xs text-emerald-500">
          V
        </div>
      </div>
    </header>
  );
};
