import React from 'react';
import { MahjongTileData, AvailableClaim } from '../../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { Zap, Swords, Flame, Sparkles, X, ShieldCheck } from 'lucide-react';

export interface ClaimDialogData {
  targetTile: MahjongTileData;
  sourceIndex: number;
  claims: AvailableClaim[];
}

interface ClaimDialogProps {
  availableClaims?: AvailableClaim[];
  targetTile?: MahjongTileData;
  claimData?: ClaimDialogData;
  onConfirmClaim?: (claim: AvailableClaim) => void;
  onClaim?: (claim: AvailableClaim) => void;
  onPass: () => void;
  onOpenAudit?: () => void;
}

export const ClaimDialog: React.FC<ClaimDialogProps> = ({
  availableClaims,
  targetTile,
  claimData,
  onConfirmClaim,
  onClaim,
  onPass,
  onOpenAudit,
}) => {
  const claims = availableClaims || claimData?.claims || [];
  const currentTargetTile = targetTile || claimData?.targetTile;

  if (!claims || claims.length === 0 || !currentTargetTile) return null;

  const handleAction = (claim: AvailableClaim) => {
    if (onConfirmClaim) {
      onConfirmClaim(claim);
    } else if (onClaim) {
      onClaim(claim);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-6 duration-200 pointer-events-auto">
      <div className="bg-[#1C162E]/95 backdrop-blur-xl border border-purple-500/40 rounded-3xl p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(168,85,247,0.35)] flex flex-col items-center gap-3 max-w-lg w-full">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              对手打出：
            </span>
            <div className="inline-block transform scale-90 -my-1">
              <MahjongTile tile={currentTargetTile} size="xs" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAudit && (
              <button
                type="button"
                onClick={onOpenAudit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] font-bold transition-colors"
                title="打开胡牌审核台"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>申报胡牌审核</span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">请选择操作</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
          {claims.map((claim, idx) => {
            const isHu = claim.type === 'hu';
            const isClashPung = claim.type === 'clash_pung';
            const isPung = claim.type === 'pung';
            const isKong = claim.type === 'kong';
            const isEat = claim.type === 'eat';

            let btnBg = 'bg-slate-800 text-slate-200 border-slate-600';
            let icon = null;

            if (isHu) {
              btnBg = 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/50 animate-pulse';
              icon = <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />;
            } else if (isClashPung) {
              btnBg = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-900/50 ring-1 ring-amber-300';
              icon = <Swords className="w-4 h-4 text-amber-300" />;
            } else if (isPung) {
              btnBg = 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-amber-950 border-amber-300 shadow-lg shadow-amber-900/50 font-black';
              icon = <Zap className="w-4 h-4 text-amber-950 fill-current" />;
            } else if (isKong) {
              btnBg = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40';
            } else if (isEat) {
              btnBg = 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAction(claim)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-sm transition-all transform hover:scale-105 active:scale-95 ${btnBg}`}
              >
                {icon}
                <span>{claim.label}</span>
                {claim.tiles && claim.tiles.length > 0 && (
                  <div className="flex items-center gap-1 ml-1 bg-black/30 px-1.5 py-0.5 rounded-lg">
                    {claim.tiles.map((t, ti) => (
                      <span key={ti} className="text-xs text-amber-200 font-serif font-bold">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                {isClashPung && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    优先
                  </span>
                )}
                {isPung && (
                  <span className="text-[10px] bg-black/30 text-amber-950 px-1.5 py-0.2 rounded font-black">
                    碰
                  </span>
                )}
              </button>
            );
          })}

          {/* Pass Button */}
          <button
            type="button"
            onClick={onPass}
            className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-[#2A2438] hover:bg-[#38304D] border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>过</span>
          </button>
        </div>

      </div>
    </div>
  );
};
