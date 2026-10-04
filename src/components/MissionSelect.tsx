import React, { useState } from 'react';
import { Scenario } from '../types/simulation';
import { Star, User, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MissionSelectProps {
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  onBackToDashboard?: () => void;
  userCallsign?: string;
}

export const MissionSelect: React.FC<MissionSelectProps> = ({
  scenarios,
  onSelectScenario,
  userCallsign = 'INF-2024-089'
}) => {
  const { isDark } = useTheme();
  const [selectedId, setSelectedId] = useState<string>('scen-2'); // Default to Urban Night matching reference

  // Fixed 5 Scenarios matching reference Screen 3 exactly
  const missionCards = [
    {
      id: 'scen-1',
      title: 'Urban Day',
      desc: 'Detect drones in urban environment',
      stars: 4,
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'scen-2',
      title: 'Urban Night',
      desc: 'Low visibility night operations',
      stars: 5,
      image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'scen-3',
      title: 'Rural Area',
      desc: 'Open terrain detection',
      stars: 3,
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'scen-4',
      title: 'Swarm Attack',
      desc: 'Multiple drones simultaneous',
      stars: 5,
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'scen-5',
      title: 'VIP Protection',
      desc: 'Defend high-value target area',
      stars: 4,
      image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleCardClick = (cardId: string) => {
    setSelectedId(cardId);
    const scen = scenarios.find((s) => s.id === cardId) || scenarios[0];
    if (scen) onSelectScenario(scen);
  };

  const handleProceed = () => {
    const scen = scenarios.find((s) => s.id === selectedId) || scenarios[0];
    if (scen) onSelectScenario(scen);
  };

  return (
    <div className="w-full h-full flex flex-col p-8 bg-slate-50/50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 overflow-y-auto select-none">
      {/* Top Header matching reference Screen 3 */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Select Training Mission
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Choose a scenario to improve your detection and response skills
          </p>
        </div>

        {/* Top-Right User Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Grid: Row 1 (3 cards) & Row 2 (2 cards) matching reference image */}
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Row 1: 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missionCards.slice(0, 3).map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`bg-white dark:bg-[#0c1524] rounded-2xl overflow-hidden cursor-pointer transition-all border-2 flex flex-col justify-between group shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Photo Preview */}
                <div className="h-40 w-full overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans line-clamp-1">
                    {card.desc}
                  </p>

                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mt-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= card.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missionCards.slice(3, 5).map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`bg-white dark:bg-[#0c1524] rounded-2xl overflow-hidden cursor-pointer transition-all border-2 flex flex-col justify-between group shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Photo Preview */}
                <div className="h-40 w-full overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans line-clamp-1">
                    {card.desc}
                  </p>

                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mt-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= card.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Start Button Card */}
          <div className="flex flex-col justify-end p-2">
            <button
              onClick={handleProceed}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow transition-all"
            >
              <span>Start Training</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
