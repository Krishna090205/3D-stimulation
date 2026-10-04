import React from 'react';
import { Target, ShieldCheck, Crosshair, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface PerformanceViewProps {
  stats?: {
    total_missions?: number;
    victories?: number;
    total_neutralized?: number;
    accuracy_percent?: number;
    avg_score?: number;
  };
}

export const PerformanceView: React.FC<PerformanceViewProps> = () => {
  return (
    <div className="w-full h-full flex flex-col p-8 sm:p-10 bg-slate-50/50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Performance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational competency and counter-drone readiness metrics
          </p>
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Operator"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 4 Core Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-6">
        {/* Metric 1: Overall Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>Overall Score</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">Top 10%</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">82</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
        </div>

        {/* Metric 2: Detection Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>Detection Accuracy</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">87%</span>
          </div>
        </div>

        {/* Metric 3: Classification Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>Classification Accuracy</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">85%</span>
          </div>
        </div>

        {/* Metric 4: Engagement Success */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>Engagement Success</span>
            <span className="text-[10px] text-slate-400 font-mono">4/5 targets</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">75%</span>
          </div>
        </div>
      </div>

      {/* Charts & Areas to Improve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6">
        {/* Detection Time Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
              Detection Time Trend
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">15s avg</span>
          </div>

          <div className="py-4">
            <div className="flex items-end justify-between gap-3 h-28 pt-2">
              {[
                { label: 'S1', val: 27 },
                { label: 'S2', val: 22 },
                { label: 'S3', val: 19 },
                { label: 'S4', val: 16 },
                { label: 'S5', val: 14 }
              ].map((pt, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400">{pt.val}s</span>
                  <div
                    className="w-full max-w-[24px] bg-emerald-500/80 rounded-t-md"
                    style={{ height: `${(pt.val / 30) * 100}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-500">{pt.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Reaction time decreased by 48% across sessions</p>
        </div>

        {/* Accuracy by Scenario */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
              Accuracy by Scenario
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">5 Scenarios</span>
          </div>

          <div className="flex flex-col gap-2.5 py-3">
            {[
              { name: 'VIP Protection', acc: 92, color: 'bg-rose-500' },
              { name: 'Urban Night', acc: 90, color: 'bg-blue-500' },
              { name: 'Rural Area', acc: 88, color: 'bg-teal-500' },
              { name: 'Urban Day', acc: 85, color: 'bg-emerald-500' },
              { name: 'Swarm Attack', acc: 76, color: 'bg-amber-500' }
            ].map((scen, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{scen.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{scen.acc}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${scen.color} rounded-full`} style={{ width: `${scen.acc}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Highest proficiency observed in VIP Protection</p>
        </div>

        {/* Areas to Improve */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
            Areas to Improve
          </span>

          <div className="flex flex-col gap-3 py-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Swarm Tracking</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Improve multi-target RF sensor scanning speed</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Thermal Identification</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Practice EO/IR thermal zoom on low-altitude targets</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Kinetic Precision</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Net gun leading distance calibration on FPV drones</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">Recommendations generated from after-action telemetry</p>
        </div>
      </div>
    </div>
  );
};
