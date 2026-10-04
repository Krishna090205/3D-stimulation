import React, { useState } from 'react';
import { BarChart3, ShieldCheck, Target, ChevronDown, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
  sessions: any[];
  onOpenReplay: (session: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onOpenReplay }) => {
  const [filterRange, setFilterRange] = useState<string>('Last 10 Sessions');

  // Hardcoded or computed sample historical sessions to ensure nice rich display matching reference
  const displaySessions = sessions.length > 0 ? sessions : [
    { id: '1', date: 'Today, 14:32', mission: 'Urban Night', score: 82, result: 'Completed' },
    { id: '2', date: 'Yesterday, 18:45', mission: 'Swarm Attack', score: 76, result: 'Completed' },
    { id: '3', date: 'Oct 02, 10:15', mission: 'Rural Area', score: 91, result: 'Completed' },
    { id: '4', date: 'Sep 29, 16:20', mission: 'VIP Protection', score: 88, result: 'Completed' },
    { id: '5', date: 'Sep 27, 11:05', mission: 'Urban Day', score: 85, result: 'Completed' }
  ];

  // Score trend data: 1 to 10 sessions
  const trendPoints = [
    { session: 1, score: 62 },
    { session: 2, score: 65 },
    { session: 3, score: 60 },
    { session: 4, score: 70 },
    { session: 5, score: 68 },
    { session: 6, score: 74 },
    { session: 7, score: 72 },
    { session: 8, score: 79 },
    { session: 9, score: 81 },
    { session: 10, score: 85 }
  ];

  const chartW = 280;
  const chartH = 140;
  const padX = 25;
  const padY = 20;

  const getX = (idx: number) => padX + (idx / 9) * (chartW - padX - 15);
  const getY = (score: number) => chartH - padY - ((score - 50) / 50) * (chartH - padY - 15);

  const pathD = trendPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.score)}`)
    .join(' ');

  const scenariosAccuracy = [
    { label: 'Urban\nNight', name: 'Urban Night', acc: 90, color: 'bg-blue-500' },
    { label: 'Urban\nDay', name: 'Urban Day', acc: 85, color: 'bg-emerald-500' },
    { label: 'Rural', name: 'Rural Area', acc: 88, color: 'bg-teal-500' },
    { label: 'Swarm', name: 'Swarm Attack', acc: 76, color: 'bg-amber-500' },
    { label: 'VIP', name: 'VIP Protection', acc: 92, color: 'bg-rose-500' }
  ];

  return (
    <div className="w-full h-full flex flex-col p-8 sm:p-10 bg-slate-50/50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 9 */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Training History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational review and performance analytics
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <span>{filterRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
      </div>

      {/* 3 Metric Summary Cards matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-6">
        {/* Card 1: Average Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex flex-col mt-1">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              82%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Average Score
            </span>
          </div>
        </div>

        {/* Card 2: Detection Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col mt-1">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              87%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Detection Accuracy
            </span>
          </div>
        </div>

        {/* Card 3: Engagement Success */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex flex-col mt-1">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              75%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Engagement Success
            </span>
          </div>
        </div>
      </div>

      {/* 2 Side-by-Side Charts matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">
        {/* Score Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
            Score Trend
          </span>

          <div className="w-full flex items-center justify-center py-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36">
              {/* Horizontal Grid lines */}
              {[50, 75, 100].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartW - 10}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800 stroke-[1] stroke-dasharray-[2,2]"
                    />
                    <text
                      x={padX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots */}
              {trendPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(p.score)}
                  r="3"
                  className="fill-[#10b981] stroke-white dark:stroke-[#0c1524] stroke-2"
                />
              ))}

              {/* X Axis labels */}
              <text
                x={chartW / 2}
                y={chartH - 2}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-sans"
              >
                Session (1 to 10)
              </text>
            </svg>
          </div>
        </div>

        {/* Accuracy by Scenario */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
            Accuracy by Scenario
          </span>

          <div className="w-full flex items-end justify-around gap-2 pt-6 pb-2 h-36">
            {scenariosAccuracy.map((scen, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  {scen.acc}%
                </span>
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-md h-24 flex items-end overflow-hidden">
                  <div
                    className={`w-full ${scen.color} rounded-t-md transition-all duration-500`}
                    style={{ height: `${scen.acc}%` }}
                  />
                </div>
                <span className="text-[9px] font-sans text-slate-500 text-center leading-tight whitespace-pre-line">
                  {scen.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Previous Sessions Table matching reference */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
          Recent Training Sessions
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans text-xs">
          {displaySessions.map((ses: any, idx: number) => {
            const title = ses.scenario_title || ses.mission || 'Training Mission';
            const score = ses.score || 82;
            const result = ses.result || 'Completed';
            return (
              <div
                key={idx}
                onClick={() => onOpenReplay(ses)}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {score}%
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {result}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
