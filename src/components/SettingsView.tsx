import React, { useState } from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface SettingsViewProps {
  unitId?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ unitId = 'INF-2024-089' }) => {
  const { themeMode, setThemeMode, theme, isDark } = useTheme();

  const [masterVolume, setMasterVolume] = useState<number>(75);
  const [spatialAudio, setSpatialAudio] = useState<boolean>(true);
  const [graphicsQuality, setGraphicsQuality] = useState<'High' | 'Medium' | 'Low'>('High');
  const [mouseSensitivity, setMouseSensitivity] = useState<number>(50);

  return (
    <div className="w-full h-full flex flex-col p-8 sm:p-10 bg-slate-50/50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 10 */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        {/* User Avatar top-right */}
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Operator"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="max-w-2xl flex flex-col gap-8 py-6">
        {/* Section 1: Theme */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setThemeMode('light')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-600 shadow-sm ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1524] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1524] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setThemeMode('system')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-600 shadow-sm ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1524] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Monitor className="w-4 h-4 text-slate-500" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Section 2: Audio */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
            Audio
          </label>

          {/* Master Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Master Volume</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          {/* Spatial Audio Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">Spatial Audio</span>
            <button
              onClick={() => setSpatialAudio(!spatialAudio)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                spatialAudio ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  spatialAudio ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Graphics */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
            Graphics
          </label>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Quality</span>
            <select
              value={graphicsQuality}
              onChange={(e) => setGraphicsQuality(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c1524] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Section 4: Controls */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
            Controls
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Mouse Sensitivity</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{mouseSensitivity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={mouseSensitivity}
              onChange={(e) => setMouseSensitivity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Section 5: Account */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
            Account
          </label>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Unit ID</span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
              {unitId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
