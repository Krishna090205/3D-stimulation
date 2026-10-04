import React, { useState, useEffect, useRef } from 'react';
import { SessionResult } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  History
} from 'lucide-react';
import { PerformanceView } from './PerformanceView';

interface AfterActionReportProps {
  result: SessionResult;
  onReturnToDashboard: () => void;
  onRetryScenario: () => void;
}

export type AarSubTab = 'Overview' | 'Performance' | 'Key Events';

export const AfterActionReport: React.FC<AfterActionReportProps> = ({
  result,
  onReturnToDashboard
}) => {
  const { isDark } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<AarSubTab>('Overview');

  // Media Replay State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [progressSec, setProgressSec] = useState<number>(28); // 00:28 matching screenshot
  const totalSec = 300; // 05:00

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgressSec((prev) => {
        if (prev >= totalSec) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Setup 3D City aerial replay
  useEffect(() => {
    if (activeSubTab !== 'Overview') return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x050b14 : 0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    camera.position.set(0, 75, 95);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight.position.set(40, 80, 40);
    scene.add(dirLight);

    // City buildings
    const cityGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7
    });

    for (let x = -70; x <= 70; x += 22) {
      for (let z = -70; z <= 70; z += 22) {
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
        const h = 10 + Math.random() * 25;
        const b = new THREE.Mesh(new THREE.BoxGeometry(14, h, 14), buildingMat);
        b.position.set(x, h / 2, z);
        cityGroup.add(b);
      }
    }
    scene.add(cityGroup);

    // Drone flight trajectories (Red Glowing curves)
    const curvePoints = [
      new THREE.Vector3(-55, 24, -55),
      new THREE.Vector3(-25, 22, -15),
      new THREE.Vector3(0, 18, 5),
      new THREE.Vector3(30, 25, 25),
      new THREE.Vector3(50, 27, 45)
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    // Engagement hit marker (Emerald star / sphere)
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    hitSphere.position.set(0, 18, 5);
    scene.add(hitSphere);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      cityGroup.rotation.y += 0.0006;
      line.rotation.y += 0.0006;
      hitSphere.rotation.y += 0.0006;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeSubTab, isDark]);

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col p-6 sm:p-8 bg-slate-50/50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 7 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnToDashboard}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {result.scenarioTitle || 'Urban Night - Swarm Attack'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              5 min session
            </p>
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Operator"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Body: Subnav + Content */}
      <div className="flex-1 flex gap-6 pt-5 overflow-hidden">
        {/* Left Sub-navigation matching Screen 7 */}
        <div className="w-36 flex flex-col gap-1.5 shrink-0 text-xs font-sans">
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveSubTab('Overview')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeSubTab === 'Overview'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('Performance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeSubTab === 'Performance'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Performance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('Key Events')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activeSubTab === 'Key Events'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Key Events</span>
          </button>
        </div>

        {/* Center/Right Panel matching Screen 7 */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
          {activeSubTab === 'Overview' && (
            <>
              {/* 3D Replay Video Viewport */}
              <div className="w-full h-80 rounded-2xl bg-[#050b14] border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col shadow-sm">
                <canvas ref={canvasRef} className="w-full flex-1 block" />

                {/* Top-Right Mission Telemetry Status pill matching reference */}
                <div className="absolute top-4 right-4 z-10 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex flex-col gap-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-4 text-rose-400 font-bold">
                    <span>Detected</span>
                    <span>3</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                    <span>Engaged</span>
                    <span>1</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-amber-400 font-bold">
                    <span>Remaining</span>
                    <span>2</span>
                  </div>
                </div>

                {/* Bottom Media Controls Bar */}
                <div className="h-12 px-4 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-4 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setProgressSec(0)}
                      className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                      title="Rewind"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Scrubber Line */}
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max={totalSec}
                      value={progressSec}
                      onChange={(e) => setProgressSec(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    />
                    <span className="font-mono text-[11px] text-slate-300 font-bold shrink-0">
                      {formatMinSec(progressSec)} / {formatMinSec(totalSec)}
                    </span>
                  </div>

                  {/* Speed Toggle */}
                  <button
                    onClick={() => {
                      const speeds = [0.5, 1, 2];
                      const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                      setPlaybackSpeed(next);
                    }}
                    className="px-2 py-0.5 rounded border border-white/10 text-[11px] font-mono text-slate-300 hover:bg-white/10 cursor-pointer"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              </div>

              {/* Below Video: 4 Metrics + Recommendations matching Screen 7 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 4 Score Pills in a 4-col row */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Performance Summary
                  </span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {/* Score */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
                      <div className="flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-base">
                        <span>82</span>
                        <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">Score</span>
                    </div>

                    {/* Detection */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
                      <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-base">
                        <span>90%</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">Detection</span>
                    </div>

                    {/* Classification */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
                      <span className="text-slate-900 dark:text-white font-bold font-mono text-base">85%</span>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">Classification</span>
                    </div>

                    {/* Engagement */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
                      <span className="text-slate-900 dark:text-white font-bold font-mono text-base">75%</span>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">Engagement</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations List matching Screen 7 */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Recommendations
                  </span>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Improve rear sector scanning</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Reduce classification time</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Practice swarm scenarios</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'Performance' && (
            <div className="flex-1">
              <PerformanceView />
            </div>
          )}

          {activeSubTab === 'Key Events' && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1524] border border-slate-200 dark:border-slate-800 flex flex-col gap-3 font-mono text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                Chronological Mission Events
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { time: '00:15', label: 'RF Spike Detected', desc: '2.4GHz control signal acquisition' },
                  { time: '00:28', label: 'Visual Identification', desc: 'DJI Mavic classified at 120m altitude' },
                  { time: '00:45', label: 'Engagement Activated', desc: 'RF Jammer severed target telemetry' },
                  { time: '01:10', label: 'Swarm Incursion', desc: '2x high-speed FPV drones breached outer perimeter' },
                  { time: '01:30', label: 'Kinetic Neutralization', desc: 'Shotgun tungsten buckshot hit on FPV unit #1' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold">[{item.time}]</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{item.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
