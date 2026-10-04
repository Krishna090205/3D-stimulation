import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  LayoutDashboard,
  Crosshair,
  History,
  TrendingUp,
  Settings as SettingsIcon,
  User,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export type NavTab = 'Dashboard' | 'Training' | 'History' | 'Performance' | 'Settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLogout?: () => void;
  userCallsign: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  userCallsign = 'INF-2024-089'
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const navItems: { id: NavTab; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Training', icon: Crosshair, label: 'Training' },
    { id: 'History', icon: History, label: 'History' },
    { id: 'Performance', icon: TrendingUp, label: 'Performance' },
    { id: 'Settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <aside className="w-56 h-screen flex flex-col justify-between p-4 bg-white dark:bg-[#0c1524] border-r border-slate-200 dark:border-slate-800/80 z-30 select-none shrink-0 transition-colors duration-200 shadow-2xs">
      {/* Brand Header matching reference image */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-wider text-slate-900 dark:text-white leading-tight">
              DRONE DEFENCE
            </span>
            <span className="text-[10px] font-sans tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              TRAINER
            </span>
          </div>
        </div>

        {/* Navigation items: Dashboard, Training, History, Performance, Settings */}
        <nav className="flex flex-col gap-1 text-xs font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/25 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section with Quick Theme Toggle matching reference image */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
              {userCallsign}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Indus Army
            </span>
          </div>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
