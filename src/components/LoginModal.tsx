import React, { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import loginSoldierBg from '../assets/login-soldier-bg.jpg';

interface LoginModalProps {
  onLogin: (callsign: string, rank: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [unitId, setUnitId] = useState<string>('INF-2024-089');
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unitId.trim()) {
      onLogin(unitId.trim(), 'Indus Army');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc] dark:bg-[#070d18] select-none overflow-hidden">
      {/* Container matching Screen 1: 1. Login Page */}
      <div className="w-full h-full max-w-[1440px] max-h-[900px] flex overflow-hidden relative shadow-2xl">
        {/* Left Side: Visual Hero with Soldier and Drones */}
        <div className="relative w-[55%] h-full overflow-hidden flex flex-col items-center justify-between p-12 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url(${loginSoldierBg})` }}
          />
          {/* Subtle gradient overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 pointer-events-none" />

          {/* Centered Brand on Hero */}
          <div className="relative z-10 flex flex-col items-center text-center mt-12">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-wide uppercase text-white drop-shadow-md">
              Drone Defence Trainer
            </h1>
            <p className="text-xs font-medium tracking-widest text-slate-200 mt-2 uppercase">
              Train • Detect • Protect
            </p>
          </div>

          <div className="relative z-10 text-[11px] text-slate-300 font-mono tracking-wider opacity-80">
            AI-Enabled Drone & Counter-Drone Threat Simulation Trainer
          </div>
        </div>

        {/* Right Side: Clean Minimal Login Card */}
        <div className="w-[45%] h-full bg-white dark:bg-[#0c1524] flex items-center justify-center p-12 lg:p-16 border-l border-slate-200 dark:border-slate-800">
          <div className="w-full max-w-sm flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Login to start your training
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              {/* Unit ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit ID
                </label>
                <input
                  type="text"
                  required
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  placeholder="INF-2024-089"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full mt-3 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow transition-all"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
