import React from 'react';
import { User, Shield, Award, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface ProfileViewProps {
  user: {
    id: string;
    callsign: string;
    rank: string;
  };
  stats: {
    total_missions: number;
    victories: number;
    total_neutralized: number;
    accuracy_percent: number;
    avg_score: number;
  };
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, stats }) => {
  return (
    <div className="w-full h-full flex flex-col p-6 sm:p-8 overflow-y-auto select-none gap-6 font-mono text-xs">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            OPERATOR SERVICE DOSSIER
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Military credentials & C-UAS deployment record
          </p>
        </div>
        <span className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
          SECURITY LEVEL: TOP SECRET / NOFORN
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left ID Card */}
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-3xl shadow-lg">
            🎖️
          </div>

          <div className="flex flex-col">
            <span className="text-base font-bold text-[var(--text-primary)]">{user.callsign}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{user.rank}</span>
            <span className="text-[10px] text-[var(--text-muted)] mt-1">INF-2024-089 • Indian Army</span>
          </div>

          <div className="w-full pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2 text-left">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Specialization</span>
              <span className="font-bold text-[var(--text-primary)]">EW & Drone Intercept</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Deployment Sector</span>
              <span className="font-bold text-[var(--text-primary)]">Northern Air Defence</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Readiness</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">100% OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Right Details */}
        <div className="col-span-2 glass-panel p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-5 justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border-subtle)]">
              Authorized Counter-UAS Weapon Certifications
            </h2>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { name: 'Directed RF Jammer (GNSS/C2 Link)', level: 'Instructor Grade', status: 'ACTIVE' },
                { name: '12-Gauge Kinetic Tungsten Buckshot', level: 'Master Marksman', status: 'ACTIVE' },
                { name: 'Pneumatic Net Launcher (Rotor Foil)', level: 'Qualified Specialist', status: 'ACTIVE' },
                { name: 'Multi-Spectral FLIR / RF Heatmap', level: 'Sensor Analyst', status: 'ACTIVE' }
              ].map((cert, i) => (
                <div key={i} className="p-3 rounded-xl glass-panel-subtle flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">{cert.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{cert.level}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl glass-panel-subtle text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
            Operator profile is verified under Smart India Hackathon 2024 problem guidelines. All combat metrics and simulations are logged locally using persistent SQLite WAL storage.
          </div>
        </div>
      </div>
    </div>
  );
};
