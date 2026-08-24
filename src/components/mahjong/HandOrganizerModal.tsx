import React, { useState, useEffect } from 'react';
import { MahjongTileData } from '../../types/mahjong';
import { MahjongTile } from './MahjongTile';
import {
  HandGroupSlot,
  validateSlot,
  autoGroupHand,
  sortByClashPairs,
} from '../../utils/handOrganizer';
import { sortHand } from '../../utils/mahjongRules';
import { playTileClickSound, triggerHaptic } from '../../utils/soundEffects';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Layers,
  ArrowUpDown,
  MoveHorizontal,
  Flame,
  Check,
} from 'lucide-react';

interface HandOrganizerModalProps {
  isOpen: boolean;
  hand: MahjongTileData[];
  onClose: () => void;
  onApplyNewHand: (newHand: MahjongTileData[]) => void;
}

export const HandOrganizerModal: React.FC<HandOrganizerModalProps> = ({
  isOpen,
  hand,
  onClose,
  onApplyNewHand,
}) => {
  // Slots state
  const [slots, setSlots] = useState<HandGroupSlot[]>([
    { id: 'kan_1', name: '砍 一', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_2', name: '砍 二', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_3', name: '砍 三', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_4', name: '砍 四', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'pair_1', name: '雀头·将牌', type: 'pair', maxTiles: 2, tiles: [] },
  ]);

  const [unassignedTiles, setUnassignedTiles] = useState<MahjongTileData[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Initialize or reset with intelligent auto-grouping whenever opened
  useEffect(() => {
    if (isOpen && hand.length > 0) {
      const grouped = autoGroupHand(hand);
      setSlots(grouped.slots);
      setUnassignedTiles(grouped.unassigned);
      setSelectedTileId(null);
    }
  }, [isOpen, hand]);

  if (!isOpen) return null;

  // Find where a tile is located
  const findTileLocation = (tileId: string) => {
    const unassignedIdx = unassignedTiles.findIndex(t => t.id === tileId);
    if (unassignedIdx !== -1) {
      return { type: 'unassigned' as const, index: unassignedIdx, tile: unassignedTiles[unassignedIdx] };
    }
    for (let sIdx = 0; sIdx < slots.length; sIdx++) {
      const tIdx = slots[sIdx].tiles.findIndex(t => t.id === tileId);
      if (tIdx !== -1) {
        return {
          type: 'slot' as const,
          slotIndex: sIdx,
          tileIndex: tIdx,
          tile: slots[sIdx].tiles[tIdx],
        };
      }
    }
    return null;
  };

  // Move tile into target slot
  const moveTileToSlot = (tileId: string, targetSlotIndex: number) => {
    const loc = findTileLocation(tileId);
    if (!loc) return;

    const targetSlot = slots[targetSlotIndex];
    if (targetSlot.tiles.length >= targetSlot.maxTiles) {
      triggerHaptic('medium');
      return; // Slot full
    }

    playTileClickSound();
    triggerHaptic('light');

    // Remove from origin
    if (loc.type === 'unassigned') {
      setUnassignedTiles(prev => prev.filter(t => t.id !== tileId));
    } else {
      setSlots(prev =>
        prev.map((s, idx) =>
          idx === loc.slotIndex
            ? { ...s, tiles: s.tiles.filter(t => t.id !== tileId) }
            : s
        )
      );
    }

    // Add to target slot
    setSlots(prev =>
      prev.map((s, idx) =>
        idx === targetSlotIndex
          ? { ...s, tiles: [...s.tiles, loc.tile] }
          : s
      )
    );

    setSelectedTileId(null);
  };

  // Move tile to unassigned pool
  const moveTileToUnassigned = (tileId: string) => {
    const loc = findTileLocation(tileId);
    if (!loc || loc.type === 'unassigned') return;

    playTileClickSound();
    triggerHaptic('light');

    // Remove from slot
    setSlots(prev =>
      prev.map((s, idx) =>
        idx === loc.slotIndex
          ? { ...s, tiles: s.tiles.filter(t => t.id !== tileId) }
          : s
      )
    );

    // Add to unassigned
    setUnassignedTiles(prev => [...prev, loc.tile]);
    setSelectedTileId(null);
  };

  // Handle tile click
  const handleTileClick = (tileId: string) => {
    playTileClickSound();
    if (selectedTileId === tileId) {
      setSelectedTileId(null);
    } else {
      setSelectedTileId(tileId);
    }
  };

  // Auto solve & group
  const handleAutoGroup = () => {
    playTileClickSound();
    triggerHaptic('medium');
    const allTiles = [...slots.flatMap(s => s.tiles), ...unassignedTiles];
    const grouped = autoGroupHand(allTiles);
    setSlots(grouped.slots);
    setUnassignedTiles(grouped.unassigned);
    setSelectedTileId(null);
  };

  // Sort by Elements
  const handleSortStandard = () => {
    playTileClickSound();
    const allTiles = [...slots.flatMap(s => s.tiles), ...unassignedTiles];
    const sorted = sortHand(allTiles);
    setSlots(slots.map(s => ({ ...s, tiles: [] })));
    setUnassignedTiles(sorted);
    setSelectedTileId(null);
  };

  // Sort by Clash pairs
  const handleSortClash = () => {
    playTileClickSound();
    const allTiles = [...slots.flatMap(s => s.tiles), ...unassignedTiles];
    const sorted = sortByClashPairs(allTiles);
    setSlots(slots.map(s => ({ ...s, tiles: [] })));
    setUnassignedTiles(sorted);
    setSelectedTileId(null);
  };

  // Reset all to unassigned pool
  const handleResetToPool = () => {
    playTileClickSound();
    const allTiles = [...slots.flatMap(s => s.tiles), ...unassignedTiles];
    setSlots(slots.map(s => ({ ...s, tiles: [] })));
    setUnassignedTiles(allTiles);
    setSelectedTileId(null);
  };

  // Apply new arrangement to hand
  const handleApply = () => {
    const flattened: MahjongTileData[] = [
      ...slots[0].tiles,
      ...slots[1].tiles,
      ...slots[2].tiles,
      ...slots[3].tiles,
      ...slots[4].tiles,
      ...unassignedTiles,
    ];
    playTileClickSound();
    triggerHaptic('heavy');
    onApplyNewHand(flattened);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="w-full max-w-2xl bg-[#181226] border border-purple-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-500/40 text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>手牌组合调整 · 理牌工作台</span>
                <span className="text-[11px] font-normal text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-700/50">
                  共 {hand.length} 张
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                可自由拖拽/点击调配 4组砍 + 1组将牌，即时校验每组有效性
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Organizing Strategy Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAutoGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs shadow-md transition-all transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ 智能一键组牌</span>
          </button>

          <button
            type="button"
            onClick={handleSortStandard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-purple-200 text-xs font-semibold border border-purple-500/30 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>五行干支序</span>
          </button>

          <button
            type="button"
            onClick={handleSortClash}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-rose-200 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>冲战克制序</span>
          </button>

          <button
            type="button"
            onClick={handleResetToPool}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-slate-300 text-xs font-semibold border border-slate-700 transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>全部归池</span>
          </button>
        </div>

        {/* 5 Combination Slots Grid (4 Kans + 1 Pair) */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
            <span>组合槽位 (4砍 + 1将)：</span>
            {selectedTileId && (
              <span className="text-[11px] text-amber-400 font-normal animate-pulse">
                👉 已选中牌张，点击下方槽位即可放入
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {slots.map((slot, sIdx) => {
              const val = validateSlot(slot.tiles, slot.type);
              const isFull = slot.tiles.length >= slot.maxTiles;

              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    val.isValid
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : slot.tiles.length > 0
                      ? 'bg-purple-950/30 border-purple-500/40'
                      : 'bg-[#120D1D]/70 border-dashed border-slate-700/80'
                  } ${slot.type === 'pair' ? 'sm:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">
                        {slot.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({slot.tiles.length}/{slot.maxTiles}张)
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        val.isValid
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                          : slot.tiles.length > 0
                          ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30'
                          : 'text-slate-500'
                      }`}
                    >
                      {val.isValid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : slot.tiles.length > 0 ? (
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                      ) : null}
                      <span>{val.label}</span>
                    </div>
                  </div>

                  {/* Slot Tiles Dropzone */}
                  <div
                    onClick={() => {
                      if (selectedTileId && !isFull) {
                        moveTileToSlot(selectedTileId, sIdx);
                      }
                    }}
                    className={`min-h-16 p-2 rounded-xl bg-black/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      selectedTileId && !isFull
                        ? 'hover:bg-purple-900/40 border border-purple-400/50 border-dashed'
                        : ''
                    }`}
                  >
                    {slot.tiles.length === 0 ? (
                      <span className="text-[11px] text-slate-500">
                        {selectedTileId ? '点击放入选中的牌' : `空槽位 (最多${slot.maxTiles}张)`}
                      </span>
                    ) : (
                      slot.tiles.map(tile => (
                        <div
                          key={tile.id}
                          onClick={e => {
                            e.stopPropagation();
                            if (selectedTileId === tile.id) {
                              moveTileToUnassigned(tile.id);
                            } else {
                              handleTileClick(tile.id);
                            }
                          }}
                          className="relative group cursor-pointer"
                          title="点击选中；再次点击移回待整理区"
                        >
                          <MahjongTile
                            tile={tile}
                            size="sm"
                            isSelected={selectedTileId === tile.id}
                          />
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ✕
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unassigned / Free Pool */}
        <div className="p-3.5 rounded-2xl bg-[#120D1D] border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                待整理 / 游离手牌池
              </span>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded-md border border-purple-800">
                {unassignedTiles.length} 张
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              点击牌张后点击上方目标槽位即可调入
            </span>
          </div>

          <div className="min-h-14 p-2 rounded-xl bg-black/40 flex flex-wrap items-center justify-center gap-1.5">
            {unassignedTiles.length === 0 ? (
              <span className="text-xs text-slate-500 py-2">
                所有手牌均已分配到组合槽位中
              </span>
            ) : (
              unassignedTiles.map(tile => (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className="cursor-pointer"
                >
                  <MahjongTile
                    tile={tile}
                    size="sm"
                    isSelected={selectedTileId === tile.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-950 transition-all transform active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>应用组合到对局手牌</span>
          </button>
        </div>

      </div>

    </div>
  );
};
