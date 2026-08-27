import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MahjongTileData,
  Player,
  Meld,
  HuResult,
  AvailableClaim,
  GamePhase,
} from '../../types/mahjong';
import {
  createDeck,
  sortHand,
  checkHu,
  getTingTiles,
  findEatOptions,
  findPungOptions,
  findKongOptions,
  checkThreeTilesKan,
} from '../../utils/mahjongRules';
import {
  autoGroupHand,
  sortByClashPairs,
} from '../../utils/handOrganizer';
import {
  playTileClickSound,
  playTileDiscardSound,
  playDiceRollSound,
  playClaimSound,
  triggerHaptic,
} from '../../utils/soundEffects';
import { MahjongTile } from './MahjongTile';
import { ClaimDialog } from './ClaimDialog';
import { HuCelebrationModal } from './HuCelebrationModal';
import { HandOrganizerModal } from './HandOrganizerModal';
import { HuAuditModal } from './HuAuditModal';
import { HuAuditReport } from '../../utils/mahjongRules';
import {
  Dices,
  Crown,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  Layers,
  Volume2,
  VolumeX,
  HelpCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Rows,
  Flame,
  ArrowUpDown,
  MoveHorizontal,
  ShieldCheck,
} from 'lucide-react';

interface GameBoardProps {
  onOpenRules: () => void;
  onOpenHandBuilder: () => void;
  onOpenMultiplayer?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  onOpenRules,
  onOpenHandBuilder,
  onOpenMultiplayer,
}) => {
  // Game state
  const [deck, setDeck] = useState<MahjongTileData[]>([]);
  const [wallIndex, setWallIndex] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'self',
      name: '你 (玩家)',
      avatar: '🀄',
      isHuman: true,
      position: 'self',
      hand: [],
      melds: [],
      discards: [],
      isDealer: true,
      score: 1000,
    },
    {
      id: 'right',
      name: '下家 (西风·白虎)',
      avatar: '🐯',
      isHuman: false,
      position: 'right',
      hand: [],
      melds: [],
      discards: [],
      isDealer: false,
      score: 1000,
    },
    {
      id: 'opposite',
      name: '对家 (北风·玄武)',
      avatar: '🐢',
      isHuman: false,
      position: 'opposite',
      hand: [],
      melds: [],
      discards: [],
      isDealer: false,
      score: 1000,
    },
    {
      id: 'left',
      name: '上家 (东风·青龙)',
      avatar: '🐲',
      isHuman: false,
      position: 'left',
      hand: [],
      melds: [],
      discards: [],
      isDealer: false,
      score: 1000,
    },
  ]);

  const [currentTurn, setCurrentTurn] = useState<number>(0); // 0=self, 1=right, 2=opposite, 3=left
  const [gamePhase, setGamePhase] = useState<GamePhase>('seat_selection');
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 2]);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceText, setDiceText] = useState<string>('');

  // Selected tile in human hand
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);
  const [isGroupedView, setIsGroupedView] = useState<boolean>(false);
  const [draggedTileIndex, setDraggedTileIndex] = useState<number | null>(null);

  // Available claim for human player
  const [pendingClaim, setPendingClaim] = useState<{
    targetTile: MahjongTileData;
    sourceIndex: number;
    claims: AvailableClaim[];
  } | null>(null);

  // Hu Declaration & Audit Modal state
  const [isHuAuditOpen, setIsHuAuditOpen] = useState<boolean>(false);
  const [auditClaimTile, setAuditClaimTile] = useState<MahjongTileData | null>(null);
  const [auditClaimDiscarderIdx, setAuditClaimDiscarderIdx] = useState<number | undefined>(undefined);

  // Victory Hu Modal
  const [huModalState, setHuModalState] = useState<{
    isOpen: boolean;
    winner: Player;
    loser?: Player;
    isSelfDraw: boolean;
    huResult: HuResult;
    allTiles: MahjongTileData[];
  } | null>(null);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Logs of game activity
  const [gameLogs, setGameLogs] = useState<string[]>(['摸甲乙丙丁定庄，欢迎来到五行麻将！']);

  const addLog = (msg: string) => {
    setGameLogs(prev => [msg, ...prev.slice(0, 7)]);
  };

  // Human player ting list
  const humanPlayer = players[0];
  const tingList = useMemo(() => {
    if (!humanPlayer || humanPlayer.hand.length % 3 !== 1) return [];
    return getTingTiles(humanPlayer.hand, humanPlayer.melds);
  }, [humanPlayer?.hand, humanPlayer?.melds]);

  // Initial Deal Start
  const startSeatSelection = () => {
    setGamePhase('seat_selection');
    addLog('摸甲乙丙丁牌定庄：玩家摸到【甲】，由玩家率先坐庄！');
    // Set human as dealer
    setPlayers(prev =>
      prev.map((p, idx) => ({
        ...p,
        isDealer: idx === 0,
        hand: [],
        melds: [],
        discards: [],
      }))
    );
  };

  const handleRollDiceAndDeal = () => {
    setIsRollingDice(true);
    playDiceRollSound();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const minD = Math.min(d1, d2);

    let startSide = '庄家自己';
    if ([5, 9].includes(sum)) startSide = '庄家自己面前';
    else if ([3, 7, 11].includes(sum)) startSide = '对家面前';
    else if ([4, 8, 12].includes(sum)) startSide = '上家(左边)面前';
    else if ([2, 6, 10].includes(sum)) startSide = '下家(右边)面前';

    setTimeout(() => {
      setDiceValues([d1, d2]);
      setIsRollingDice(false);
      const logMsg = `掷骰点数【${d1}, ${d2}】(合${sum})，从${startSide}从右向左第${minD}落开始起牌！`;
      setDiceText(logMsg);
      addLog(logMsg);

      // Create new 108 tiles deck
      const newDeck = createDeck();
      let dealIdx = 0;

      // Deal 13 cards to each, 14 to dealer (Player 0)
      const pHands: MahjongTileData[][] = [[], [], [], []];
      for (let round = 0; round < 13; round++) {
        for (let p = 0; p < 4; p++) {
          pHands[p].push(newDeck[dealIdx++]);
        }
      }
      // 14th card to dealer
      pHands[0].push(newDeck[dealIdx++]);

      setDeck(newDeck);
      setWallIndex(dealIdx);

      setPlayers(prev =>
        prev.map((p, idx) => ({
          ...p,
          hand: idx === 0 ? pHands[idx] : sortHand(pHands[idx]),
          lastDrawnTile: idx === 0 ? pHands[idx][pHands[idx].length - 1] : null,
        }))
      );

      setCurrentTurn(0);
      setGamePhase('playing');
      addLog('庄家抓14张起手，游戏开始！请打出一张牌。');

      // Check Tian Hu (天胡)
      const tianHuCheck = checkHu(pHands[0], [], true);
      if (tianHuCheck.isHu) {
        setTimeout(() => {
          triggerHu(0, 0, true, tianHuCheck, pHands[0]);
        }, 600);
      }
    }, 900);
  };

  useEffect(() => {
    startSeatSelection();
  }, []);

  // Trigger Hu modal & score calculation
  const triggerHu = (
    winnerIdx: number,
    loserIdx: number,
    isSelfDraw: boolean,
    huResult: HuResult,
    handTiles: MahjongTileData[]
  ) => {
    playClaimSound('hu');
    triggerHaptic('heavy');
    const winner = players[winnerIdx];
    const loser = players[loserIdx];

    const allTiles = [...handTiles, ...winner.melds.flatMap(m => m.tiles)];

    // Update score
    const delta = huResult.fans * 100;
    setPlayers(prev =>
      prev.map((p, idx) => {
        if (idx === winnerIdx) return { ...p, score: p.score + delta * (isSelfDraw ? 3 : 1) };
        if (idx === loserIdx && !isSelfDraw) return { ...p, score: p.score - delta };
        if (isSelfDraw) return { ...p, score: p.score - delta };
        return p;
      })
    );

    setHuModalState({
      isOpen: true,
      winner,
      loser: isSelfDraw ? undefined : loser,
      isSelfDraw,
      huResult,
      allTiles,
    });
  };

  // Open Hu Audit Console
  const handleOpenHuAudit = (claimTile?: MahjongTileData | null, sourceIdx?: number) => {
    setAuditClaimTile(claimTile || null);
    setAuditClaimDiscarderIdx(sourceIdx);
    setIsHuAuditOpen(true);
    playTileClickSound();
    triggerHaptic('light');
  };

  // Confirm Hu passed from Audit Console
  const handleConfirmHuFromAudit = (
    report: HuAuditReport,
    isSelfDraw: boolean,
    discardTile?: MahjongTileData
  ) => {
    setIsHuAuditOpen(false);
    setPendingClaim(null);

    const winningTiles = discardTile
      ? [...players[0].hand, discardTile]
      : players[0].hand;

    const huResult: HuResult = {
      isHu: true,
      isSevenPairs: report.isSevenPairs,
      fans: report.fans,
      fanDetails: report.fanDetails,
      pair: report.pair,
      kans: report.kans?.map(k => k.tiles),
      explanation: report.explanation,
    };

    if (!isSelfDraw && auditClaimDiscarderIdx !== undefined && discardTile) {
      // Remove claimed tile from discarder's discards
      setPlayers(prev =>
        prev.map((p, idx) => {
          if (idx === auditClaimDiscarderIdx) {
            return {
              ...p,
              discards: p.discards.slice(0, p.discards.length - 1),
            };
          }
          return p;
        })
      );
      addLog(`你通过胡牌审核成功捉炮胡牌！共 ${report.fans} 番！`);
      triggerHu(0, auditClaimDiscarderIdx, false, huResult, winningTiles);
    } else {
      addLog(`你通过胡牌审核成功自摸胡牌！共 ${report.fans} 番！`);
      triggerHu(0, 0, true, huResult, winningTiles);
    }
  };

  // Next player's turn to draw
  const proceedToNextTurn = (nextPlayerIndex: number, currentDeck: MahjongTileData[], currentWallIdx: number) => {
    if (currentWallIdx >= currentDeck.length) {
      addLog('牌墙摸完，本局荒庄流局！');
      return;
    }

    const drawnTile = currentDeck[currentWallIdx];
    const updatedWallIdx = currentWallIdx + 1;
    setWallIndex(updatedWallIdx);
    setCurrentTurn(nextPlayerIndex);

    setPlayers(prev =>
      prev.map((p, idx) => {
        if (idx === nextPlayerIndex) {
          const newHand = [...p.hand, drawnTile];
          return {
            ...p,
            hand: newHand,
            lastDrawnTile: drawnTile,
          };
        }
        return {
          ...p,
          lastDrawnTile: null,
        };
      })
    );

    if (nextPlayerIndex === 0) {
      // Human's turn
      playTileClickSound();
      triggerHaptic('light');
      addLog(`你摸了一张【${drawnTile.name}】`);

      // Check self-draw Hu
      const updatedHand = [...players[0].hand, drawnTile];
      const huCheck = checkHu(updatedHand, players[0].melds, false);
      if (huCheck.isHu) {
        setPendingClaim({
          targetTile: drawnTile,
          sourceIndex: 0,
          claims: [
            {
              type: 'hu',
              label: `自摸胡 (${huCheck.fans}番)`,
              tiles: [],
              targetTile: drawnTile,
              priority: 10,
            },
          ],
        });
      }
    } else {
      // AI Turn
      handleAiTurn(nextPlayerIndex, drawnTile, currentDeck, updatedWallIdx);
    }
  };

  // AI Logic: Draw, check claim, and discard
  const handleAiTurn = (
    aiIndex: number,
    drawnTile: MahjongTileData,
    currentDeck: MahjongTileData[],
    currentWallIdx: number
  ) => {
    const aiPlayer = players[aiIndex];
    const currentHand = [...aiPlayer.hand, drawnTile];

    // 1. Check AI self-draw Hu
    const huCheck = checkHu(currentHand, aiPlayer.melds);
    if (huCheck.isHu) {
      setTimeout(() => {
        triggerHu(aiIndex, aiIndex, true, huCheck, currentHand);
      }, 1000);
      return;
    }

    // 2. Select card to discard
    // AI chooses tile that doesn't form pairs/kans easily
    setTimeout(() => {
      let discardIdx = currentHand.length - 1;

      // Smart AI discard: prefer single isolated cards
      const counts: Record<string, number> = {};
      for (const t of currentHand) counts[t.name] = (counts[t.name] || 0) + 1;

      for (let i = 0; i < currentHand.length; i++) {
        const t = currentHand[i];
        if (counts[t.name] === 1) {
          discardIdx = i;
          break;
        }
      }

      const discarded = currentHand[discardIdx];
      const newHand = currentHand.filter((_, i) => i !== discardIdx);

      playTileDiscardSound();

      setPlayers(prev =>
        prev.map((p, idx) => {
          if (idx === aiIndex) {
            return {
              ...p,
              hand: sortHand(newHand),
              discards: [...p.discards, discarded],
              lastDrawnTile: null,
            };
          }
          return p;
        })
      );

      addLog(`${aiPlayer.name} 打出了【${discarded.name}】`);

      // Check claims for other players (especially human)
      checkInterception(aiIndex, discarded, currentDeck, currentWallIdx);
    }, 1100);
  };

  // Check if someone can Hu / Clash Pung / Pung / Eat from discarded tile
  const checkInterception = (
    discarderIndex: number,
    discardedTile: MahjongTileData,
    currentDeck: MahjongTileData[],
    currentWallIdx: number
  ) => {
    // 1. Check if Human (player 0) can Hu
    const human = players[0];
    const humanCanHu = checkHu([...human.hand, discardedTile], human.melds);

    // 2. Check Pung & Clash Pung & Kong for Human
    const { normalPung, clashPung } = findPungOptions(human.hand, discardedTile);
    const kongOptions = findKongOptions(human.hand, discardedTile);

    // 3. Check Eat (Chow) for Human (only if discarder is Left player, idx 3)
    const isFromLeft = discarderIndex === 3;
    const eatOptions = isFromLeft ? findEatOptions(human.hand, discardedTile) : [];

    const availableClaims: AvailableClaim[] = [];

    if (humanCanHu.isHu) {
      availableClaims.push({
        type: 'hu',
        label: `胡牌 (${humanCanHu.fans}番)`,
        tiles: [],
        targetTile: discardedTile,
        priority: 10,
      });
    }

    if (clashPung) {
      availableClaims.push({
        type: 'clash_pung',
        label: `冲战碰 [${clashPung[0].name}${clashPung[1].name} 冲 ${discardedTile.name}]`,
        tiles: clashPung,
        targetTile: discardedTile,
        priority: 5, // Priority over normal pung!
      });
    }

    if (normalPung) {
      availableClaims.push({
        type: 'pung',
        label: `碰牌 [${normalPung[0].name}${normalPung[1].name}${discardedTile.name}]`,
        tiles: normalPung,
        targetTile: discardedTile,
        priority: 3,
      });
    }

    if (kongOptions.length > 0) {
      availableClaims.push({
        type: 'kong',
        label: `大明杠 [${discardedTile.name}×4]`,
        tiles: kongOptions[0],
        targetTile: discardedTile,
        priority: 4,
      });
    }

    eatOptions.forEach(opt => {
      availableClaims.push({
        type: 'eat',
        label: `吃 [${opt.kan.name}]`,
        tiles: opt.tiles,
        targetTile: discardedTile,
        priority: 1,
      });
    });

    if (availableClaims.length > 0) {
      setPendingClaim({
        targetTile: discardedTile,
        sourceIndex: discarderIndex,
        claims: availableClaims,
      });
    } else {
      // If no human claims, check if next AI plays or claims
      const nextPlayer = (discarderIndex + 1) % 4;
      setTimeout(() => {
        proceedToNextTurn(nextPlayer, currentDeck, currentWallIdx);
      }, 500);
    }
  };

  // Human Discard Handler
  const handleHumanDiscard = (tile: MahjongTileData) => {
    if (currentTurn !== 0 || gamePhase !== 'playing') return;

    playTileDiscardSound();
    triggerHaptic('light');

    const newHand = players[0].hand.filter(t => t.id !== tile.id);
    setSelectedTileId(null);

    setPlayers(prev =>
      prev.map((p, idx) => {
        if (idx === 0) {
          return {
            ...p,
            hand: newHand,
            discards: [...p.discards, tile],
            lastDrawnTile: null,
          };
        }
        return p;
      })
    );

    addLog(`你打出了【${tile.name}】`);

    // Check if any AI can Hu on this discard (捉炮)
    for (let aiIdx = 1; aiIdx < 4; aiIdx++) {
      const ai = players[aiIdx];
      const aiHu = checkHu([...ai.hand, tile], ai.melds);
      if (aiHu.isHu) {
        setTimeout(() => {
          triggerHu(aiIdx, 0, false, aiHu, [...ai.hand, tile]);
        }, 600);
        return;
      }
    }

    // Check if AI wants to Hu/Pung (Simple AI simulation)
    const nextPlayer = 1;
    setTimeout(() => {
      proceedToNextTurn(nextPlayer, deck, wallIndex);
    }, 600);
  };

  // Confirm Claim (Human clicked Chow/Pung/Hu)
  const handleConfirmClaim = (claim: AvailableClaim) => {
    if (!pendingClaim) return;
    const { targetTile, sourceIndex } = pendingClaim;

    if (claim.type === 'hu') {
      const huCheck = checkHu([...players[0].hand, targetTile], players[0].melds);
      triggerHu(0, sourceIndex, sourceIndex === 0, huCheck, [...players[0].hand, targetTile]);
      setPendingClaim(null);
      return;
    }

    playClaimSound(claim.type as 'eat' | 'pung' | 'clash_pung' | 'kong');
    triggerHaptic('medium');

    // Remove used tiles from human hand with robust matching
    const usedIds = new Set(claim.tiles.map(t => t.id));
    let remainingHand: MahjongTileData[];
    const idFiltered = players[0].hand.filter(t => !usedIds.has(t.id));
    if (idFiltered.length === players[0].hand.length - claim.tiles.length) {
      remainingHand = idFiltered;
    } else {
      // Fallback matching by name
      const namesToRemove = [...claim.tiles.map(t => t.name)];
      remainingHand = players[0].hand.filter(t => {
        const foundIdx = namesToRemove.indexOf(t.name);
        if (foundIdx !== -1) {
          namesToRemove.splice(foundIdx, 1);
          return false;
        }
        return true;
      });
    }

    // Determine meld type
    let meldType = 'triplet';
    let typeLabel = '碰';
    if (claim.type === 'clash_pung') {
      meldType = 'clash_meld';
      typeLabel = '冲战碰';
    } else if (claim.type === 'kong') {
      meldType = 'quad';
      typeLabel = '大明杠';
    } else if (claim.type === 'eat') {
      const kanCheck = checkThreeTilesKan([
        claim.tiles[0].name,
        claim.tiles[1].name,
        targetTile.name,
      ]);
      meldType = kanCheck?.type || 'stem_combine';
      typeLabel = kanCheck?.typeLabel || '吃';
    }

    const newMeld: Meld = {
      type: meldType as any,
      typeLabel,
      tiles: [...claim.tiles, targetTile],
      sourcePlayerIndex: sourceIndex,
      claimedTile: targetTile,
    };

    // If Kong, draw 1 supplemental card from the deck
    let postKongHand = remainingHand;
    let nextWallIdx = wallIndex;
    if (claim.type === 'kong' && wallIndex < deck.length) {
      const kongDrawn = deck[wallIndex];
      postKongHand = [...remainingHand, kongDrawn];
      nextWallIdx = wallIndex + 1;
      setWallIndex(nextWallIdx);
      addLog(`大明杠补牌摸得【${kongDrawn.name}】`);
    }

    // Remove claimed tile from discarder's pool and update player state
    setPlayers(prev =>
      prev.map((p, idx) => {
        if (idx === sourceIndex && idx === 0) {
          return {
            ...p,
            hand: postKongHand,
            melds: [...p.melds, newMeld],
            discards: p.discards.slice(0, p.discards.length - 1),
            lastDrawnTile: null,
          };
        }
        if (idx === sourceIndex) {
          return {
            ...p,
            discards: p.discards.slice(0, p.discards.length - 1),
          };
        }
        if (idx === 0) {
          return {
            ...p,
            hand: postKongHand,
            melds: [...p.melds, newMeld],
            lastDrawnTile: null,
          };
        }
        return p;
      })
    );

    setSelectedTileId(null);
    addLog(`你进行了【${claim.label}】！请打出一张牌。`);
    setPendingClaim(null);
    setCurrentTurn(0); // Turn jumps to claimer
  };

  const handlePassClaim = () => {
    if (!pendingClaim) return;
    const { sourceIndex } = pendingClaim;
    setPendingClaim(null);
    const nextPlayer = (sourceIndex + 1) % 4;
    proceedToNextTurn(nextPlayer, deck, wallIndex);
  };

  // Manual Hand Reordering Methods
  const handleMoveTileLeft = (tileId: string) => {
    const idx = humanPlayer.hand.findIndex(t => t.id === tileId);
    if (idx > 0) {
      playTileClickSound();
      triggerHaptic('light');
      setPlayers(prev =>
        prev.map((p, pIdx) => {
          if (pIdx !== 0) return p;
          const newHand = [...p.hand];
          const [moved] = newHand.splice(idx, 1);
          newHand.splice(idx - 1, 0, moved);
          return { ...p, hand: newHand };
        })
      );
    }
  };

  const handleMoveTileRight = (tileId: string) => {
    const idx = humanPlayer.hand.findIndex(t => t.id === tileId);
    if (idx !== -1 && idx < humanPlayer.hand.length - 1) {
      playTileClickSound();
      triggerHaptic('light');
      setPlayers(prev =>
        prev.map((p, pIdx) => {
          if (pIdx !== 0) return p;
          const newHand = [...p.hand];
          const [moved] = newHand.splice(idx, 1);
          newHand.splice(idx + 1, 0, moved);
          return { ...p, hand: newHand };
        })
      );
    }
  };

  const handleMoveTileStart = (tileId: string) => {
    const idx = humanPlayer.hand.findIndex(t => t.id === tileId);
    if (idx > 0) {
      playTileClickSound();
      triggerHaptic('medium');
      setPlayers(prev =>
        prev.map((p, pIdx) => {
          if (pIdx !== 0) return p;
          const newHand = [...p.hand];
          const [moved] = newHand.splice(idx, 1);
          newHand.unshift(moved);
          return { ...p, hand: newHand };
        })
      );
    }
  };

  const handleMoveTileEnd = (tileId: string) => {
    const idx = humanPlayer.hand.findIndex(t => t.id === tileId);
    if (idx !== -1 && idx < humanPlayer.hand.length - 1) {
      playTileClickSound();
      triggerHaptic('medium');
      setPlayers(prev =>
        prev.map((p, pIdx) => {
          if (pIdx !== 0) return p;
          const newHand = [...p.hand];
          const [moved] = newHand.splice(idx, 1);
          newHand.push(moved);
          return { ...p, hand: newHand };
        })
      );
    }
  };

  const handleDropTile = (targetIndex: number) => {
    if (draggedTileIndex === null || draggedTileIndex === targetIndex) return;
    playTileClickSound();
    triggerHaptic('light');
    setPlayers(prev =>
      prev.map((p, pIdx) => {
        if (pIdx !== 0) return p;
        const newHand = [...p.hand];
        const [moved] = newHand.splice(draggedTileIndex, 1);
        newHand.splice(targetIndex, 0, moved);
        return { ...p, hand: newHand };
      })
    );
    setDraggedTileIndex(null);
  };

  const handleAutoOrganizeHand = () => {
    playTileClickSound();
    triggerHaptic('medium');
    const grouped = autoGroupHand(humanPlayer.hand);
    const flattened: MahjongTileData[] = [
      ...grouped.slots.flatMap(s => s.tiles),
      ...grouped.unassigned,
    ];
    setPlayers(prev =>
      prev.map((p, pIdx) => (pIdx === 0 ? { ...p, hand: flattened } : p))
    );
    addLog('已自动智能理牌 (优化4砍+1将结构)');
  };

  const handleSortHandByElement = () => {
    playTileClickSound();
    triggerHaptic('light');
    setPlayers(prev =>
      prev.map((p, pIdx) => (pIdx === 0 ? { ...p, hand: sortHand(p.hand) } : p))
    );
    addLog('已按五行干支序排列手牌');
  };

  const handleSortHandByClash = () => {
    playTileClickSound();
    triggerHaptic('light');
    setPlayers(prev =>
      prev.map((p, pIdx) => (pIdx === 0 ? { ...p, hand: sortByClashPairs(p.hand) } : p))
    );
    addLog('已按冲战克制序排列手牌');
  };

  const handleApplyNewHandFromOrganizer = (newHand: MahjongTileData[]) => {
    setPlayers(prev =>
      prev.map((p, pIdx) => (pIdx === 0 ? { ...p, hand: newHand } : p))
    );
    addLog('已应用自定义手牌组合排布');
  };

  // Group human hand into chunks of 3-3-3-3-2 when grouped view is enabled
  const handGroups = useMemo(() => {
    const hand = humanPlayer.hand;
    if (!isGroupedView || hand.length === 0) return [{ label: '', tiles: hand, startIndex: 0 }];

    const groups: Array<{ label: string; tiles: MahjongTileData[]; startIndex: number }> = [];
    let cur = 0;
    const groupLabels = ['砍一', '砍二', '砍三', '砍四'];

    let groupIdx = 0;
    while (cur < hand.length) {
      if (hand.length - cur <= 2) {
        // Last 1 or 2 cards as pair
        groups.push({
          label: '将牌',
          tiles: hand.slice(cur),
          startIndex: cur,
        });
        break;
      } else {
        const chunkSize = 3;
        groups.push({
          label: groupLabels[groupIdx] || `组${groupIdx + 1}`,
          tiles: hand.slice(cur, cur + chunkSize),
          startIndex: cur,
        });
        cur += chunkSize;
        groupIdx++;
      }
    }
    return groups;
  }, [humanPlayer.hand, isGroupedView]);

  const remainingTilesCount = deck.length - wallIndex;

  return (
    <div className="relative w-full min-h-[85vh] flex flex-col items-center justify-between p-2 sm:p-4 select-none">
      
      {/* iOS App Top Bar / Stats */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-[#1A1426]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-purple-500/20 shadow-lg mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            五
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>五行麻将</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                108张
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>牌墙余: <strong className="text-purple-300 font-mono">{remainingTilesCount}</strong> 张</span>
              <span>·</span>
              <span>庄家: <strong className="text-amber-400">{players.find(p => p.isDealer)?.name.slice(0, 2)}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2">
          {onOpenMultiplayer && (
            <button
              type="button"
              onClick={onOpenMultiplayer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-900/60 to-amber-500/20 hover:from-amber-500/30 hover:to-purple-900 text-amber-300 text-xs font-bold border border-amber-500/40 shadow-sm transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>全服联机</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRules}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>规则图解</span>
          </button>

          <button
            type="button"
            onClick={onOpenHandBuilder}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>排盘算番</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-[#282038] text-slate-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Mahjong Mat (Mahjong Table) */}
      <div className="relative w-full max-w-4xl min-h-[600px] bg-gradient-to-b from-[#0F362A] via-[#09261D] to-[#051712] border-4 border-[#241C15] rounded-[2.5rem] shadow-[inset_0_4px_30px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3 sm:p-5 gap-3">
        
        {/* Table Felt Subtle Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#155E4B_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none rounded-[2.5rem]" />

        {/* 1. Opposite Player (North / 对家) */}
        <div className="w-full flex flex-col items-center z-10">
          <div className="flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
            <span className="text-sm">{players[2].avatar}</span>
            <span className="text-xs text-slate-300 font-semibold">{players[2].name}</span>
            {players[2].isDealer && <Crown className="w-3.5 h-3.5 text-amber-400" />}
            {currentTurn === 2 && (
              <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.2 rounded-full animate-pulse">
                思考中
              </span>
            )}
          </div>
          {/* Opponent face-down hand & melds */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-0.5">
              {players[2].hand.map((_, idx) => (
                <MahjongTile key={idx} size="xs" isFaceDown />
              ))}
            </div>
            {players[2].melds.length > 0 && (
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                {players[2].melds.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-0.5 bg-purple-950/60 p-0.5 rounded-lg border border-purple-600/30">
                    <span className="text-[8px] text-amber-300 -rotate-90">{m.typeLabel}</span>
                    {m.tiles.map((t, ti) => (
                      <MahjongTile key={ti} tile={t} size="xs" />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Middle Row: Left Player, Center Table (Dice/Discards), Right Player */}
        <div className="w-full flex items-center justify-between gap-2 z-10">
          
          {/* Left Player (East / 上家) */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-xs text-slate-300">
              <span>{players[3].avatar}</span>
              <span className="text-[11px]">{players[3].name.slice(0, 6)}</span>
              {currentTurn === 3 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {players[3].hand.slice(0, 10).map((_, idx) => (
                <MahjongTile key={idx} size="xs" isFaceDown isRotated />
              ))}
            </div>
            {players[3].melds.length > 0 && (
              <div className="flex flex-col gap-1 bg-black/40 p-1 rounded-lg border border-white/10 mt-1">
                {players[3].melds.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-0.5">
                    {m.tiles.map((t, ti) => (
                      <MahjongTile key={ti} tile={t} size="xs" />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center Table: Dice Box, Discards Pool, Game Status */}
          <div className="flex-1 max-w-md h-full flex flex-col items-center justify-center p-2 rounded-3xl bg-[#071C15]/70 border border-emerald-500/20 backdrop-blur-sm shadow-inner min-h-[140px]">
            
            {/* Seating / Dice Roll Phase */}
            {gamePhase === 'seat_selection' || gamePhase === 'dice_roll' ? (
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-amber-300 text-xs font-bold mb-1 flex items-center gap-1">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>庄家选座与掷骰抓牌</span>
                </div>
                <p className="text-[11px] text-slate-300 max-w-xs mb-3">
                  摸到【甲】者先做庄。两骰之和定方位，小点定起牌落数。
                </p>

                <button
                  type="button"
                  disabled={isRollingDice}
                  onClick={handleRollDiceAndDeal}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 text-sm font-black shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
                  <span>{isRollingDice ? '正在掷骰...' : '掷骰子并起牌'}</span>
                </button>
              </div>
            ) : (
              /* Discard Pool (牌河) */
              <div className="w-full flex flex-col items-center">
                <div className="text-[10px] text-emerald-400/80 font-bold mb-1 flex items-center justify-between w-full px-2">
                  <span>公共牌池 (逆时针出牌)</span>
                  <span className="text-slate-400">最新出牌高亮</span>
                </div>

                {/* Discard tiles grid */}
                <div className="flex flex-wrap items-center justify-center gap-1 max-h-32 overflow-y-auto p-1 bg-black/20 rounded-xl w-full">
                  {players.flatMap(p => p.discards).length === 0 ? (
                    <div className="text-xs text-slate-500 py-3">等待首张出牌...</div>
                  ) : (
                    players.flatMap(p => p.discards).map((t, idx, arr) => (
                      <MahjongTile
                        key={idx}
                        tile={t}
                        size="xs"
                        isHighlighted={idx === arr.length - 1}
                      />
                    ))
                  )}
                </div>

                {/* Center Dice Display */}
                <div className="mt-1 flex items-center gap-3 text-xs text-amber-300 font-mono">
                  <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    🎲 骰点: [{diceValues[0]}, {diceValues[1]}]
                  </span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[180px]">
                    {gameLogs[0]}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Right Player (West / 下家) */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-xs text-slate-300">
              <span className="text-[11px]">{players[1].name.slice(0, 6)}</span>
              <span>{players[1].avatar}</span>
              {currentTurn === 1 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {players[1].hand.slice(0, 10).map((_, idx) => (
                <MahjongTile key={idx} size="xs" isFaceDown isRotated />
              ))}
            </div>
            {players[1].melds.length > 0 && (
              <div className="flex flex-col gap-1 bg-black/40 p-1 rounded-lg border border-white/10 mt-1">
                {players[1].melds.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-0.5">
                    {m.tiles.map((t, ti) => (
                      <MahjongTile key={ti} tile={t} size="xs" />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 3. Human Player Hand & Action Controls (South / 玩家自己) */}
        <div className="w-full flex flex-col items-center z-10 pt-1">
          
          {/* Ting Suggestion Banner (听牌提醒) */}
          {tingList.length > 0 && (
            <div className="flex items-center gap-2 mb-2 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 px-3.5 py-1 rounded-full border border-amber-400/50 shadow-lg animate-pulse">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-300 font-bold">听牌中！胡：</span>
              <div className="flex items-center gap-1.5">
                {tingList.map((t, idx) => (
                  <span key={idx} className="text-xs bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black font-serif">
                    {t.tileName} ({t.fans}番)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tile Floating Action HUD */}
          {selectedTileId && (
            <div className="flex items-center gap-1.5 mb-2 bg-[#1B132B]/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-amber-400/60 shadow-2xl animate-in zoom-in-95 duration-150 z-20">
              <span className="text-[10px] text-amber-300 font-bold mr-1">
                选定【{humanPlayer.hand.find(t => t.id === selectedTileId)?.name}】：
              </span>

              {/* Move to start */}
              <button
                type="button"
                onClick={() => handleMoveTileStart(selectedTileId)}
                title="移至手牌最左侧"
                className="p-1 rounded-lg bg-purple-950/80 hover:bg-purple-800 text-purple-200 text-xs border border-purple-700/50 flex items-center gap-0.5"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">置首</span>
              </button>

              {/* Move Left */}
              <button
                type="button"
                onClick={() => handleMoveTileLeft(selectedTileId)}
                title="向左移一位"
                className="px-2 py-1 rounded-lg bg-purple-900/80 hover:bg-purple-700 text-purple-100 text-xs font-bold border border-purple-600/50 flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[10px]">左移</span>
              </button>

              {/* Move Right */}
              <button
                type="button"
                onClick={() => handleMoveTileRight(selectedTileId)}
                title="向右移一位"
                className="px-2 py-1 rounded-lg bg-purple-900/80 hover:bg-purple-700 text-purple-100 text-xs font-bold border border-purple-600/50 flex items-center gap-0.5"
              >
                <span className="text-[10px]">右移</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Move to end */}
              <button
                type="button"
                onClick={() => handleMoveTileEnd(selectedTileId)}
                title="移至手牌最右侧"
                className="p-1 rounded-lg bg-purple-950/80 hover:bg-purple-800 text-purple-200 text-xs border border-purple-700/50 flex items-center gap-0.5"
              >
                <span className="text-[10px] hidden sm:inline">置尾</span>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>

              {/* Discard if my turn */}
              {currentTurn === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const t = humanPlayer.hand.find(item => item.id === selectedTileId);
                    if (t) handleHumanDiscard(t);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-black shadow-md flex items-center gap-1 ml-1 animate-bounce"
                >
                  <span>🀄 出牌</span>
                </button>
              )}

              {/* Cancel selection */}
              <button
                type="button"
                onClick={() => setSelectedTileId(null)}
                className="p-1 text-slate-400 hover:text-white ml-1"
                title="取消选中"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Hand Tiles Rack (Hand Tiles + Declared Melds side-by-side or stacked cleanly) */}
          <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-4 max-w-full pb-2 px-1">
            
            {/* Standing Hand Tiles (Grouped View or Continuous View) */}
            <div className="flex items-end justify-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-1">
              {handGroups.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className={`flex items-end gap-1 sm:gap-1.5 ${
                    isGroupedView
                      ? 'p-1.5 rounded-2xl bg-black/40 border border-purple-500/30 relative'
                      : ''
                  }`}
                >
                  {/* Group label for grouped view */}
                  {isGroupedView && group.label && (
                    <span className="absolute -top-3 left-2 px-1.5 py-0.2 rounded-md bg-purple-950/90 text-[9px] text-amber-300 font-bold border border-purple-600/40">
                      {group.label}
                    </span>
                  )}

                  {group.tiles.map((tile, tIdx) => {
                    const globalIdx = group.startIndex + tIdx;
                    const isLastDrawn = tile.id === humanPlayer.lastDrawnTile?.id;
                    const isSelected = selectedTileId === tile.id;

                    return (
                      <div
                        key={tile.id || globalIdx}
                        draggable
                        onDragStart={() => setDraggedTileIndex(globalIdx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          handleDropTile(globalIdx);
                        }}
                        className="relative group cursor-grab active:cursor-grabbing"
                      >
                        <MahjongTile
                          tile={tile}
                          size="md"
                          isSelected={isSelected}
                          isLastDrawn={isLastDrawn}
                          onClick={() => {
                            playTileClickSound();
                            if (selectedTileId === tile.id) {
                              // If it's your turn, second tap discards
                              if (currentTurn === 0) {
                                handleHumanDiscard(tile);
                              }
                            } else {
                              setSelectedTileId(tile.id);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Declared Melds (副露：碰/吃/冲战碰) Row */}
            {humanPlayer.melds.length > 0 && (
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 border border-amber-500/40 shadow-inner">
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[10px] text-amber-300 font-bold">已亮</span>
                  <span className="text-[9px] text-purple-300">砍牌</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {humanPlayer.melds.map((m, mi) => (
                    <div key={mi} className="flex items-center gap-0.5 bg-[#22153B] p-1 rounded-xl border border-purple-500/50 shadow-md">
                      <span className="text-[9px] text-amber-300 font-bold -rotate-90 mr-0.5 whitespace-nowrap">
                        {m.typeLabel}
                      </span>
                      {m.tiles.map((t, ti) => (
                        <MahjongTile key={ti} tile={t} size="xs" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Hand Organization Action Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 pt-1.5 border-t border-purple-500/20 w-full max-w-xl px-2">
            
            {/* Hu Declaration & Audit Studio Button */}
            <button
              type="button"
              onClick={() => handleOpenHuAudit()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 text-xs font-black shadow-lg shadow-amber-500/30 border border-amber-300 transition-transform active:scale-95 animate-pulse"
              title="申报胡牌：系统智能诊断审核或手动4砍1将排盘自证"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>申报胡牌审核</span>
            </button>

            {/* Open Hand Organizer Modal */}
            <button
              type="button"
              onClick={() => setIsOrganizerOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-md border border-purple-400/40 transition-transform active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>调整手牌组合</span>
            </button>

            {/* Smart Auto Organize */}
            <button
              type="button"
              onClick={handleAutoOrganizeHand}
              title="智能排盘：优化4砍+1将组合"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>智能理牌</span>
            </button>

            {/* Toggle Grouped vs Continuous view */}
            <button
              type="button"
              onClick={() => {
                setIsGroupedView(!isGroupedView);
                playTileClickSound();
                triggerHaptic('light');
              }}
              title={isGroupedView ? '切换为连续排列' : '切换为分组合并展示 (3-3-3-3-2)'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isGroupedView
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                  : 'bg-[#282038] hover:bg-[#342A4A] border-purple-500/30 text-purple-300'
              }`}
            >
              {isGroupedView ? <LayoutGrid className="w-3 h-3" /> : <Rows className="w-3 h-3" />}
              <span>{isGroupedView ? '分组展示' : '连续展示'}</span>
            </button>

            {/* Sort by Element */}
            <button
              type="button"
              onClick={handleSortHandByElement}
              title="按五行与天干地支顺序排序"
              className="px-2 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              五行序
            </button>

            {/* Sort by Clash */}
            <button
              type="button"
              onClick={handleSortHandByClash}
              title="按冲战与对冲组合排序"
              className="px-2 py-1.5 rounded-xl bg-[#282038] hover:bg-[#342A4A] text-rose-300 hover:text-rose-200 text-xs font-medium border border-rose-500/30 transition-colors flex items-center gap-0.5"
            >
              <Flame className="w-2.5 h-2.5" />
              <span>冲战序</span>
            </button>

          </div>

          {/* Player status label */}
          <div className="flex items-center justify-between w-full px-4 text-xs text-slate-300 mt-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">{humanPlayer.name}</span>
              <span className="font-mono bg-purple-900/60 px-2 py-0.5 rounded-full text-purple-200 border border-purple-500/30">
                {humanPlayer.score} 分
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              {currentTurn === 0 ? (
                <span className="text-amber-400 font-bold animate-pulse">👉 轮到你的回合，请点击选牌并打出</span>
              ) : (
                <span>等待对手出牌... 可随时拖拽/理牌调整组合</span>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Claim Dialog Popup (吃/碰/冲战碰/胡/过) */}
      {pendingClaim && (
        <ClaimDialog
          availableClaims={pendingClaim.claims}
          targetTile={pendingClaim.targetTile}
          onConfirmClaim={handleConfirmClaim}
          onPass={handlePassClaim}
          onOpenAudit={() => handleOpenHuAudit(pendingClaim.targetTile, pendingClaim.sourceIndex)}
        />
      )}

      {/* Hu Audit & Verification Console (胡牌申报审核台) */}
      <HuAuditModal
        isOpen={isHuAuditOpen}
        onClose={() => setIsHuAuditOpen(false)}
        hand={humanPlayer.hand}
        melds={humanPlayer.melds}
        claimDiscardTile={auditClaimTile}
        claimDiscarderIndex={auditClaimDiscarderIdx}
        isTianHu={false}
        isGangShangKaiHua={false}
        onConfirmHu={handleConfirmHuFromAudit}
      />

      {/* Hand Organizer Modal (手牌组合调整工作台) */}
      <HandOrganizerModal
        isOpen={isOrganizerOpen}
        hand={humanPlayer.hand}
        onClose={() => setIsOrganizerOpen(false)}
        onApplyNewHand={handleApplyNewHandFromOrganizer}
      />

      {/* Hu Celebration Modal */}
      {huModalState && (
        <HuCelebrationModal
          isOpen={huModalState.isOpen}
          winner={huModalState.winner}
          loser={huModalState.loser}
          isSelfDraw={huModalState.isSelfDraw}
          huResult={huModalState.huResult}
          allTiles={huModalState.allTiles}
          onNextRound={() => {
            setHuModalState(null);
            handleRollDiceAndDeal();
          }}
          onRestartGame={() => {
            setHuModalState(null);
            startSeatSelection();
          }}
        />
      )}

    </div>
  );
};
