import React from 'react';
import { Scenario } from '../types/simulation';
import { User, Clock, Compass, Shield, Target, ArrowRight, ArrowLeft } from 'lucide-react';
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

  // Dynamic scenario photographic preview based on map type
  const getScenarioImage = () => {
    switch (scenario.terrain) {
      case 'urban':
        return 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80';
      case 'urban_night':
        return 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80';
      case 'rural':
        return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';
      case 'desert':
        return 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80';
      case 'compound':
        return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';
      default:
        return 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80';
    }
  };

  const getEnvironmentLabel = () => {
    switch (scenario.terrain) {
      case 'urban':
        return 'Urban Metropolitan / Clear Day';
      case 'urban_night':
        return 'Urban Metropolis / Midnight Operations';
      case 'rural':
        return 'Mountain Valley / Conifer Pine Forest';
      case 'desert':
        return 'Arid Desert / Forward Operating Base (FOB)';
      case 'compound':
        return 'Executive Compound / Presidential Helipad';
      default:
        return 'Urban Metropolitan Outpost';
    }
  };

  const getThreatBadge = () => {
    if (scenario.difficulty === 'EXPERT' || scenario.id === 'scen-4') {
      return { text: 'Critical', bg: 'bg-red-500 text-white', letter: 'C' };
    }
    if (scenario.difficulty === 'HARD' || scenario.id === 'scen-2') {
      return { text: 'High', bg: 'bg-red-500 text-white', letter: 'A' };
    }
    return { text: 'Standard', bg: 'bg-amber-500 text-white', letter: 'B' };
  };

  const threat = getThreatBadge();

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
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {scenario.title || scenario.name}
            </h1>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Mission ID: {scenario.id} • Tactical Deployment
            </span>
          </div>
        </div>

        {/* Top-Right User Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Wide Hero Image Preview Card with glowing drones */}
        <div className="w-full h-64 md:h-72 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative bg-slate-900">
          <img
            src={getScenarioImage()}
            alt={scenario.title || scenario.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

          {/* Drones in Sky Visual Markers */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500 animate-ping" />
          <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 rounded-full bg-red-500 shadow-md shadow-red-500 animate-pulse" />
          <div className="absolute top-1/2 left-2/3 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400" />

          {/* Location Badge on Image */}
          <div className="absolute bottom-4 left-5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{getEnvironmentLabel()}</span>
          </div>
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
                Mission Objective
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {scenario.description || 'Detect, track, and neutralize unauthorized hostile UAS vectors entering the defended sector.'}
              </p>
            </div>
          </div>

          {/* Defended Asset row */}
          <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Critical Defended Asset
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {scenario.target_asset || 'Strategic Phased-Array C-UAS Outpost'}
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
                  {getEnvironmentLabel()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Engagement Window</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {Math.round((scenario.duration_sec || 300) / 60)} Minutes ({scenario.time_of_day || 'DAY'})
                </span>
              </div>
            </div>
          </div>

          {/* Threat Level row */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className={`w-6 h-6 rounded-full ${threat.bg} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
              {threat.letter}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400">Threat Assessment</span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {threat.text} ({scenario.threat_count || 5} Incoming UAS Vectors)
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
