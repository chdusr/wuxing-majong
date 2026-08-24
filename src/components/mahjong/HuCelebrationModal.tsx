import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { HuResult, MahjongTileData, Player } from '../../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { Trophy, Sparkles, RefreshCw, ChevronRight, Award } from 'lucide-react';

interface HuCelebrationModalProps {
  isOpen: boolean;
  winner: Player;
  loser?: Player; // if claimed discard
  isSelfDraw: boolean;
  huResult: HuResult;
  allTiles: MahjongTileData[];
  onNextRound: () => void;
  onRestartGame: () => void;
}

export const HuCelebrationModal: React.FC<HuCelebrationModalProps> = ({
  isOpen,
  winner,
  loser,
  isSelfDraw,
  huResult,
  allTiles,
  onNextRound,
  onRestartGame,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#EF4444', '#38BDF8', '#D97AFF'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-[#241738] via-[#1A1228] to-[#120D1D] border-2 border-amber-500/50 rounded-3xl p-5 text-white shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Trophy & Badge */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center -mt-10 mb-2 border-2 border-white/40">
          <Trophy className="w-8 h-8 text-amber-950 stroke-[2.2]" />
        </div>

        {/* Winner Title */}
        <div className="text-center mb-3">
          <div className="text-xs text-amber-400 font-bold tracking-widest uppercase mb-0.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>五行麻将 · 胜利胡牌</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>{winner.name}</span>
            <span className="text-amber-400">大获全胜！</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSelfDraw ? '自摸胡牌' : `捉炮胡牌（${loser ? loser.name : '下家'}放铳）`}
          </p>
        </div>

        {/* Winning Hand Display */}
        <div className="w-full bg-[#130E1F]/90 border border-purple-500/30 rounded-2xl p-3 mb-4">
          <div className="text-[11px] text-purple-300 font-semibold mb-2 flex items-center justify-between">
            <span>胡牌牌型 (14张)：</span>
            <span className="text-amber-400 font-mono font-bold text-xs">{huResult.fans} 番</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
            {allTiles.map((tile, i) => (
              <MahjongTile key={tile.id || i} tile={tile} size="xs" />
            ))}
          </div>
        </div>

        {/* Fan score details card */}
        <div className="w-full bg-[#1F172E] border border-amber-500/20 rounded-2xl p-3.5 mb-5 space-y-2">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
              <Award className="w-4 h-4" />
              <span>{huResult.explanation}</span>
            </div>
            <div className="text-lg font-black text-amber-400 font-mono">
              +{huResult.fans * 100} 分
            </div>
          </div>

          <div className="space-y-1 pt-1">
            {huResult.fanDetails.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <span>{detail}</span>
                <span className="text-amber-400 font-semibold">✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <button
            type="button"
            onClick={onRestartGame}
            className="flex-1 py-3 rounded-2xl bg-[#2C213F] hover:bg-[#382B50] text-slate-300 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重置新局</span>
          </button>

          <button
            type="button"
            onClick={onNextRound}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 text-sm font-black transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 transform hover:scale-102 active:scale-98"
          >
            <span>再来一局</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
};
