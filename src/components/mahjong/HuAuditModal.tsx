import React, { useState, useEffect, useMemo } from 'react';
import { MahjongTileData, Meld, MeldType } from '../../types/mahjong';
import {
  auditHuHand,
  auditManualDecomposition,
  HuAuditReport,
  checkThreeTilesKan,
  CANONICAL_KANS,
} from '../../utils/mahjongRules';
import { MahjongTile } from './MahjongTile';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Award,
  Layers,
  Wrench,
  BookOpen,
  X,
  RotateCcw,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface HuAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  hand: MahjongTileData[];
  melds: Meld[];
  claimDiscardTile?: MahjongTileData | null;
  claimDiscarderIndex?: number;
  isTianHu?: boolean;
  isGangShangKaiHua?: boolean;
  onConfirmHu: (report: HuAuditReport, isSelfDraw: boolean, discardTile?: MahjongTileData) => void;
}

export const HuAuditModal: React.FC<HuAuditModalProps> = ({
  isOpen,
  onClose,
  hand,
  melds,
  claimDiscardTile,
  claimDiscarderIndex,
  isTianHu = false,
  isGangShangKaiHua = false,
  onConfirmHu,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'rules'>('auto');

  // Full candidate tiles (hand + claimed discard tile if any)
  const fullHand = useMemo(() => {
    if (claimDiscardTile) {
      return [...hand, claimDiscardTile];
    }
    return hand;
  }, [hand, claimDiscardTile]);

  const isSelfDraw = !claimDiscardTile;

  // Auto Audit Report
  const autoReport = useMemo(() => {
    return auditHuHand(fullHand, melds, isTianHu, isGangShangKaiHua);
  }, [fullHand, melds, isTianHu, isGangShangKaiHua]);

  // Manual Studio State
  const neededKans = 4 - melds.length;
  const [kanSlots, setKanSlots] = useState<MahjongTileData[][]>([[], [], [], []]);
  const [pairSlot, setPairSlot] = useState<MahjongTileData[]>([]);
  const [activeSlotTarget, setActiveSlotTarget] = useState<number | 'pair'>(0);

  // Initialize manual slots
  useEffect(() => {
    if (isOpen) {
      // If auto report solved it, pre-populate manual slots for convenience!
      if (autoReport.isHu && autoReport.kans && autoReport.pair) {
        const internalKans = autoReport.kans
          .slice(melds.length)
          .map(k => k.tiles);
        const initialSlots: MahjongTileData[][] = [[], [], [], []];
        internalKans.forEach((k, idx) => {
          if (idx < 4) initialSlots[idx] = k;
        });
        setKanSlots(initialSlots);
        setPairSlot(autoReport.pair);
      } else {
        setKanSlots([[], [], [], []]);
        setPairSlot([]);
      }
      setActiveSlotTarget(0);
    }
  }, [isOpen, autoReport]);

  // Assigned tile IDs in manual mode
  const assignedTileIds = useMemo(() => {
    const ids = new Set<string>();
    kanSlots.forEach(s => s.forEach(t => ids.add(t.id)));
    pairSlot.forEach(t => ids.add(t.id));
    return ids;
  }, [kanSlots, pairSlot]);

  // Unassigned pool
  const unassignedTiles = useMemo(() => {
    return fullHand.filter(t => !assignedTileIds.has(t.id));
  }, [fullHand, assignedTileIds]);

  // Manual Audit Report
  const manualReport = useMemo(() => {
    return auditManualDecomposition(kanSlots, pairSlot, melds, isTianHu, isGangShangKaiHua);
  }, [kanSlots, pairSlot, melds, isTianHu, isGangShangKaiHua]);

  // Handle tile click in manual pool
  const handleAddTileToSlot = (tile: MahjongTileData) => {
    if (activeSlotTarget === 'pair') {
      if (pairSlot.length < 2) {
        setPairSlot(prev => [...prev, tile]);
      }
    } else {
      const slotIdx = activeSlotTarget;
      if (slotIdx < neededKans && kanSlots[slotIdx].length < 3) {
        setKanSlots(prev => {
          const next = [...prev];
          next[slotIdx] = [...next[slotIdx], tile];
          return next;
        });
      }
    }
  };

  // Handle remove tile from slot
  const handleRemoveTileFromKan = (slotIdx: number, tileIdx: number) => {
    setKanSlots(prev => {
      const next = [...prev];
      next[slotIdx] = next[slotIdx].filter((_, i) => i !== tileIdx);
      return next;
    });
  };

  const handleRemoveTileFromPair = (tileIdx: number) => {
    setPairSlot(prev => prev.filter((_, i) => i !== tileIdx));
  };

  // Auto-solve and populate
  const handleAutoPopulate = () => {
    if (autoReport.isHu && autoReport.kans && autoReport.pair) {
      const internalKans = autoReport.kans.slice(melds.length).map(k => k.tiles);
      const newSlots: MahjongTileData[][] = [[], [], [], []];
      internalKans.forEach((k, idx) => {
        if (idx < 4) newSlots[idx] = k;
      });
      setKanSlots(newSlots);
      setPairSlot(autoReport.pair);
    }
  };

  const handleResetManual = () => {
    setKanSlots([[], [], [], []]);
    setPairSlot([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#1C142B] via-[#140D20] to-[#0D0817] border-2 border-amber-500/50 rounded-3xl text-white shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-purple-500/30 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-amber-300">五行胡牌申报与审核台</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isSelfDraw
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {isSelfDraw ? '自摸摸牌申报 (14张)' : `捉炮申报 (+放铳【${claimDiscardTile?.name}】)`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                支持系统极速智能审核与玩家自主排盘自证，杜绝炸胡，透明算番
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-purple-500/20 bg-black/20 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
              activeTab === 'auto'
                ? 'bg-[#2A1D40] text-amber-300 border-amber-500/40 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>极速智能审核</span>
            {autoReport.isHu && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
              activeTab === 'manual'
                ? 'bg-[#2A1D40] text-amber-300 border-amber-500/40 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>手动排盘自证</span>
            {manualReport.isHu && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-t-xl transition-all flex items-center gap-1.5 border-t border-x ${
              activeTab === 'rules'
                ? 'bg-[#2A1D40] text-amber-300 border-amber-500/40 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>做砍与番型规则速查</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: Auto Audit */}
          {activeTab === 'auto' && (
            <div className="space-y-4">
              
              {/* Hand Overview */}
              <div className="bg-[#120B1D]/80 border border-purple-500/30 rounded-2xl p-3.5">
                <div className="text-xs text-purple-300 font-bold mb-2 flex items-center justify-between">
                  <span>申报手牌总览 ({fullHand.length + melds.length * 3}/14张)：</span>
                  <span className="text-slate-400 text-[11px]">手牌 {fullHand.length} 张 + 副露 {melds.length} 组</span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                  {fullHand.map((tile, i) => (
                    <div key={tile.id || i} className="relative">
                      <MahjongTile tile={tile} size="sm" />
                      {claimDiscardTile && tile.id === claimDiscardTile.id && (
                        <span className="absolute -top-2 -right-1 px-1 bg-red-600 text-[9px] font-bold text-white rounded-full">
                          放铳
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {melds.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-amber-400 font-bold">已亮副露：</span>
                    {melds.map((m, mi) => (
                      <div key={mi} className="flex items-center gap-0.5 bg-purple-950/60 p-1 rounded-lg border border-purple-500/30">
                        <span className="text-[9px] text-amber-300 font-bold mr-1">{m.typeLabel}</span>
                        {m.tiles.map((t, ti) => (
                          <MahjongTile key={ti} tile={t} size="xs" />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Verdict Banner */}
              {autoReport.isHu ? (
                <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-2 border-emerald-400/60 rounded-2xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-emerald-500 text-emerald-950 shadow-lg">
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-xs text-emerald-300 font-bold tracking-wider uppercase">
                          AUDIT VERDICT · 审核结论
                        </div>
                        <h4 className="text-lg font-black text-emerald-200 flex items-center gap-2">
                          <span>合规胡牌！通过审核</span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950 text-xs font-black">
                            {autoReport.fans} 番 ({autoReport.fans * 100}分)
                          </span>
                        </h4>
                        <p className="text-xs text-emerald-300/80 mt-0.5">
                          {autoReport.explanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Decomposition Breakdown */}
                  <div className="mt-3.5 pt-3 border-t border-emerald-500/30 space-y-2">
                    <div className="text-xs font-bold text-emerald-300">胡牌结构拆解明细：</div>
                    
                    {autoReport.isSevenPairs ? (
                      <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-200">
                        【七巧对】：7对对子完美齐整，直接成胡！
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {autoReport.kans?.map((k, ki) => (
                          <div key={ki} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-emerald-500/30 text-xs">
                            <span className="text-amber-300 font-bold">砍{ki + 1}：【{k.typeLabel}】</span>
                            <div className="flex items-center gap-1">
                              {k.tiles.map((t, ti) => (
                                <span key={ti} className="px-1.5 py-0.5 rounded bg-purple-900/80 text-white font-bold text-[11px]">
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {autoReport.pair && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-emerald-500/30 text-xs col-span-1 sm:col-span-2">
                            <span className="text-amber-300 font-bold">雀头将牌：【同字对子】</span>
                            <div className="flex items-center gap-1">
                              {autoReport.pair.map((t, ti) => (
                                <span key={ti} className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-xs">
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fan Details List */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1 mt-2">
                      <div className="text-[11px] text-amber-300 font-bold">番数明细：</div>
                      {autoReport.fanDetails.map((f, fi) => (
                        <div key={fi} className="text-xs text-slate-300 flex items-center justify-between">
                          <span>{f}</span>
                          <span className="text-emerald-400 font-bold">✓</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-950/50 via-[#221735] to-amber-950/50 border border-amber-500/40 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs text-amber-400 font-bold tracking-wider uppercase">
                        AUDIT VERDICT · 审核诊断
                      </div>
                      <h4 className="text-base font-bold text-white">
                        尚未满足五行胡牌标准 (防炸胡保护中)
                      </h4>
                      <div className="text-xs text-slate-300 space-y-1 pt-1">
                        <p>• {autoReport.diagnostics.tileCountMsg}</p>
                        <p>• {autoReport.diagnostics.pairMsg}</p>
                        <p>• {autoReport.diagnostics.kansMsg}</p>
                        <p className="text-amber-300/90 font-medium pt-1">
                          💡 建议：{autoReport.diagnostics.advice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Manual Decomposition Studio */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-2xl border border-white/10">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-amber-400">手动自证：</span>
                  <span>点击槽位选中，再点击下方待分配牌装入，实时检验 4 砍与 1 将</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoPopulate}
                    className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>智能摆入</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetManual}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置</span>
                  </button>
                </div>
              </div>

              {/* 4 Kan Slots + 1 Pair Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: neededKans }).map((_, idx) => {
                  const slot = kanSlots[idx] || [];
                  const isActive = activeSlotTarget === idx;
                  const kanCheck = slot.length === 3 ? checkThreeTilesKan(slot.map(t => t.name)) : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotTarget(idx)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-amber-400 bg-[#261B3B] shadow-md'
                          : 'border-purple-500/30 bg-[#150D24] hover:border-purple-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-300">
                          砍槽 {idx + 1} ({slot.length}/3)
                        </span>

                        {slot.length === 3 && (
                          kanCheck?.isValid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              ✓ {kanCheck.typeLabel}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                              ✕ 未成有效砍
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 min-h-[50px] p-1.5 rounded-xl bg-black/40 border border-white/5">
                        {slot.map((tile, tIdx) => (
                          <div
                            key={tIdx}
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveTileFromKan(idx, tIdx);
                            }}
                            className="cursor-pointer hover:opacity-75 transition-opacity"
                            title="点击收回"
                          >
                            <MahjongTile tile={tile} size="xs" />
                          </div>
                        ))}
                        {slot.length < 3 && (
                          <span className="text-[11px] text-slate-500 italic">
                            需放入 {3 - slot.length} 张牌
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pair Slot (雀头将牌) */}
                <div
                  onClick={() => setActiveSlotTarget('pair')}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeSlotTarget === 'pair'
                      ? 'border-amber-400 bg-[#261B3B] shadow-md'
                      : 'border-purple-500/30 bg-[#150D24] hover:border-purple-500/60'
                  } col-span-1 sm:col-span-2`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300">
                      雀头将牌槽 (对子 {pairSlot.length}/2)
                    </span>

                    {pairSlot.length === 2 && (
                      pairSlot[0].name === pairSlot[1].name ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          ✓ 对子合规
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                          ✕ 不同字，无法作将
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 min-h-[50px] p-1.5 rounded-xl bg-black/40 border border-white/5">
                    {pairSlot.map((tile, tIdx) => (
                      <div
                        key={tIdx}
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveTileFromPair(tIdx);
                        }}
                        className="cursor-pointer hover:opacity-75 transition-opacity"
                        title="点击收回"
                      >
                        <MahjongTile tile={tile} size="xs" />
                      </div>
                    ))}
                    {pairSlot.length < 2 && (
                      <span className="text-[11px] text-slate-500 italic">
                        需放入 2 张相同字牌作为雀头
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Unassigned Pool */}
              <div className="bg-[#120B1D] border border-purple-500/30 rounded-2xl p-3">
                <div className="text-xs font-bold text-purple-300 mb-2 flex items-center justify-between">
                  <span>待分配手牌池 (点击放入当前选中的槽位)：</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    剩余 {unassignedTiles.length} 张
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[48px]">
                  {unassignedTiles.length > 0 ? (
                    unassignedTiles.map(tile => (
                      <div
                        key={tile.id}
                        onClick={() => handleAddTileToSlot(tile)}
                        className="cursor-pointer transform hover:-translate-y-1 transition-all"
                      >
                        <MahjongTile tile={tile} size="xs" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">
                      ✓ 所有手牌已分配至各个槽位！
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Verdict Banner */}
              {manualReport.isHu ? (
                <div className="bg-emerald-950/70 border border-emerald-500/60 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h5 className="text-sm font-black text-emerald-300">自证审核通过！</h5>
                      <p className="text-xs text-slate-300">{manualReport.explanation} ({manualReport.fans}番)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{manualReport.diagnostics.advice}</span>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Rules & Patterns Quick Reference */}
          {activeTab === 'rules' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="bg-[#150D24] p-3.5 rounded-2xl border border-purple-500/30 space-y-2">
                <h5 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>五行麻将 · 做砍 10 大合规组合</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">1. 五行相生 (5组)：</span>
                    <p className="text-slate-300 mt-0.5">金水木、水木火、木火土、火土金、土金水</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">2. 天干五合 (5组)：</span>
                    <p className="text-slate-300 mt-0.5">甲己土、乙庚金、丙辛水、丁壬木、戊癸火</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">3. 地支六合 (6组)：</span>
                    <p className="text-slate-300 mt-0.5">巳申水、卯戌火、寅亥木、午未土、辰酉金、子丑土</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">4. 地支三合 (4组)：</span>
                    <p className="text-slate-300 mt-0.5">寅午戌、亥卯未、申子辰、巳酉丑</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">5. 地支三会 (4组)：</span>
                    <p className="text-slate-300 mt-0.5">巳午未、申酉戌、亥子丑、寅卯辰</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">6. 地支三刑 (2组)：</span>
                    <p className="text-slate-300 mt-0.5">寅巳申、丑未戌</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">7. 冲战砍 (同字2+冲对1)：</span>
                    <p className="text-slate-300 mt-0.5">子子午、庚庚甲、水水火、金金木、卯卯酉等</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-amber-400 font-bold">8. 三同刻 / 杠牌：</span>
                    <p className="text-slate-300 mt-0.5">任意3张或4张相同牌 (如甲甲甲、子子子)</p>
                  </div>
                </div>
              </div>

              {/* Fan Multipliers */}
              <div className="bg-[#150D24] p-3.5 rounded-2xl border border-purple-500/30 space-y-2">
                <h5 className="font-bold text-amber-300 text-sm">番数倍率表</h5>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-200">一番：啥都有 小P胡 (常规4砍+1将)</span>
                    <span className="text-amber-400 font-bold">100分</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-200">二番：全部冲战 (4组均为冲对砍)</span>
                    <span className="text-amber-400 font-bold">200分</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-200">三番：全碰 / 纯水火 / 纯金木冲战 / 荟局</span>
                    <span className="text-amber-400 font-bold">300分</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-200">四番：纯三合 / 纯三会 / 纯三刑</span>
                    <span className="text-amber-400 font-bold">400分</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-200">五番：七巧对 (7对子)</span>
                    <span className="text-amber-400 font-bold">500分</span>
                  </div>
                  <div className="flex justify-between pt-0.5 text-emerald-300 font-bold">
                    <span>加番项：天胡 (+5番)、杠上开花 (+1番)</span>
                    <span>额外累加</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-purple-500/30 bg-black/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all"
          >
            返回牌局
          </button>

          {/* Confirm Hu Button if passed either Auto or Manual */}
          {(autoReport.isHu || manualReport.isHu) ? (
            <button
              type="button"
              onClick={() => {
                const reportToUse = activeTab === 'manual' && manualReport.isHu ? manualReport : autoReport;
                onConfirmHu(reportToUse, isSelfDraw, claimDiscardTile || undefined);
              }}
              className="flex-1 max-w-xs py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-amber-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/40 transition-all flex items-center justify-center gap-1.5 animate-pulse"
            >
              <Trophy className="w-4 h-4 stroke-[2.5]" />
              <span>审核通过，立即确认胡牌！</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <span>尚未满足胡牌要求，无法提交</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
