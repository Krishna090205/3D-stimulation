import React from 'react';
import { WeaponType, WeaponState } from '../types/simulation';
import { Radio, Crosshair, Network, Zap, RotateCcw, Shield } from 'lucide-react';

interface WeaponsPanelProps {
  currentWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
  weapons: Record<WeaponType, WeaponState>;
  isJammingActive: boolean;
  onTriggerJammerStart: () => void;
  onTriggerJammerStop: () => void;
  onReload: (weapon: WeaponType) => void;
  onFireWeapon: () => void;
  jammerFrequency: string;
  onChangeJammerFreq: (freq: string) => void;
}

export const WeaponsPanel: React.FC<WeaponsPanelProps> = ({
  currentWeapon,
  onSelectWeapon,
  weapons,
  isJammingActive,
  onTriggerJammerStart,
  onTriggerJammerStop,
  onReload,
  onFireWeapon,
  jammerFrequency,
  onChangeJammerFreq
}) => {
  const activeWpn = weapons[currentWeapon];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* Main Counter-Drone Arsenal Dock */}
      <div className="glass-panel p-2.5 rounded-2xl border border-teal-500/40 flex items-center gap-3 shadow-2xl backdrop-blur-xl">
        {/* Weapon 1: Directed RF Jammer */}
        <button
          onClick={() => onSelectWeapon('RF_JAMMER')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all font-mono text-xs ${
            currentWeapon === 'RF_JAMMER'
              ? 'bg-emerald-600 text-white font-bold'
              : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
          }`}
        >
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30">
            <Radio className={`w-4 h-4 ${isJammingActive ? 'text-emerald-300 animate-spin' : 'text-emerald-400'}`} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold tracking-wider">C-UAS RF JAMMER</span>
            <span className="text-[10px] text-emerald-300/80">Directed GNSS/C2 Link</span>
          </div>
          <div className="ml-1 text-right">
            <span className="text-[10px] text-slate-400">HOTKEY</span>
            <div className="text-xs font-bold text-emerald-300">[1]</div>
          </div>
        </button>

        {/* Weapon 2: Heavy Tactical Shotgun */}
        <button
          onClick={() => onSelectWeapon('SHOTGUN')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all font-mono text-xs ${
            currentWeapon === 'SHOTGUN'
              ? 'bg-amber-600 text-white font-bold'
              : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
          }`}
        >
          <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/30">
            <Crosshair className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold tracking-wider">TACTICAL SHOTGUN</span>
            <span className="text-[10px] text-amber-300/80">Tungsten Buckshot</span>
          </div>
          <div className="ml-1 text-right">
            <span className="text-[10px] text-slate-400">AMMO</span>
            <div className="text-xs font-bold text-amber-300">
              {weapons.SHOTGUN.ammo}/{weapons.SHOTGUN.maxAmmo}
            </div>
          </div>
        </button>

        {/* Weapon 3: Pneumatic Net-Gun */}
        <button
          onClick={() => onSelectWeapon('NET_GUN')}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all font-mono text-xs ${
            currentWeapon === 'NET_GUN'
              ? 'bg-purple-600 text-white font-bold'
              : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
          }`}
        >
          <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/30">
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold tracking-wider">NET-GUN LAUNCHER</span>
            <span className="text-[10px] text-purple-300/80">Rotor Entanglement</span>
          </div>
          <div className="ml-1 text-right">
            <span className="text-[10px] text-slate-400">NETS</span>
            <div className="text-xs font-bold text-purple-300">
              {weapons.NET_GUN.ammo}/{weapons.NET_GUN.maxAmmo}
            </div>
          </div>
        </button>
      </div>

      {/* Dynamic Controls Sub-Bar for Selected Weapon */}
      <div className="glass-panel px-4 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-4 text-xs font-mono">
        {currentWeapon === 'RF_JAMMER' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">JAM FREQUENCY:</span>
              {['ALL-BAND', '2.4 GHz', '5.8 GHz', '915 MHz'].map((freq) => (
                <button
                  key={freq}
                  onClick={() => onChangeJammerFreq(freq)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    jammerFrequency === freq
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/20" />

            <button
              onMouseDown={onTriggerJammerStart}
              onMouseUp={onTriggerJammerStop}
              onTouchStart={onTriggerJammerStart}
              onTouchEnd={onTriggerJammerStop}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                isJammingActive
                  ? 'bg-red-600 text-white font-bold'
                  : 'glass-button-primary'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isJammingActive ? 'TRANSMITTING JAM PULSE...' : 'HOLD TO JAM (SPACE)'}</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">STATUS:</span>
              <span className="text-teal-300 font-bold">
                {activeWpn.isReloading ? 'RELOADING...' : 'READY TO FIRE'}
              </span>
            </div>

            <div className="h-4 w-px bg-white/20" />

            <button
              onClick={onFireWeapon}
              disabled={activeWpn.isReloading || activeWpn.ammo <= 0}
              className="px-4 py-1.5 rounded-lg glass-button-primary font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>FIRE INTERCEPTION (LMB)</span>
            </button>

            {activeWpn.ammo < activeWpn.maxAmmo && (
              <button
                onClick={() => onReload(currentWeapon)}
                disabled={activeWpn.isReloading}
                className="px-3 py-1.5 rounded-lg glass-button text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RELOAD (R)</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
