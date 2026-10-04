import React, { useEffect, useState } from 'react';
import { Scenario } from '../types/simulation';
import { CheckCircle2, Circle } from 'lucide-react';

interface InitializingMissionProps {
  scenario: Scenario;
  onReady: () => void;
}

export const InitializingMission: React.FC<InitializingMissionProps> = ({ scenario, onReady }) => {
  const [progress, setProgress] = useState<number>(20);
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStep(1);
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(68);
      setStep(2);
    }, 850);

    const t3 = setTimeout(() => {
      setProgress(85);
      setStep(3);
    }, 1300);

    const t4 = setTimeout(() => {
      setProgress(100);
      setStep(4);
    }, 1800);

    const t5 = setTimeout(() => {
      onReady();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onReady]);

  const checklist = [
    'Loading terrain',
    'Spawning drones',
    'Initializing sensors',
    'Calibrating systems',
    'Ready to deploy'
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 bg-slate-900 overflow-hidden select-none">
      {/* 3D Aerial City Terrain Background */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-90"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%), url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1920&q=80')`
        }}
      />

      {/* Header */}
      <div className="z-10 flex flex-col items-center text-center mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Initializing Mission
        </h1>
        <p className="text-xs text-slate-300 font-mono mt-1">
          {scenario.title} - Swarm Attack
        </p>
      </div>

      {/* Checklist Card on Right */}
      <div className="z-10 w-full max-w-xs ml-auto mr-12 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 font-mono text-xs">
        {checklist.map((item, idx) => {
          const isDone = idx <= step;
          return (
            <div key={idx} className="flex items-center gap-2.5">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              <span
                className={`font-medium ${
                  isDone
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Progress Bar */}
      <div className="z-10 w-full max-w-xl flex items-center gap-4 mb-6 font-mono text-xs text-white">
        <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden backdrop-blur-sm border border-white/20">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-bold text-emerald-400">{progress}%</span>
      </div>
    </div>
  );
};
