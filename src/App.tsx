import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Scenario, SessionResult } from './types/simulation';
import { fetchScenarios, fetchUserHistory, startTrainingSession } from './services/apiService';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { MissionSelect } from './components/MissionSelect';
import { MissionBriefing } from './components/MissionBriefing';
import { TrainingCanvas } from './components/TrainingCanvas';
import { MissionCompleteModal } from './components/MissionCompleteModal';
import { AfterActionReport } from './components/AfterActionReport';
import { HistoryView } from './components/HistoryView';
import { PerformanceView } from './components/PerformanceView';
import { SettingsView } from './components/SettingsView';

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Default to logged in with INF-2024-089
  const [currentTab, setCurrentTab] = useState<NavTab>('Dashboard');

  // User Profile
  const [user, setUser] = useState<{ id: string; callsign: string; rank: string }>({
    id: 'cadet-01',
    callsign: 'INF-2024-089',
    rank: 'Indus Army'
  });

  const [stats, setStats] = useState({
    total_missions: 24,
    victories: 20,
    total_neutralized: 84,
    accuracy_percent: 87,
    avg_score: 82
  });

  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  // Simulation Flow States
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [currentSessionResult, setCurrentSessionResult] = useState<SessionResult | null>(null);

  const [isBriefing, setIsBriefing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isMissionCompleteOpen, setIsMissionCompleteOpen] = useState<boolean>(false);
  const [isViewingAar, setIsViewingAar] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const scenList = await fetchScenarios();
      setScenarios(scenList);
      if (scenList.length > 0 && !selectedScenario) {
        setSelectedScenario(scenList[1] || scenList[0]); // Default to Urban Night
      }

      const history = await fetchUserHistory(user.id);
      if (history) {
        if (history.user) setUser(history.user);
        if (history.stats) setStats(history.stats);
        if (history.sessions) setRecentSessions(history.sessions);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const handleLogin = (callsign: string, rank: string) => {
    setUser((prev) => ({ ...prev, callsign, rank }));
    setIsLoggedIn(true);
    setCurrentTab('Dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsSimulating(false);
    setIsBriefing(false);
    setIsMissionCompleteOpen(false);
    setIsViewingAar(false);
  };

  // Flow Step 1: Start Training from Dashboard -> Go to Mission Selection
  const handleStartTrainingFromDashboard = () => {
    setCurrentTab('Training');
    setIsBriefing(false);
    setIsSimulating(false);
    setIsViewingAar(false);
    setIsMissionCompleteOpen(false);
  };

  // Flow Step 2: Select a scenario -> Go to Mission Briefing (Screen 4)
  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsBriefing(true);
  };

  // Flow Step 3: From Briefing -> Begin Training simulation (Screen 5)
  const handleBeginTrainingFromBriefing = async () => {
    setIsBriefing(false);
    const scen = selectedScenario || scenarios[0];
    try {
      const sessionId = await startTrainingSession(scen?.id || 'scen-1', user.id);
      setActiveSessionId(sessionId);
      setIsSimulating(true);
    } catch (err) {
      setActiveSessionId('ses-' + Date.now());
      setIsSimulating(true);
    }
  };

  // Flow Step 4: Finish Simulation -> Open Mission Complete (Screen 6)
  const handleFinishSimulation = (result: SessionResult) => {
    setCurrentSessionResult(result);
    setIsSimulating(false);
    setIsMissionCompleteOpen(true);
    loadData();
  };

  // Flow Step 5: Mission Complete -> View AAR (Screen 7)
  const handleViewAar = () => {
    setIsMissionCompleteOpen(false);
    setIsViewingAar(true);
  };

  // Return to Dashboard from AAR or simulation
  const handleReturnToDashboard = () => {
    setIsSimulating(false);
    setIsViewingAar(false);
    setIsMissionCompleteOpen(false);
    setIsBriefing(false);
    setCurrentTab('Dashboard');
  };

  const handleOpenHistoricalReplay = (session: any) => {
    try {
      const replayData = session.replay_data ? JSON.parse(session.replay_data) : null;
      const parsedResult: SessionResult = {
        sessionId: session.id,
        scenarioId: session.scenario_id,
        scenarioTitle: session.scenario_title || session.mission || 'Urban Night - Swarm Attack',
        durationSeconds: session.duration_seconds || 300,
        score: session.score || 82,
        grade: (session.grade as any) || 'A',
        neutralizedCount: session.neutralized_count || 4,
        totalDrones: session.total_drones || 5,
        shotsFired: session.shots_fired || 5,
        shotsHit: session.shots_hit || 4,
        accuracyPercent: session.shots_fired > 0 ? Math.round((session.shots_hit / session.shots_fired) * 100) : 85,
        jammingPulses: session.jamming_pulses || 3,
        jammingEfficiencyPercent: session.jamming_pulses > 0 ? 80 : 0,
        assetDamage: session.asset_damage || 12,
        averageReactionTimeMs: 15000,
        outcome: (session.outcome as any) || 'VICTORY',
        events: [],
        replayFrames: replayData?.replayFrames || []
      };
      setCurrentSessionResult(parsedResult);
      setIsViewingAar(true);
      setIsSimulating(false);
    } catch (e) {
      console.error('Failed to parse replay:', e);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsViewingAar(false);
    setIsBriefing(false);
    setIsMissionCompleteOpen(false);
    setIsSimulating(false);
  };

  return (
    <div className="w-screen h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-250 select-none">
      {/* PAGE 1: Login Screen */}
      {!isLoggedIn && (
        <LoginModal onLogin={handleLogin} />
      )}

      {/* Persistent Left Sidebar matching reference image */}
      {isLoggedIn && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          onOpenSettings={() => setCurrentTab('Settings')}
          onLogout={handleLogout}
          userCallsign={user.callsign}
        />
      )}

      {/* Main Content Area */}
      {isLoggedIn && (
        <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
          {/* Active 3D Training Simulation (Screen 5) */}
          {isSimulating && selectedScenario ? (
            <TrainingCanvas
              scenario={selectedScenario}
              sessionId={activeSessionId}
              onFinishSession={handleFinishSimulation}
              onAbortSession={handleReturnToDashboard}
              onOpenSettings={() => setCurrentTab('Settings')}
            />
          ) : isViewingAar && currentSessionResult ? (
            /* PAGE 7: After-Action Review */
            <AfterActionReport
              result={currentSessionResult}
              onReturnToDashboard={handleReturnToDashboard}
              onRetryScenario={() => {
                if (selectedScenario) {
                  setIsViewingAar(false);
                  setIsBriefing(true);
                } else {
                  handleTabChange('Training');
                }
              }}
            />
          ) : isBriefing && selectedScenario ? (
            /* PAGE 4: Mission Briefing */
            <MissionBriefing
              scenario={selectedScenario}
              onBack={() => setIsBriefing(false)}
              onBeginTraining={handleBeginTrainingFromBriefing}
            />
          ) : (
            /* Main Tab Views */
            <>
              {currentTab === 'Dashboard' && (
                <Dashboard
                  user={user}
                  stats={stats}
                  recentSessions={recentSessions}
                  onStartTraining={handleStartTrainingFromDashboard}
                  onOpenReplay={handleOpenHistoricalReplay}
                />
              )}

              {currentTab === 'Training' && (
                <MissionSelect
                  scenarios={scenarios}
                  onSelectScenario={handleSelectScenario}
                  onBackToDashboard={() => setCurrentTab('Dashboard')}
                />
              )}

              {currentTab === 'History' && (
                <HistoryView
                  sessions={recentSessions}
                  onOpenReplay={handleOpenHistoricalReplay}
                />
              )}

              {currentTab === 'Performance' && (
                <PerformanceView stats={stats} />
              )}

              {currentTab === 'Settings' && (
                <SettingsView unitId={user.callsign} />
              )}
            </>
          )}

          {/* PAGE 6: Mission Complete Modal */}
          <MissionCompleteModal
            isOpen={isMissionCompleteOpen}
            onViewAar={handleViewAar}
            onReturnToDashboard={handleReturnToDashboard}
            score={currentSessionResult?.score || 82}
          />
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
export default App;
