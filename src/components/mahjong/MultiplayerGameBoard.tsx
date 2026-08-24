import React, { useState, useEffect, useMemo } from 'react';
import {
  MahjongTileData,
  Meld,
  HuResult,
  AvailableClaim,
} from '../../types/mahjong';
import {
  MultiplayerGameState,
  OnlinePlayer,
  ChatMessage,
} from '../../types/multiplayer';
import {
  socketService,
  getLocalUserProfile,
} from '../../services/socketService';
import {
  sortHand,
  checkHu,
  getTingTiles,
  findEatOptions,
  findPungOptions,
  findKongOptions,
} from '../../utils/mahjongRules';
import {
  playTileClickSound,
  playTileDiscardSound,
  playClaimSound,
  triggerHaptic,
} from '../../utils/soundEffects';
import { MahjongTile } from './MahjongTile';
import { ClaimDialog } from './ClaimDialog';
import { HuCelebrationModal } from './HuCelebrationModal';
import { HandOrganizerModal } from './HandOrganizerModal';
import { HuAuditModal } from './HuAuditModal';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  ArrowRight,
  Layers,
  ShieldAlert,
  Send,
  Radio,
  Clock,
  LogOut,
  RefreshCw,
  Crown,
  Bot,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';

interface MultiplayerGameBoardProps {
  gameState: MultiplayerGameState;
  chatMessages: ChatMessage[];
  onLeaveRoom: () => void;
  onOpenRules: () => void;
}

