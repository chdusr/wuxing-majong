import React from 'react';
import { Gamepad2, Users, BookOpen, Sparkles, Trophy } from 'lucide-react';

export type MainTabType = 'game' | 'multiplayer' | 'rules' | 'builder' | 'quiz';

interface IosTabBarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs: Array<{
    id: MainTabType;
    label: string;
    icon: React.FC<{ className?: string }>;
    hasBadge?: boolean;
  }> = [
    { id: 'game', label: '单机练习', icon: Gamepad2 },
    { id: 'multiplayer', label: '联网对战', icon: Users, hasBadge: true },
    { id: 'rules', label: '五行图谱', icon: BookOpen },
    { id: 'builder', label: '排盘算番', icon: Sparkles },
    { id: 'quiz', label: '规则闯关', icon: Trophy },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#120D1D]/90 backdrop-blur-2xl border-t border-purple-500/20 pb-safe pt-2 px-3 sm:px-6">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-150 relative ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.hasBadge && !isActive && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#120D1D]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

