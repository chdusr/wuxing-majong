import React, { useState } from 'react';
import { Wifi, Battery, Signal, Sparkles, HelpCircle, Users } from 'lucide-react';
import { GameBoard } from './components/mahjong/GameBoard';
import { MultiplayerView } from './components/mahjong/MultiplayerView';
import { RulebookView } from './components/mahjong/RulebookView';
import { HandBuilder } from './components/mahjong/HandBuilder';
import { QuizChallenge } from './components/mahjong/QuizChallenge';
import { IosTabBar, MainTabType } from './components/mahjong/IosTabBar';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('game');
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // Update time for iOS status bar
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0A17] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* iOS Top Status Bar & Dynamic Island */}
      <header className="sticky top-0 z-40 bg-[#0E0A17]/85 backdrop-blur-xl border-b border-purple-500/10 px-4 pt-1.5 pb-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* iOS Clock */}
          <span className="text-xs font-semibold text-slate-300 font-mono tracking-tight">
            {currentTime}
          </span>

          {/* iOS Dynamic Island Pill */}
          <div className="h-4 px-3 rounded-full bg-black border border-purple-500/30 flex items-center gap-1.5 shadow-sm cursor-pointer"
            onClick={() => setActiveTab(activeTab === 'multiplayer' ? 'game' : 'multiplayer')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-amber-300 font-bold tracking-wider">
              {activeTab === 'multiplayer' ? '五行麻将 · 全服联机' : '五行麻将 · 108张'}
            </span>
          </div>

          {/* iOS Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>

        </div>
      </header>

      {/* Main Content View Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto pb-24 pt-1">
        {activeTab === 'game' && (
          <GameBoard
            onOpenRules={() => setActiveTab('rules')}
            onOpenHandBuilder={() => setActiveTab('builder')}
            onOpenMultiplayer={() => setActiveTab('multiplayer')}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiplayerView
            onBackToSinglePlayer={() => setActiveTab('game')}
            onOpenRules={() => setActiveTab('rules')}
          />
        )}

        {activeTab === 'rules' && <RulebookView />}

        {activeTab === 'builder' && <HandBuilder />}

        {activeTab === 'quiz' && <QuizChallenge />}
      </main>

      {/* iOS Bottom Navigation Bar */}
      <IosTabBar activeTab={activeTab} onChangeTab={setActiveTab} />

    </div>
  );
}

