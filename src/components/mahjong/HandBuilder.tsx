import React, { useState, useMemo } from 'react';
import { MahjongTileData } from '../../types/mahjong';
import {
  TILE_DEFINITIONS,
  checkHu,
  getTingTiles,
  sortHand,
} from '../../utils/mahjongRules';
import {
  autoGroupHand,
  sortByClashPairs,
} from '../../utils/handOrganizer';
import { MahjongTile } from './MahjongTile';
import { HandOrganizerModal } from './HandOrganizerModal';
import {
  Sparkles,
  Trash2,
  HelpCircle,
  Award,
  Flame,
  CheckCircle2,
  RefreshCw,
  Plus,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

export const HandBuilder: React.FC = () => {
  const [selectedHand, setSelectedHand] = useState<MahjongTileData[]>([]);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [draggedTileIndex, setDraggedTileIndex] = useState<number | null>(null);

  // Add tile to test hand (limit 14)
  const addTile = (def: Omit<MahjongTileData, 'id'>) => {
    if (selectedHand.length >= 14) return;
    const newTile: MahjongTileData = {
      ...def,
      id: `custom_${def.name}_${Date.now()}_${Math.random()}`,
    };
    setSelectedHand(prev => [...prev, newTile]);
  };

  const removeTile = (index: number) => {
    setSelectedHand(prev => prev.filter((_, i) => i !== index));
    if (selectedTileIndex === index) setSelectedTileIndex(null);
  };

  const clearHand = () => {
    setSelectedHand([]);
    setSelectedTileIndex(null);
  };

  // Reorder methods
  const moveTileLeft = (index: number) => {
    if (index <= 0) return;
    setSelectedHand(prev => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(index - 1, 0, moved);
      return next;
    });
    setSelectedTileIndex(index - 1);
  };

  const moveTileRight = (index: number) => {
    if (index >= selectedHand.length - 1) return;
    setSelectedHand(prev => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(index + 1, 0, moved);
      return next;
    });
    setSelectedTileIndex(index + 1);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedTileIndex === null || draggedTileIndex === targetIndex) return;
    setSelectedHand(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedTileIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedTileIndex(null);
  };

  const handleAutoOrganize = () => {
    const grouped = autoGroupHand(selectedHand);
    const flattened: MahjongTileData[] = [
      ...grouped.slots.flatMap(s => s.tiles),
      ...grouped.unassigned,
    ];
    setSelectedHand(flattened);
  };

  // Evaluation results
  const huResult = useMemo(() => {
    if (selectedHand.length === 14) {
      return checkHu(selectedHand);
    }
    return null;
  }, [selectedHand]);

  const tingList = useMemo(() => {
    if (selectedHand.length === 13) {
      return getTingTiles(selectedHand);
    }
    return [];
  }, [selectedHand]);

  // Presets from PDF
  const loadPreset = (presetType: 'seven_pairs' | 'all_clash' | 'pure_harmony' | 'normal') => {
    const getTiles = (names: string[]) => {
      return names.map((name, i) => {
        const def = TILE_DEFINITIONS.find(t => t.name === name) || TILE_DEFINITIONS[0];
        return {
          ...def,
          id: `preset_${name}_${i}`,
        };
      });
    };

    if (presetType === 'seven_pairs') {
      // 7 Pairs: 丑丑, 辛辛, 乙乙, 火火, 寅寅, 卯卯, 辰辰
      setSelectedHand(getTiles(['丑', '丑', '辛', '辛', '乙', '乙', '火', '火', '寅', '寅', '卯', '卯', '辰', '辰']));
    } else if (presetType === 'all_clash') {
      // 4 Clash kans + 1 pair: (甲甲庚, 乙乙辛, 子子午, 申申寅, 丑丑)
      setSelectedHand(getTiles(['甲', '甲', '庚', '乙', '乙', '辛', '子', '子', '午', '申', '申', '寅', '丑', '丑']));
    } else if (presetType === 'pure_harmony') {
      // 4 Branch Three-Harmonies + 1 pair: 寅午戌, 亥卯未, 申子辰, 巳酉丑, 子子
      setSelectedHand(getTiles(['寅', '午', '戌', '亥', '卯', '未', '申', '子', '辰', '巳', '酉', '丑', '子', '子']));
    } else if (presetType === 'normal') {
      // Normal: 甲己土, 巳申水, 寅午戌, 丑丑丑, 辛辛
      setSelectedHand(getTiles(['甲', '己', '土', '巳', '申', '水', '寅', '午', '戌', '丑', '丑', '丑', '辛', '辛']));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 text-white animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-xs text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>智能排盘 · 算番与组合模拟器</span>
        </div>
        <h2 className="text-2xl font-black text-white">五行组牌与胡牌番数测算</h2>
        <p className="text-xs text-slate-400">
          点击下方 108 张图鉴自选手牌，支持手动调整组合、拖拽理牌、即时校验是否胡牌及听牌。
        </p>
      </div>

      {/* Preset Quick Load Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1">快捷范例：</span>
        {[
          { key: 'normal', label: '一番：小P胡' },
          { key: 'all_clash', label: '二番：全部冲战' },
          { key: 'pure_harmony', label: '四番：纯三合局' },
          { key: 'seven_pairs', label: '五番：七巧对' },
        ].map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => loadPreset(p.key as any)}
            className="px-3 py-1.5 rounded-xl bg-[#231A36] hover:bg-[#32254C] text-xs text-purple-200 font-bold border border-purple-500/30 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Selected Hand Display Arena */}
      <div className="bg-[#181226] border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-300">当前排盘手牌：</span>
            <span className="text-xs font-mono bg-purple-950 px-2 py-0.5 rounded-md text-purple-200 border border-purple-700/50">
              {selectedHand.length} / 14 张
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick adjust combinations */}
            {selectedHand.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOrganizerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>调整组合 (4砍1将)</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoOrganize}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2D2145] hover:bg-[#3D2D5E] text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>智能理牌</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHand(sortHand(selectedHand))}
                  className="px-2 py-1 rounded-xl bg-[#2D2145] hover:bg-[#3D2D5E] text-slate-300 text-xs transition-colors"
                >
                  五行序
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHand(sortByClashPairs(selectedHand))}
                  className="px-2 py-1 rounded-xl bg-[#2D2145] hover:bg-[#3D2D5E] text-rose-300 text-xs transition-colors"
                >
                  冲战序
                </button>
              </>
            )}

            {selectedHand.length > 0 && (
              <button
                type="button"
                onClick={clearHand}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected tile micro-action */}
        {selectedTileIndex !== null && selectedHand[selectedTileIndex] && (
          <div className="flex items-center justify-center gap-2 py-1 px-3 bg-purple-950/60 rounded-xl border border-purple-500/30">
            <span className="text-xs text-amber-300">
              选定【{selectedHand[selectedTileIndex].name}】：
            </span>
            <button
              type="button"
              onClick={() => moveTileLeft(selectedTileIndex)}
              disabled={selectedTileIndex === 0}
              className="px-2 py-0.5 rounded bg-purple-900 hover:bg-purple-800 disabled:opacity-30 text-xs text-purple-200 flex items-center gap-0.5"
            >
              <ChevronLeft className="w-3 h-3" /> 左移
            </button>
            <button
              type="button"
              onClick={() => moveTileRight(selectedTileIndex)}
              disabled={selectedTileIndex === selectedHand.length - 1}
              className="px-2 py-0.5 rounded bg-purple-900 hover:bg-purple-800 disabled:opacity-30 text-xs text-purple-200 flex items-center gap-0.5"
            >
              右移 <ChevronRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => removeTile(selectedTileIndex)}
              className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-xs text-rose-200"
            >
              移除
            </button>
            <button
              type="button"
              onClick={() => setSelectedTileIndex(null)}
              className="text-xs text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tiles in hand */}
        <div className="min-h-20 bg-[#0F0B18] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-1.5">
          {selectedHand.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 flex flex-col items-center gap-1">
              <Plus className="w-5 h-5 text-slate-600" />
              <span>请从下方点击牌张添加至手牌（支持 13 张测听牌，14 张测胡牌）</span>
            </div>
          ) : (
            selectedHand.map((tile, idx) => (
              <div
                key={tile.id || idx}
                draggable
                onDragStart={() => setDraggedTileIndex(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  handleDrop(idx);
                }}
                onClick={() => setSelectedTileIndex(selectedTileIndex === idx ? null : idx)}
                className="relative group cursor-pointer"
                title="点击选中或拖拽调换位置"
              >
                <MahjongTile tile={tile} size="md" isSelected={selectedTileIndex === idx} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTile(idx);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Real-time Analysis Feedback */}
        {selectedHand.length === 14 && huResult && (
          <div
            className={`p-4 rounded-2xl border ${
              huResult.isHu
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {huResult.isHu ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-bold text-sm">
                  {huResult.isHu ? '恭喜！牌型满足胡牌条件' : '暂未达到胡牌牌型'}
                </span>
              </div>
              {huResult.isHu && (
                <span className="text-sm font-black text-amber-400 font-mono">
                  {huResult.fans} 番
                </span>
              )}
            </div>

            {huResult.isHu && (
              <div className="mt-2 space-y-1 text-xs pt-2 border-t border-emerald-500/20">
                <div className="font-bold text-amber-300">{huResult.explanation}</div>
                {huResult.fanDetails.map((d, i) => (
                  <div key={i} className="text-slate-300">
                    • {d}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ting Suggestion for 13 tiles */}
        {selectedHand.length === 13 && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>听牌分析 (13张)：</span>
            </div>

            {tingList.length === 0 ? (
              <p className="text-xs text-slate-400">当前手牌未进入听牌阶段。</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tingList.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-[#1F172E] px-3 py-1.5 rounded-xl border border-amber-400/40"
                  >
                    <span className="text-xs text-slate-300">胡:</span>
                    <span className="text-sm font-bold text-amber-400 font-serif">
                      【{t.tileName}】
                    </span>
                    <span className="text-[11px] text-purple-300 font-mono">
                      ({t.fans}番 · {t.explanation})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hand Organizer Modal for HandBuilder */}
      <HandOrganizerModal
        isOpen={isOrganizerOpen}
        hand={selectedHand}
        onClose={() => setIsOrganizerOpen(false)}
        onApplyNewHand={(newHand) => {
          setSelectedHand(newHand);
          setSelectedTileIndex(null);
        }}
      />

      {/* All 108 Tiles Catalog to Click */}
      <div className="bg-[#181226] border border-purple-500/20 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>点击牌张添加到手牌</span>
          </h3>
          <span className="text-xs text-slate-400">点击即加入</span>
        </div>

        {/* 1. 五行 */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-emerald-400">五行牌</span>
          <div className="flex flex-wrap items-center gap-2">
            {TILE_DEFINITIONS.filter(t => t.category === 'element').map(def => (
              <MahjongTile
                key={def.name}
                tile={{ ...def, id: `cat_${def.name}` }}
                size="sm"
                onClick={() => addTile(def)}
              />
            ))}
          </div>
        </div>

        {/* 2. 天干 */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400">天干牌</span>
          <div className="flex flex-wrap items-center gap-2">
            {TILE_DEFINITIONS.filter(t => t.category === 'stem').map(def => (
              <MahjongTile
                key={def.name}
                tile={{ ...def, id: `cat_${def.name}` }}
                size="sm"
                onClick={() => addTile(def)}
              />
            ))}
          </div>
        </div>

        {/* 3. 地支 */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-purple-400">地支牌</span>
          <div className="flex flex-wrap items-center gap-2">
            {TILE_DEFINITIONS.filter(t => t.category === 'branch').map(def => (
              <MahjongTile
                key={def.name}
                tile={{ ...def, id: `cat_${def.name}` }}
                size="sm"
                onClick={() => addTile(def)}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