const SEAT_NAMES = ['东风 (庄)', '南风', '西风', '北风'];
const QUICK_SHOUTS = [
  '⚡ 冲战碰！五行生克！',
  '🔥 碰！天干五合！',
  '🪵 吃！地支六合！',
  '🀄 听牌了，各位道友小心！',
  '🏆 准备胡大牌！',
  '💨 妙啊，这局难分难解！',
];

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  gameState,
  chatMessages,
  onLeaveRoom,
  onOpenRules,
}) => {
  const myProfile = getLocalUserProfile();
  const myPlayer = gameState.players.find(p => p?.userId === myProfile.userId);
  const mySeatIndex = myPlayer ? myPlayer.seatIndex : 0;
  const isMyTurn = gameState.currentTurn === mySeatIndex;

  // Local hand management for sorting & grouping
  const [localHand, setLocalHand] = useState<MahjongTileData[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');

  // Hu Audit Modal
  const [isHuAuditOpen, setIsHuAuditOpen] = useState<boolean>(false);
  const [auditClaimTile, setAuditClaimTile] = useState<MahjongTileData | null>(null);

  // Turn Countdown Remaining seconds
  const [countdown, setCountdown] = useState<number>(0);

  // Sync hand with server updates while preserving custom order if count matches
  useEffect(() => {
    if (myPlayer?.hand) {
      setLocalHand(prev => {
        if (prev.length === 0 || prev.length !== myPlayer.hand!.length) {
          return myPlayer.hand!;
        }
        // Check if hand IDs match
        const serverIds = new Set(myPlayer.hand!.map(t => t.id));
        const allPresent = prev.every(t => serverIds.has(t.id));
        if (allPresent) return prev;
        return myPlayer.hand!;
      });
    }
  }, [myPlayer?.hand]);

  // Turn Countdown Timer effect
  useEffect(() => {
    if (!gameState.turnDeadline) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.turnDeadline! - Date.now()) / 1000));
      setCountdown(remaining);
    }, 200);
    return () => clearInterval(interval);
  }, [gameState.turnDeadline]);

  // Relative seated players
  const relativePlayers = useMemo(() => {
    // 0: Down (Self), 1: Right, 2: Up, 3: Left
    return [
      { relativePos: 'self', seatIdx: mySeatIndex, player: gameState.players[mySeatIndex] },
      { relativePos: 'right', seatIdx: (mySeatIndex + 1) % 4, player: gameState.players[(mySeatIndex + 1) % 4] },
      { relativePos: 'opposite', seatIdx: (mySeatIndex + 2) % 4, player: gameState.players[(mySeatIndex + 2) % 4] },
      { relativePos: 'left', seatIdx: (mySeatIndex + 3) % 4, player: gameState.players[(mySeatIndex + 3) % 4] },
    ];
  }, [gameState.players, mySeatIndex]);

  // Check if I can claim the last discarded card
  const myPendingClaims = useMemo(() => {
    if (!gameState.lastDiscard || isMyTurn || !myPlayer || localHand.length === 0) {
      return null;
    }
    const discardedTile = gameState.lastDiscard.tile;
    const discarderSeatIdx = gameState.lastDiscard.playerIndex;
    const isShangjia = (discarderSeatIdx + 1) % 4 === mySeatIndex;

    const claims: AvailableClaim[] = [];

    // 1. Hu
    const testHand = [...localHand, discardedTile];
    const huCheck = checkHu(testHand, myPlayer.melds, false, false);
    if (huCheck.isHu) {
      claims.push({
        type: 'hu',
        label: `捉炮胡牌 (${huCheck.fans}番 ${huCheck.explanation})`,
        tiles: [discardedTile],
        targetTile: discardedTile,
        priority: 100,
      });
    }

    // 2. Clash Pung & Normal Pung
    const { normalPung, clashPung } = findPungOptions(localHand, discardedTile);
    if (clashPung) {
      claims.push({
        type: 'clash_pung',
        label: `冲战碰 (${clashPung[0].name}${clashPung[1].name} 冲 ${discardedTile.name})`,
        tiles: clashPung,
        targetTile: discardedTile,
        priority: 80,
      });
    }
    if (normalPung) {
      claims.push({
        type: 'pung',
        label: `碰牌 (${normalPung[0].name}${normalPung[1].name}${discardedTile.name})`,
        tiles: normalPung,
        targetTile: discardedTile,
        priority: 50,
      });
    }

    // 3. Kong
    const kongOptions = findKongOptions(localHand, discardedTile);
    if (kongOptions.length > 0) {
      claims.push({
        type: 'kong',
        label: `大明杠 (${discardedTile.name}*4)`,
        tiles: kongOptions[0],
        targetTile: discardedTile,
        priority: 60,
      });
    }

    // 4. Eat (only if from Shangjia)
    if (isShangjia) {
      const eatOptions = findEatOptions(localHand, discardedTile);
      eatOptions.forEach(opt => {
        claims.push({
          type: 'eat',
          label: `吃牌 · ${opt.kan.typeLabel} (${opt.kan.name})`,
          tiles: opt.tiles,
          targetTile: discardedTile,
          priority: 20,
        });
      });
    }

    if (claims.length === 0) return null;
    return {
      targetTile: discardedTile,
      sourceIndex: discarderSeatIdx,
      claims,
    };
  }, [gameState.lastDiscard, isMyTurn, myPlayer, localHand, mySeatIndex]);

  // Check if Self-Draw Hu is available on my turn
  const canSelfDrawHu = useMemo(() => {
    if (!isMyTurn || !myPlayer || localHand.length === 0) return false;
    const res = checkHu(localHand, myPlayer.melds, false, false);
    return res.isHu;
  }, [isMyTurn, myPlayer, localHand]);

  // Ting (Ready to Hu) tiles hints
  const tingTiles = useMemo(() => {
    if (!isMyTurn || !myPlayer || localHand.length % 3 !== 2) return [];
    return getTingTiles(localHand, myPlayer.melds);
  }, [isMyTurn, myPlayer, localHand]);

  // Handle tile discard
  const handleTileClick = (tile: MahjongTileData) => {
    if (!isMyTurn) return;
    if (selectedTileId === tile.id) {
      // Discard directly
      if (soundEnabled) playTileDiscardSound();
      triggerHaptic('medium');
      socketService.discard(gameState.roomId, tile.id);
      setSelectedTileId(null);
    } else {
      if (soundEnabled) playTileClickSound();
      setSelectedTileId(tile.id);
    }
  };

  const handleDiscardSelected = () => {
    if (!isMyTurn || !selectedTileId) return;
    if (soundEnabled) playTileDiscardSound();
    triggerHaptic('medium');
    socketService.discard(gameState.roomId, selectedTileId);
    setSelectedTileId(null);
  };

  const handleExecuteClaim = (claim: AvailableClaim) => {
    if (soundEnabled && claim.type !== 'pass') {
      playClaimSound(claim.type as 'eat' | 'pung' | 'clash_pung' | 'kong' | 'hu');
    }
    triggerHaptic('heavy');
    socketService.submitClaim(gameState.roomId, claim);
  };

  const handlePassClaim = () => {
    socketService.submitClaim(gameState.roomId, null);
  };

  const handleSelfDrawHuClick = () => {
    socketService.selfDrawHu(gameState.roomId, res => {
      if (!res.success) alert('胡牌验证未通过');
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketService.sendChat(gameState.roomId, chatInput.trim(), 'text');
    setChatInput('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-1.5 space-y-3 animate-in fade-in select-none">
      
      {/* Table Top Status Bar */}
      <div className="bg-[#180E29]/90 border border-purple-500/30 rounded-2xl p-2.5 sm:p-3 shadow-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black">
            #{gameState.roomId}
          </span>
          <span className="font-bold text-slate-200 truncate max-w-[120px] sm:max-w-[200px]">
            {gameState.roomName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
            <Radio className="w-3 h-3 animate-pulse" /> 实时对决
          </span>
        </div>

        {/* Center Wall Remaining & Dice */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 border border-purple-500/20 text-slate-300 font-mono">
            <span className="text-[10px] text-slate-400">牌墙余</span>
            <b className="text-amber-400 text-sm font-black">{gameState.wallRemaining}</b>
            <span className="text-[10px] text-slate-400">张</span>
          </div>

          {gameState.diceRoll && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-purple-300 bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-500/20">
              <span>🎲 骰点: {gameState.diceRoll[0]}+{gameState.diceRoll[1]}</span>
            </div>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="音效开关"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors relative"
            title="桌台发语"
          >
            <MessageCircle className="w-4 h-4" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenRules}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="规则图谱"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-2.5 py-1 rounded-xl bg-red-950/50 hover:bg-red-950 border border-red-500/30 text-red-300 text-[11px] font-bold transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>离桌</span>
          </button>
        </div>
      </div>

      {/* 4-Way Mahjong Table Canvas */}
      <div className="relative bg-gradient-to-b from-[#110A1F] via-[#1B112E] to-[#120B20] border-2 border-purple-500/30 rounded-3xl p-3 sm:p-5 shadow-2xl min-h-[520px] flex flex-col justify-between overflow-hidden">
        
        {/* Table Felt Subtle Glow Center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* TOP: Duijia (对家 / Opposite Player) */}
        {(() => {
          const { player, seatIdx } = relativePlayers[2];
          const isTurn = gameState.currentTurn === seatIdx;

          return (
            <div className="flex flex-col items-center z-10">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-2xl border transition-all ${
                isTurn
                  ? 'bg-amber-400/20 border-amber-400 shadow-md shadow-amber-400/20 animate-pulse'
                  : 'bg-black/40 border-purple-500/20'
              }`}>
                <span className="text-xl">{player?.avatar || '👤'}</span>
                <span className="font-bold text-xs text-slate-200 truncate max-w-[100px]">
                  {player?.name || '对家'}
                </span>
                <span className="text-[10px] text-amber-300 font-mono">{SEAT_NAMES[seatIdx]}</span>
                <span className="text-[10px] text-slate-400">({player?.handCount ?? 13}张)</span>
              </div>

              {/* Opponent Melds & Discards */}
              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-md">
                {player?.melds.map((meld, mIdx) => (
                  <div key={mIdx} className="flex gap-0.5 bg-black/40 p-0.5 rounded-lg border border-purple-500/20 scale-90">
                    {meld.tiles.map((t, tIdx) => (
                      <MahjongTile key={tIdx} tile={t} size="sm" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* MIDDLE SECTION: Left Player | Table Center (Discards & Turn Ring) | Right Player */}
        <div className="grid grid-cols-12 items-center gap-2 my-2 z-10">
          
          {/* Left Player (上家) */}
          <div className="col-span-3 flex flex-col items-start space-y-1">
            {(() => {
              const { player, seatIdx } = relativePlayers[3];
              const isTurn = gameState.currentTurn === seatIdx;
              return (
                <div className={`p-2 rounded-2xl border transition-all w-full max-w-[130px] ${
                  isTurn
                    ? 'bg-amber-400/20 border-amber-400 shadow-md animate-pulse'
                    : 'bg-black/40 border-purple-500/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{player?.avatar || '👤'}</span>
                    <span className="font-bold text-xs text-slate-200 truncate">{player?.name || '上家'}</span>
                  </div>
                  <div className="text-[10px] text-amber-300 mt-0.5">{SEAT_NAMES[seatIdx]}</div>
                  <div className="text-[10px] text-slate-400">{player?.handCount ?? 13}张手牌</div>
                  {player?.melds && player.melds.length > 0 && (
                    <div className="mt-1 text-[9px] text-purple-300">
                      已亮{player.melds.length}砍
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Table Center: Shared Pool Discards & Active Turn Dial */}
          <div className="col-span-6 flex flex-col items-center justify-center p-2 bg-[#120822]/80 border border-purple-500/30 rounded-3xl min-h-[190px] relative shadow-inner">
            
            {/* Center Directional Compass Dial */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 border border-purple-500/30 text-[10px]">
              <span className="text-amber-300 font-bold">{SEAT_NAMES[gameState.currentTurn]}</span>
              <span className="text-slate-400">出牌中</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>

            {/* Countdown Badge */}
            {countdown > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                <Clock className="w-3 h-3" />
                <span>{countdown}s</span>
              </div>
            )}

            {/* Last Discarded Tile Highlight */}
            {gameState.lastDiscard ? (
              <div className="flex flex-col items-center animate-in zoom-in-90 duration-200 my-auto">
                <span className="text-[11px] text-amber-300 font-bold mb-1 flex items-center gap-1">
                  <span>【{gameState.players[gameState.lastDiscard.playerIndex]?.name}】打出：</span>
                </span>
                <div className="ring-4 ring-amber-400/60 rounded-xl shadow-xl transform scale-110">
                  <MahjongTile tile={gameState.lastDiscard.tile} size="md" />
                </div>
              </div>
            ) : (
              <div className="my-auto text-center space-y-1">
                <div className="text-2xl">☯️</div>
                <div className="text-xs font-bold text-purple-300">五行生克 轮转不息</div>
                <div className="text-[10px] text-slate-500">等待当前道友行牌...</div>
              </div>
            )}

            {/* Global Discards mini grid */}
            <div className="w-full flex flex-wrap gap-1 justify-center max-h-20 overflow-y-auto mt-2 pt-1 border-t border-white/5">
              {gameState.players.flatMap(p => p?.discards || []).slice(-12).map((t, idx) => (
                <div key={idx} className="scale-75 origin-center opacity-85">
                  <MahjongTile tile={t} size="sm" />
                </div>
              ))}
            </div>

          </div>

          {/* Right Player (下家) */}
          <div className="col-span-3 flex flex-col items-end space-y-1">
            {(() => {
              const { player, seatIdx } = relativePlayers[1];
              const isTurn = gameState.currentTurn === seatIdx;
              return (
                <div className={`p-2 rounded-2xl border transition-all w-full max-w-[130px] ${
                  isTurn
                    ? 'bg-amber-400/20 border-amber-400 shadow-md animate-pulse'
                    : 'bg-black/40 border-purple-500/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{player?.avatar || '👤'}</span>
                    <span className="font-bold text-xs text-slate-200 truncate">{player?.name || '下家'}</span>
                  </div>
                  <div className="text-[10px] text-amber-300 mt-0.5">{SEAT_NAMES[seatIdx]}</div>
                  <div className="text-[10px] text-slate-400">{player?.handCount ?? 13}张手牌</div>
                  {player?.melds && player.melds.length > 0 && (
                    <div className="mt-1 text-[9px] text-purple-300">
                      已亮{player.melds.length}砍
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

        </div>

        {/* BOTTOM: Self (我方手牌、亮出的砍、行动栏) */}
        <div className="flex flex-col items-center space-y-2 z-10 pt-2 border-t border-purple-500/20">
          
          {/* Action Prompt Banner */}
          <div className="flex items-center justify-between w-full max-w-3xl px-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isMyTurn
                  ? 'bg-amber-500 text-amber-950 font-black animate-pulse shadow-md'
                  : 'bg-black/40 border border-purple-500/30 text-slate-400'
              }`}>
                {isMyTurn ? '👉 轮到你出牌' : `等待 ${SEAT_NAMES[gameState.currentTurn]} 出牌...`}
              </span>

              {/* Ting tiles hint badge */}
              {tingTiles.length > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>听牌中：{tingTiles.map(t => t.tileName).join(', ')}</span>
                </span>
              )}
            </div>

            {/* Hand Tools */}
            <div className="flex items-center gap-2">
              {canSelfDrawHu && (
                <button
                  type="button"
                  onClick={handleSelfDrawHuClick}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-500/40 animate-bounce flex items-center gap-1"
                >
                  <Crown className="w-4 h-4 fill-current" />
                  <span>自摸胡牌！</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setLocalHand(sortHand([...localHand]))}
                className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-bold transition-colors"
                title="按干支与五行排一手牌"
              >
                理牌
              </button>

              <button
                type="button"
                onClick={() => setIsOrganizerOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-bold transition-colors flex items-center gap-1"
                title="打开理牌工作台"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>工作台</span>
              </button>
            </div>
          </div>

          {/* Self Melds (亮出的组合) */}
          {myPlayer?.melds && myPlayer.melds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {myPlayer.melds.map((meld, idx) => (
                <div key={idx} className="flex gap-0.5 bg-black/50 p-1 rounded-xl border border-amber-500/30">
                  {meld.tiles.map((t, tIdx) => (
                    <MahjongTile key={tIdx} tile={t} size="sm" />
                  ))}
                  <span className="text-[10px] text-amber-400 font-bold self-center px-1">
                    {meld.typeLabel}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Self Hand Tiles (可点击、出牌) */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center items-end p-2 rounded-2xl bg-black/40 border border-purple-500/20 w-full overflow-x-auto">
            {localHand.map((tile, idx) => {
              const isSelected = selectedTileId === tile.id;
              const isLastDrawn = myPlayer?.lastDrawnTile?.id === tile.id;

              return (
                <div
                  key={tile.id || idx}
                  onClick={() => handleTileClick(tile)}
                  className={`cursor-pointer transition-all duration-150 transform ${
                    isSelected ? '-translate-y-3.5 ring-2 ring-amber-400 rounded-xl shadow-lg' : 'hover:-translate-y-1'
                  } ${isLastDrawn ? 'ml-2' : ''}`}
                >
                  <MahjongTile tile={tile} size="md" />
                </div>
              );
            })}
          </div>

          {/* Discard confirmation button if tile is selected */}
          {selectedTileId && isMyTurn && (
            <div className="animate-in fade-in flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardSelected}
                className="px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>打出选中的牌</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Floating Chat / Quick Shouts Drawer */}
      {isChatOpen && (
        <div className="bg-[#1C1230] border border-purple-500/30 rounded-3xl p-3.5 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span>道友实时对话</span>
            </h4>
            <button type="button" onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>

          {/* Quick Shouts */}
          <div className="flex flex-wrap gap-1">
            {QUICK_SHOUTS.map((shout, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => socketService.sendChat(gameState.roomId, shout, 'shout')}
                className="px-2 py-0.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-[11px] text-purple-200 transition-colors"
              >
                {shout}
              </button>
            ))}
          </div>

          {/* Chat Feed */}
          <div className="h-28 overflow-y-auto space-y-1 p-2 bg-black/40 rounded-xl border border-white/5 text-xs">
            {chatMessages.map(msg => (
              <div key={msg.id} className="text-slate-200">
                <span className="text-amber-400 font-bold">{msg.avatar} {msg.senderName}:</span>{' '}
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="发语交流..."
              maxLength={40}
              className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              发送
            </button>
          </form>
        </div>
      )}

      {/* Claim Dialog (Eat, Pung, Clash Pung, Kong, Hu, Pass) */}
      {myPendingClaims && (
        <ClaimDialog
          claimData={myPendingClaims}
          onClaim={handleExecuteClaim}
          onPass={handlePassClaim}
        />
      )}

      {/* Hand Organizer Modal */}
      {isOrganizerOpen && (
        <HandOrganizerModal
          hand={localHand}
          melds={myPlayer?.melds || []}
          onClose={() => setIsOrganizerOpen(false)}
          onApplyNewHand={newHand => {
            setLocalHand(newHand);
            setIsOrganizerOpen(false);
          }}
        />
      )}

      {/* Round End / Victory Hu Settlement Modal */}
      {gameState.status === 'round_end' && gameState.winnerData && (
        <HuCelebrationModal
          isOpen={true}
          winner={{
            id: `p_${gameState.winnerData.winnerIndex}`,
            name: gameState.winnerData.winnerName,
            avatar: gameState.players[gameState.winnerData.winnerIndex]?.avatar || '🏆',
            isHuman: gameState.winnerData.winnerIndex === mySeatIndex,
            position: 'self',
            hand: gameState.winnerData.winningTiles,
            melds: gameState.players[gameState.winnerData.winnerIndex]?.melds || [],
            discards: [],
            isDealer: gameState.winnerData.winnerIndex === gameState.dealerIndex,
            score: gameState.players[gameState.winnerData.winnerIndex]?.score || 1000,
          }}
          loser={
            gameState.winnerData.discarderIndex !== undefined
              ? {
                  id: `p_${gameState.winnerData.discarderIndex}`,
                  name: gameState.players[gameState.winnerData.discarderIndex]?.name || '放铳者',
                  avatar: gameState.players[gameState.winnerData.discarderIndex]?.avatar || '👤',
                  isHuman: gameState.winnerData.discarderIndex === mySeatIndex,
                  position: 'right',
                  hand: [],
                  melds: [],
                  discards: [],
                  isDealer: false,
                  score: gameState.players[gameState.winnerData.discarderIndex]?.score || 1000,
                }
              : undefined
          }
          isSelfDraw={gameState.winnerData.isSelfDraw}
          huResult={gameState.winnerData.huResult}
          allTiles={gameState.winnerData.winningTiles}
          onClose={() => {
            if (myPlayer?.isHost) {
              socketService.restartGame(gameState.roomId);
            }
          }}
          onPlayAgain={() => {
            if (myPlayer?.isHost) {
              socketService.restartGame(gameState.roomId);
            } else {
              socketService.setReady(gameState.roomId, true);
            }
          }}
        />
      )}

    </div>
  );
};
