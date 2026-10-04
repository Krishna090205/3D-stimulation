import React from 'react';
import { DroneEntity } from '../types/simulation';
import { Radar, Compass, AlertTriangle } from 'lucide-react';

interface TacticalRadarProps {
  drones: DroneEntity[];
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  maxRange?: number;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  drones,
  playerPos,
  playerYaw,
  maxRange = 320
}) => {
  const radarRadius = 88; // pixels radius for radar scope
  const activeDrones = drones.filter((d) => d.state !== 'DESTROYED');

  // Find closest threat
  let closestDist = Infinity;
  let closestDrone: DroneEntity | null = null;
  drones.forEach((d) => {
    if (d.state === 'ACTIVE' || d.state === 'EVADING') {
      const dist = Math.sqrt((d.position.x - playerPos.x) ** 2 + (d.position.z - playerPos.z) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestDrone = d;
      }
    }
  });

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 select-none pointer-events-auto">
      {/* Radar Scope Container */}
      <div className="relative w-48 h-48 rounded-full glass-panel border border-teal-500/40 p-2 flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Background Grid & Range Rings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-100 -100 200 200">
          {/* Outer circle */}
          <circle cx="0" cy="0" r="95" fill="rgba(10, 25, 47, 0.75)" stroke="rgba(45, 212, 191, 0.4)" strokeWidth="1.5" />
          
          {/* Range rings (75m, 150m, 225m, 300m) */}
          <circle cx="0" cy="0" r="72" fill="none" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Crosshairs */}
          <line x1="-95" y1="0" x2="95" y2="0" stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />
          <line x1="0" y1="-95" x2="0" y2="95" stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />

          {/* Cardinal direction labels */}
          <text x="0" y="-82" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">N</text>
          <text x="82" y="3" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">E</text>
          <text x="0" y="88" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">S</text>
          <text x="-82" y="3" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">W</text>

          {/* Player base center point */}
          <circle cx="0" cy="0" r="3.5" fill="#2dd4bf" />
        </svg>

        {/* Radar Sweeping Beam Animation */}
        <div className="absolute inset-0 pointer-events-none radar-sweep-beam flex items-center justify-center">
          <div
            className="w-full h-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(45, 212, 191, 0.35) 0deg, rgba(45, 212, 191, 0) 65deg, transparent 65deg)'
            }}
          />
        </div>

        {/* Drone Threat Blips */}
        <div className="absolute inset-0 pointer-events-none">
          {activeDrones.map((drone) => {
            const dx = drone.position.x - playerPos.x;
            const dz = drone.position.z - playerPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Normalized to radar radius
            const normalizedDist = Math.min(dist / maxRange, 1.0) * (radarRadius - 10);
            const angle = Math.atan2(dx, -dz); // 0 is North (-Z)

            const blipX = 96 + Math.sin(angle) * normalizedDist;
            const blipY = 96 - Math.cos(angle) * normalizedDist;

            const isJammed = drone.state === 'JAMMED';
            const isEvading = drone.state === 'EVADING';
            const isEntangled = drone.state === 'NET_ENTANGLED';

            let blipColor = '#ef4444'; // Red threat
            if (isJammed) blipColor = '#f59e0b'; // Amber jammed
            if (isEntangled) blipColor = '#a855f7'; // Purple captured
            if (isEvading) blipColor = '#ec4899'; // Pink evading

            return (
              <div
                key={drone.id}
                className="absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full transition-all duration-100 flex items-center justify-center"
                style={{
                  left: `${blipX}px`,
                  top: `${blipY}px`,
                  backgroundColor: blipColor
                }}
              >
                {/* Altitude label for close threats */}
                {dist < 180 && (
                  <span className="absolute -top-3.5 text-[8px] font-mono text-emerald-300 font-bold whitespace-nowrap bg-black/70 px-0.5 rounded">
                    {Math.round(drone.position.y)}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tactical Telemetry Badge below Radar */}
      <div className="glass-panel px-3 py-1.5 rounded-lg border border-teal-500/30 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <Radar className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="text-slate-300">C-UAS RADAR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-teal-400 font-bold">{activeDrones.length} TRK</span>
          {closestDrone && (
            <span className="text-amber-400 flex items-center gap-0.5 font-bold">
              <AlertTriangle className="w-3 h-3" />
              {Math.round(closestDist)}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
