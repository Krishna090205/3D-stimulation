import React from 'react';
import { SensorLayer, DroneEntity } from '../types/simulation';
import { Eye, Flame, Radio, Activity, Target, Volume2, ShieldAlert } from 'lucide-react';

interface SensorsPanelProps {
  currentLayer: SensorLayer;
  onSelectLayer: (layer: SensorLayer) => void;
  showLeadIndicator: boolean;
  onToggleLeadIndicator: () => void;
  showDistanceTags: boolean;
  onToggleDistanceTags: () => void;
  zoomLevel: number;
  onToggleZoom: () => void;
  drones: DroneEntity[];
}

export const SensorsPanel: React.FC<SensorsPanelProps> = ({
  currentLayer,
  onSelectLayer,
  showLeadIndicator,
  onToggleLeadIndicator,
  showDistanceTags,
  onToggleDistanceTags,
  zoomLevel,
  onToggleZoom,
  drones
}) => {
  const activeDrones = drones.filter((d) => d.state === 'ACTIVE' || d.state === 'EVADING');

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 w-64 select-none pointer-events-auto">
      {/* Sensor Layer Switcher Card */}
      <div className="glass-panel p-3 rounded-xl border border-teal-500/30 flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="text-[11px] font-mono tracking-wider text-teal-400 font-bold uppercase flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Sensor Layers
          </span>
          <span className="text-[10px] font-mono text-slate-400">FLIR / EO / RF</span>
        </div>

        {/* 4 Sensor Layer Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onSelectLayer('EO')}
            className={`px-2.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              currentLayer === 'EO'
                ? 'bg-emerald-600 text-white font-bold'
                : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>EO Color</span>
          </button>

          <button
            onClick={() => onSelectLayer('IR_WHITE_HOT')}
            className={`px-2.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              currentLayer === 'IR_WHITE_HOT'
                ? 'bg-amber-600 text-white font-bold'
                : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>IR W-Hot</span>
          </button>

          <button
            onClick={() => onSelectLayer('IR_BLACK_HOT')}
            className={`px-2.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              currentLayer === 'IR_BLACK_HOT'
                ? 'bg-slate-700 text-white font-bold'
                : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-slate-400" />
            <span>IR B-Hot</span>
          </button>

          <button
            onClick={() => onSelectLayer('RF_HEATMAP')}
            className={`px-2.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              currentLayer === 'RF_HEATMAP'
                ? 'bg-emerald-600 text-white font-bold'
                : 'glass-panel-subtle text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>RF Heat</span>
          </button>
        </div>

        {/* Optical Zoom Toggle */}
        <button
          onClick={onToggleZoom}
          className="w-full py-1.5 rounded-lg glass-button text-xs font-mono text-emerald-300 flex items-center justify-center gap-2"
        >
          <span>OPTICAL MAGNIFICATION:</span>
          <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
            {zoomLevel}X
          </span>
        </button>
      </div>

      {/* RF Spectrum Live Detector Card */}
      <div className="glass-panel p-3 rounded-xl border border-emerald-500/30 flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="text-[11px] font-mono tracking-wider text-emerald-400 font-bold uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> RF Spectrum Analyzer
          </span>
          <span className="text-[10px] font-mono text-emerald-400">MONITORING</span>
        </div>

        {/* Live Spectrum Frequency Bars */}
        <div className="space-y-1.5 font-mono text-xs">
          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span>2.4 GHz (DJI / WiFi C2)</span>
              <span className="text-teal-400 font-bold">-48 dBm</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full w-[78%] animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span>5.8 GHz (Analog/FPV VTx)</span>
              <span className="text-amber-400 font-bold">-62 dBm</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full w-[54%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span>915 MHz (Swarm Mesh)</span>
              <span className="text-purple-400 font-bold">-34 dBm</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full w-[88%] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* HUD Aids & Target Calculation Controls */}
      <div className="glass-panel p-3 rounded-xl border border-teal-500/30 flex flex-col gap-2">
        <span className="text-[11px] font-mono tracking-wider text-teal-400 font-bold uppercase flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> HUD Reticle Assists
        </span>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-teal-400" /> Ballistic Lead Ring
          </span>
          <button
            onClick={onToggleLeadIndicator}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              showLeadIndicator ? 'bg-teal-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                showLeadIndicator ? 'left-5.5' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-400" /> Distance / Target Tags
          </span>
          <button
            onClick={onToggleDistanceTags}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              showDistanceTags ? 'bg-teal-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                showDistanceTags ? 'left-5.5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
