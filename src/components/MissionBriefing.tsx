import React from 'react';
import { Scenario } from '../types/simulation';
import { User, Clock, Compass, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MissionBriefingProps {
  scenario: Scenario;
  onBeginTraining: () => void;
  onBack: () => void;
  userCallsign?: string;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({
  scenario,
  onBeginTraining,
  onBack,
  userCallsign = 'INF-2024-089'
}) => {
  const { isDark } = useTheme();

  return (
    <div className="w-full h-full flex flex-col p-8 bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 4 */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1524] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back to Mission Selection"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {scenario.title || 'Urban Night - Swarm Attack'}
          </h1>
        </div>

        {/* Top-Right User Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Main Container matching Screen 4 layout */}
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Wide Hero Image Preview Card with glowing drones */}
        <div className="w-full h-64 md:h-72 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80"
            alt={scenario.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Drones in Sky Visual Markers */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500 animate-ping" />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500 animate-pulse" />
        </div>

        {/* Details Section below image */}
        <div className="flex flex-col gap-4 bg-white dark:bg-[#0c1524] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Objective row with green 'D' badge */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
              D
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Objective
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Detect and neutralize unauthorized drones entering the protected urban area.
              </p>
            </div>
          </div>

          {/* Environment & Duration metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Environment</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {scenario.terrain === 'urban' ? 'Urban / Night' : scenario.terrain === 'rural' ? 'Rural / Open' : 'Urban / Day'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Duration</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  5 minutes
                </span>
              </div>
            </div>
          </div>

          {/* Threat Level row with red 'A' badge */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400">Threat Level</span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                High
              </span>
            </div>
          </div>
        </div>

        {/* Big Emerald Primary Action Button */}
        <button
          onClick={onBeginTraining}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
        >
          <span>Begin Training</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
