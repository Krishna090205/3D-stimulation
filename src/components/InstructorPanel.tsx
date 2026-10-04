import React, { useState } from 'react';
import { DroneType, WeatherType, TimeOfDay } from '../types/simulation';
import { Sliders, CloudRain, Sun, Moon, Plus, AlertOctagon, Zap, ShieldAlert, X } from 'lucide-react';

interface InstructorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherType;
  currentTimeOfDay: TimeOfDay;
  onChangeWeather: (weather: WeatherType) => void;
  onChangeTimeOfDay: (timeOfDay: TimeOfDay) => void;
  onSpawnDrones: (type: DroneType, count: number) => void;
  onTriggerSwarmRush: () => void;
  onTriggerECCM: () => void;
  activeDroneCount: number;
  neutralizedCount: number;
  assetHealth: number;
}

export const InstructorPanel: React.FC<InstructorPanelProps> = ({
  isOpen,
  onClose,
  currentWeather,
  currentTimeOfDay,
  onChangeWeather,
  onChangeTimeOfDay,
  onSpawnDrones,
  onTriggerSwarmRush,
  onTriggerECCM,
  activeDroneCount,
  neutralizedCount,
  assetHealth
}) => {
  const [selectedDroneType, setSelectedDroneType] = useState<DroneType>('FPV_KAMIKAZE');
  const [spawnCount, setSpawnCount] = useState<number>(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-teal-500/40 p-6 flex flex-col gap-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/40">
              <Sliders className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                INSTRUCTOR LIVE CONTROL PANEL
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded">
                  OVERRIDE ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Dynamic Scenario & Threat Injection Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-button text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Session Telemetry Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel-subtle p-2.5 rounded-xl border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">ACTIVE THREATS</span>
            <span className="text-xl font-bold font-mono text-red-400">{activeDroneCount} Airborne</span>
          </div>
          <div className="glass-panel-subtle p-2.5 rounded-xl border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">NEUTRALIZED</span>
            <span className="text-xl font-bold font-mono text-teal-400">{neutralizedCount} Units</span>
          </div>
          <div className="glass-panel-subtle p-2.5 rounded-xl border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">ASSET INTEGRITY</span>
            <span className="text-xl font-bold font-mono text-amber-400">{Math.round(assetHealth)}%</span>
          </div>
        </div>

        {/* Weather & Environmental Control */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5" /> Atmospheric & Environmental Conditions
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Weather Buttons */}
            <div className="flex gap-1.5 p-1 glass-panel-subtle rounded-xl border border-white/5">
              {(['clear', 'fog', 'rain'] as WeatherType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => onChangeWeather(w)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                    currentWeather === w
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Time of Day Buttons */}
            <div className="flex gap-1.5 p-1 glass-panel-subtle rounded-xl border border-white/5">
              <button
                onClick={() => onChangeTimeOfDay('day')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                  currentTimeOfDay === 'day'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Day
              </button>
              <button
                onClick={() => onChangeTimeOfDay('night')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                  currentTimeOfDay === 'night'
                    ? 'bg-indigo-500 text-white font-bold shadow-md'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Night
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Threat Spawn Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Inject Surprise Drone Wave
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <select
                value={selectedDroneType}
                onChange={(e) => setSelectedDroneType(e.target.value as DroneType)}
                className="w-full px-3 py-2 rounded-xl glass-panel-subtle border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-400"
              >
                <option value="FPV_KAMIKAZE" className="bg-[#0a192f]">FPV Kamikaze Drone (High Speed)</option>
                <option value="DJI_MAVIC" className="bg-[#0a192f]">Commercial DJI Recon Quad</option>
                <option value="MILITARY_FIXED_WING" className="bg-[#0a192f]">Military Delta-Wing UAV</option>
                <option value="SWARM_ASSAULT" className="bg-[#0a192f]">Autonomous Swarm Unit</option>
                <option value="MICRO_SURVEILLANCE" className="bg-[#0a192f]">Micro-UAV Surveillance</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Qty:</span>
              <input
                type="number"
                min="1"
                max="6"
                value={spawnCount}
                onChange={(e) => setSpawnCount(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-2 rounded-xl glass-panel-subtle border border-white/10 text-center text-xs font-mono font-bold text-teal-400"
              />
              <button
                onClick={() => onSpawnDrones(selectedDroneType, spawnCount)}
                className="flex-1 py-2 px-3 rounded-xl glass-button-primary text-xs font-mono font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> SPAWN
              </button>
            </div>
          </div>
        </div>

        {/* Combat Stress Triggers */}
        <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
          <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Combat Stress Injections
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onTriggerSwarmRush}
              className="py-2.5 px-3 rounded-xl glass-panel-danger text-xs font-mono text-red-200 hover:bg-red-900/40 flex items-center justify-center gap-2 border border-red-500/40 font-bold"
            >
              <Zap className="w-4 h-4 text-red-400" />
              <span>TRIGGER SWARM CONVERGE</span>
            </button>

            <button
              onClick={onTriggerECCM}
              className="py-2.5 px-3 rounded-xl glass-panel text-xs font-mono text-amber-200 hover:bg-amber-900/30 flex items-center justify-center gap-2 border border-amber-500/40 font-bold"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>SPOOF GPS / ECCM HOP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
