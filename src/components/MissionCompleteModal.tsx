import React from 'react';
import { CheckCircle2, ArrowRight, Plane, Clock, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MissionCompleteModalProps {
  isOpen: boolean;
  onViewAar: () => void;
  onReturnToDashboard: () => void;
  score?: number;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  isOpen,
  onViewAar,
  onReturnToDashboard,
  score = 82
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Clean Mission Complete Card matching reference Screen 6 */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#0c1524] p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-5">
        {/* Big Green Checkmark */}
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title and Subtitle */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Mission Complete
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Well done! Here is your performance summary.
          </p>
        </div>

        {/* Large Score: 82 / 100 */}
        <div className="flex flex-col items-center">
          <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            <span>{score}</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1.5">/</span>
            <span className="text-slate-900 dark:text-white">100</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Mission Score
          </span>
        </div>

        {/* 3 Useful Metrics Cards matching reference image */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {/* Neutralized */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1">
            <Plane className="w-4 h-4 text-emerald-500" />
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              4 / 5
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Drones Neutralized
            </span>
          </div>

          {/* Avg Detection Time */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              15s
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Avg. Detection Time
            </span>
          </div>

          {/* Classification Accuracy */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              85%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Classification Accuracy
            </span>
          </div>
        </div>

        {/* Buttons Stack matching image */}
        <div className="w-full flex flex-col gap-2.5 mt-2 font-sans text-xs">
          <button
            onClick={onViewAar}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <span>View After-Action Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
