import React, { useState } from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Sliders,
  Volume2,
  Crosshair,
  Info,
  X,
  Check,
  Shield,
  Palette
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'General' | 'Graphics' | 'Audio' | 'Controls' | 'Theme' | 'About';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeMode, setThemeMode, theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('Theme');

  // Local settings state
  const [graphicsQuality, setGraphicsQuality] = useState<'High' | 'Medium' | 'Low'>('High');
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [mouseSensitivity, setMouseSensitivity] = useState<number>(50);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                SYSTEM CONFIGURATION & SETTINGS
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Environment preferences & interface personalization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-button text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Tabs & Right Panel */}
        <div className="grid grid-cols-3 gap-6 min-h-[280px]">
          {/* Left Vertical Navigation Tabs */}
          <div className="flex flex-col gap-1.5 border-r border-[var(--border-subtle)] pr-4 font-mono text-xs">
            {[
              { id: 'General', icon: Sliders, label: 'General' },
              { id: 'Graphics', icon: Monitor, label: 'Graphics' },
              { id: 'Audio', icon: Volume2, label: 'Audio' },
              { id: 'Controls', icon: Crosshair, label: 'Controls' },
              { id: 'Theme', icon: Palette, label: 'Theme' },
              { id: 'About', icon: Info, label: 'About' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-medium text-left ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-500" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content View */}
          <div className="col-span-2 flex flex-col justify-between">
            {activeTab === 'Theme' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Theme Mode</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Select your visual presentation theme. All training, dashboards, radar, and AAR screens adjust seamlessly.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Light Mode */}
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-mono transition-all gap-2 ${
                      themeMode === 'light'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-md'
                        : 'border-[var(--border-subtle)] glass-panel-subtle text-[var(--text-secondary)] hover:border-emerald-500/50'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span>Light</span>
                    <span className="text-[9px] opacity-75 font-sans">Clean & Daytime</span>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-mono transition-all gap-2 ${
                      themeMode === 'dark'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-md'
                        : 'border-[var(--border-subtle)] glass-panel-subtle text-[var(--text-secondary)] hover:border-emerald-500/50'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span>Dark</span>
                    <span className="text-[9px] opacity-75 font-sans">Tactical Night</span>
                  </button>

                  {/* System Mode */}
                  <button
                    onClick={() => setThemeMode('system')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-mono transition-all gap-2 ${
                      themeMode === 'system'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-md'
                        : 'border-[var(--border-subtle)] glass-panel-subtle text-[var(--text-secondary)] hover:border-emerald-500/50'
                    }`}
                  >
                    <Monitor className="w-5 h-5 text-teal-400" />
                    <span>System</span>
                    <span className="text-[9px] opacity-75 font-sans">Auto OS sync</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl glass-panel-subtle text-xs text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Currently rendering: <strong>{theme.toUpperCase()} THEME</strong>
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'General' && (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">General Preferences</h3>
                <div className="flex justify-between items-center p-2.5 rounded-xl glass-panel-subtle">
                  <span>Language</span>
                  <span className="text-emerald-500 font-bold">English (US/Def)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl glass-panel-subtle">
                  <span>Unit System</span>
                  <span className="text-emerald-500 font-bold">Metric (Meters, m/s)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl glass-panel-subtle">
                  <span>Auto-Save Telemetry</span>
                  <span className="text-emerald-500 font-bold">Enabled (SQLite WAL)</span>
                </div>
              </div>
            )}

            {activeTab === 'Graphics' && (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Render Quality</h3>
                <div className="flex justify-between items-center">
                  <span>Shader Fidelity</span>
                  <div className="flex gap-1.5">
                    {(['Low', 'Medium', 'High'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setGraphicsQuality(q)}
                        className={`px-2.5 py-1 rounded-lg text-xs ${
                          graphicsQuality === q ? 'bg-emerald-500 text-white font-bold' : 'glass-panel-subtle'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl glass-panel-subtle">
                  <span>Target Framerate</span>
                  <span className="text-emerald-500 font-bold">60 FPS (V-Sync)</span>
                </div>
              </div>
            )}

            {activeTab === 'Audio' && (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Audio Settings</h3>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Master Volume</span>
                    <span className="text-emerald-500 font-bold">{masterVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl glass-panel-subtle">
                  <span>3D Spatial HRTF Audio</span>
                  <span className="text-emerald-500 font-bold">ACTIVE (Web Audio API)</span>
                </div>
              </div>
            )}

            {activeTab === 'Controls' && (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Mouse & Crosshair</h3>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Aim Sensitivity</span>
                    <span className="text-emerald-500 font-bold">{mouseSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={mouseSensitivity}
                    onChange={(e) => setMouseSensitivity(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div className="text-[11px] text-[var(--text-muted)] space-y-1">
                  <div>• [1] RF Jammer • [2] Shotgun • [3] Net Gun</div>
                  <div>• LMB: Fire • [Space]: Jam • [R]: Reload • [I]: Instructor</div>
                </div>
              </div>
            )}

            {activeTab === 'About' && (
              <div className="flex flex-col gap-2.5 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">AeroShield C-UAS Trainer</span>
                </div>
                <p className="text-[var(--text-muted)] font-sans text-xs">
                  Smart India Hackathon 2024 (Problem Statement 26247). Built with React 18, Three.js, Web Audio HRTF, and SQLite.
                </p>
                <div className="p-2 rounded-lg glass-panel-subtle text-[10px] text-emerald-500">
                  Version 2.4.0-Production // Offline-First Engine
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)] mt-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl glass-button-primary text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>SAVE & CLOSE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
