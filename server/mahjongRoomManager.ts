import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  MahjongTileData,
  Meld,
  MeldType,
  HuResult,
  AvailableClaim,
} from '../src/types/mahjong';
import {
  OnlinePlayer,
  RoomSettings,
  RoomStatus,
  MultiplayerGameState,
  ChatMessage,
  DiscardEventData,
  RoomListItem,
} from '../src/types/multiplayer';
import {
  createDeck,
  findEatOptions,
  findPungOptions,
  findKongOptions,
  checkHu,
  sortHand,
} from '../src/utils/mahjongRules';

interface PendingClaimSubmission {
  seatIndex: number;
  claim: AvailableClaim | null; // null means passed
}

export class MahjongRoom {
  roomId: string;
  roomName: string;
  hostUserId: string;
  status: RoomStatus = 'waiting';
  settings: RoomSettings;
  
  players: (OnlinePlayer | null)[] = [null, null, null, null];
  spectators: { socketId: string; userId: string; name: string }[] = [];

  deck: MahjongTileData[] = [];
  wallIndex: number = 0;
  currentTurn: number = 0; // 0, 1, 2, 3
  dealerIndex: number = 0;
  roundNumber: number = 1;
  diceRoll: [number, number] = [1, 1];

  lastDiscard: DiscardEventData | null = null;
  pendingClaimsMap: Map<number, AvailableClaim[]> = new Map(); // seatIndex -> available claims
  pendingSubmissions: Map<number, AvailableClaim | null> = new Map(); // seatIndex -> submitted action
  claimTimer: NodeJS.Timeout | null = null;
  turnTimer: NodeJS.Timeout | null = null;
  botTimer: NodeJS.Timeout | null = null;

  turnDeadline: number = 0;
  claimDeadline: number = 0;

  winnerData: MultiplayerGameState['winnerData'] = null;
  chatMessages: ChatMessage[] = [];

  constructor(roomId: string, roomName: string, hostUserId: string, settings?: Partial<RoomSettings>) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.hostUserId = hostUserId;
    this.settings = {
      turnTimeLimit: settings?.turnTimeLimit || 20,
      autoFillBots: settings?.autoFillBots ?? true,
      isPrivate: settings?.isPrivate ?? false,
      password: settings?.password || '',
      roundsCount: settings?.roundsCount || 1,
    };
  }

  get summary(): RoomListItem {
    const activeCount = this.players.filter(p => p !== null).length;
    const hostPlayer = this.players.find(p => p?.isHost);
    return {
      roomId: this.roomId,
      name: this.roomName,
      hostName: hostPlayer?.name || '房主',
      playerCount: activeCount,
      status: this.status,
      isPrivate: this.settings.isPrivate,
      settings: this.settings,
    };
  }

  // Get state customized for a specific player (hand hidden for opponents)
  getClientState(userId?: string): MultiplayerGameState {
    const maskedPlayers = this.players.map(p => {
      if (!p) return null;
      const isMe = userId && p.userId === userId;
      return {
        ...p,
        hand: isMe || this.status === 'round_end' ? p.hand : undefined,
        handCount: p.hand ? p.hand.length : 0,
      };
    });

    return {
      roomId: this.roomId,
      roomName: this.roomName,
      hostId: this.hostUserId,
      status: this.status,
      settings: this.settings,
      players: maskedPlayers,
      currentTurn: this.currentTurn,
      dealerIndex: this.dealerIndex,
      wallRemaining: Math.max(0, this.deck.length - this.wallIndex),
      lastDiscard: this.lastDiscard,
      turnDeadline: this.turnDeadline,
      claimWindowDeadline: this.claimDeadline,
      winnerData: this.winnerData,
      roundNumber: this.roundNumber,
      diceRoll: this.diceRoll,
    };
  }

  // Add a player into an open seat
  addPlayer(socketId: string, userId: string, name: string, avatar: string): { success: boolean; seatIndex?: number; message?: string } {
    // Check if user is reconnecting
    const existingIndex = this.players.findIndex(p => p && p.userId === userId);
    if (existingIndex !== -1) {
      const p = this.players[existingIndex]!;
      p.id = socketId;
      p.isConnected = true;
      p.name = name || p.name;
      p.avatar = avatar || p.avatar;
      return { success: true, seatIndex: existingIndex };
    }

    // If game in progress, can only join as spectator
    if (this.status !== 'waiting') {
      this.spectators.push({ socketId, userId, name });
      return { success: true, message: 'Joined as spectator' };
    }

    // Find first empty seat
    const emptyIndex = this.players.findIndex(p => p === null);
    if (emptyIndex === -1) {
      this.spectators.push({ socketId, userId, name });
      return { success: false, message: '房间座位已满，已转为观战' };
    }

    const isFirst = this.players.every(p => p === null);
    const isHost = isFirst || this.hostUserId === userId;
    if (isFirst) {
      this.hostUserId = userId;
    }

    this.players[emptyIndex] = {
      id: socketId,
      userId,
      name: name || `牌友_${userId.slice(0, 4)}`,
      avatar: avatar || '🀄',
      seatIndex: emptyIndex,
      isHost,
      isReady: isHost, // Host is ready by default
      isBot: false,
      isConnected: true,
      score: 1000,
      handCount: 0,
      hand: [],
      melds: [],
      discards: [],
      lastDrawnTile: null,
    };

    return { success: true, seatIndex: emptyIndex };
  }

  // Remove player or disconnect
  handleDisconnect(socketId: string): void {
    const player = this.players.find(p => p?.id === socketId);
    if (player) {
      player.isConnected = false;
      if (this.status === 'waiting') {
        // In waiting room, if disconnected, remove seat or assign host to next
        const seatIdx = player.seatIndex;
        const wasHost = player.isHost;
        this.players[seatIdx] = null;
        if (wasHost) {
          const nextPlayer = this.players.find(p => p !== null && !p.isBot);
          if (nextPlayer) {
            nextPlayer.isHost = true;
            this.hostUserId = nextPlayer.userId;
          }
        }
      }
    }
    this.spectators = this.spectators.filter(s => s.socketId !== socketId);
  }

  // Add an AI bot to a seat
  addBot(seatIndex: number): boolean {
    if (this.status !== 'waiting') return false;
    if (seatIndex < 0 || seatIndex > 3 || this.players[seatIndex] !== null) return false;

    const botNames = ['青龙·木神', '朱雀·火仙', '白虎·金尊', '玄武·水圣', '麒麟·土皇'];
    const botAvatars = ['🐉', '🦅', '🐅', '🐢', '🦄'];
    const randomIdx = Math.floor(Math.random() * botNames.length);

    this.players[seatIndex] = {
      id: `bot_${Date.now()}_${seatIndex}`,
      userId: `bot_${seatIndex}`,
      name: botNames[randomIdx] || `AI道长_${seatIndex + 1}`,
      avatar: botAvatars[randomIdx] || '🤖',
      seatIndex,
      isHost: false,
      isReady: true,
      isBot: true,
      isConnected: true,
      score: 1000,
      handCount: 0,
      hand: [],
      melds: [],
      discards: [],
      lastDrawnTile: null,
    };
    return true;
  }

  // Remove a player / bot from seat (host action)
  kickSeat(seatIndex: number): boolean {
    if (this.status !== 'waiting') return false;
    if (seatIndex >= 0 && seatIndex <= 3) {
      this.players[seatIndex] = null;
      return true;
    }
    return false;
  }

  // Toggle ready status
  setReady(userId: string, isReady: boolean): boolean {
    const player = this.players.find(p => p?.userId === userId);
    if (!player) return false;
    player.isReady = isReady;
    return true;
  }

  // Start the game
  startGame(io: SocketIOServer): boolean {
    if (this.status === 'playing') return false;

    // Fill remaining empty seats with bots if configured
    if (this.settings.autoFillBots) {
      for (let i = 0; i < 4; i++) {
        if (this.players[i] === null) {
          this.addBot(i);
        }
      }
    }

    const readyPlayers = this.players.filter(p => p !== null);
    if (readyPlayers.length < 2) return false;

    // Initialize Mahjong Deck & Deal
    this.deck = createDeck();
    this.wallIndex = 0;
    this.status = 'playing';
    this.winnerData = null;
    this.lastDiscard = null;
    this.pendingClaimsMap.clear();
    this.pendingSubmissions.clear();

    // Roll dice
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    this.diceRoll = [d1, d2];
    this.dealerIndex = (d1 + d2) % 4;
    this.currentTurn = this.dealerIndex;

    // Deal 13 tiles to everyone, 14 to dealer
    for (let i = 0; i < 4; i++) {
      const p = this.players[i];
      if (p) {
        p.melds = [];
        p.discards = [];
        p.lastDrawnTile = null;

        const tileCount = i === this.dealerIndex ? 14 : 13;
        const dealt = this.deck.slice(this.wallIndex, this.wallIndex + tileCount);
        this.wallIndex += tileCount;
        p.hand = sortHand(dealt);
        p.handCount = p.hand.length;

        if (i === this.dealerIndex) {
          p.lastDrawnTile = dealt[dealt.length - 1];
        }
      }
    }

    this.broadcastState(io);
    this.addSystemMessage(io, `🎮 对局开始！东家庄位：【${this.players[this.dealerIndex]?.name}】，掷骰【${d1}+${d2}点】`);

    // Start turn for dealer
    this.scheduleTurnTimer(io);

    // If dealer is bot, schedule bot action
    const currentP = this.players[this.currentTurn];
    if (currentP && currentP.isBot) {
      this.scheduleBotTurn(io);
    }

    return true;
  }

  // Handle a player's discard
  playerDiscard(io: SocketIOServer, userId: string, tileId: string): boolean {
    if (this.status !== 'playing') return false;

    const player = this.players[this.currentTurn];
    if (!player || player.userId !== userId) return false;
    if (!player.hand || player.hand.length === 0) return false;

    const tileIdx = player.hand.findIndex(t => t.id === tileId);
    if (tileIdx === -1) return false;

    const [discardedTile] = player.hand.splice(tileIdx, 1);
    player.discards.push(discardedTile);
    player.lastDrawnTile = null;
    player.handCount = player.hand.length;

    this.clearTurnTimer();
    this.lastDiscard = {
      playerIndex: this.currentTurn,
      tile: discardedTile,
      timestamp: Date.now(),
    };

    this.addSystemMessage(io, `【${player.name}】 打出了 【${discardedTile.name}】(${discardedTile.elementName})`);

    // Check available claims for other active players
    this.checkClaimsForDiscard(io, discardedTile, this.currentTurn);
    return true;
  }

  // Check claims for all players on discarded tile
  private checkClaimsForDiscard(io: SocketIOServer, discardedTile: MahjongTileData, discarderIdx: number): void {
    this.pendingClaimsMap.clear();
    this.pendingSubmissions.clear();

    const nextSeat = (discarderIdx + 1) % 4;

    for (let i = 0; i < 4; i++) {
      if (i === discarderIdx) continue;
      const player = this.players[i];
      if (!player || !player.hand || player.hand.length === 0) continue;

      const claims: AvailableClaim[] = [];

      // 1. Check Hu (捉炮胡)
      const testHand = [...player.hand, discardedTile];
      const huCheck = checkHu(testHand, player.melds, false, false);
      if (huCheck.isHu) {
        claims.push({
          type: 'hu',
          label: `捉炮胡牌 (${huCheck.fans}番 ${huCheck.explanation})`,
          tiles: [discardedTile],
          targetTile: discardedTile,
          priority: 100,
        });
      }

      // 2. Check Pung & Clash Pung
      const { normalPung, clashPung } = findPungOptions(player.hand, discardedTile);
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

      // 3. Check Kong
      const kongOptions = findKongOptions(player.hand, discardedTile);
      if (kongOptions.length > 0) {
        claims.push({
          type: 'kong',
          label: `大明杠 (${discardedTile.name}*4)`,
          tiles: kongOptions[0],
          targetTile: discardedTile,
          priority: 60,
        });
      }

      // 4. Check Eat (Chow) - only for immediate next player (下家)
      if (i === nextSeat) {
        const eatOptions = findEatOptions(player.hand, discardedTile);
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

      if (claims.length > 0) {
        this.pendingClaimsMap.set(i, claims);
      }
    }

    if (this.pendingClaimsMap.size > 0) {
      // Open claim window (10 seconds)
      const claimDuration = 10000;
      this.claimDeadline = Date.now() + claimDuration;

      // Broadcast state with claim requests to relevant players
      this.broadcastState(io);

      // Trigger bot claim decisions automatically
      this.pendingClaimsMap.forEach((claims, seatIdx) => {
        const p = this.players[seatIdx];
        if (p && p.isBot) {
          this.handleBotClaimDecision(io, seatIdx, claims);
        }
      });

      // Start timer
      this.claimTimer = setTimeout(() => {
        this.resolvePendingClaims(io);
      }, claimDuration);
    } else {
      // No claims possible, advance turn to next player
      this.advanceToNextTurn(io, nextSeat);
    }
  }

  // Handle a player's claim action submission
  submitClaimAction(io: SocketIOServer, userId: string, claim: AvailableClaim | null): boolean {
    const player = this.players.find(p => p?.userId === userId);
    if (!player) return false;

    const seatIdx = player.seatIndex;
    if (!this.pendingClaimsMap.has(seatIdx)) return false;

    this.pendingSubmissions.set(seatIdx, claim);

    // If all required players submitted their choices, resolve immediately
    if (this.pendingSubmissions.size >= this.pendingClaimsMap.size) {
      this.resolvePendingClaims(io);
    }
    return true;
  }

  // Bot claim decision logic
  private handleBotClaimDecision(io: SocketIOServer, seatIdx: number, claims: AvailableClaim[]): void {
    setTimeout(() => {
      // Bot prefers: Hu > Clash Pung > Kong > Pung > Eat (with 70% probability for eats)
      const hu = claims.find(c => c.type === 'hu');
      if (hu) {
        this.pendingSubmissions.set(seatIdx, hu);
      } else {
        const clash = claims.find(c => c.type === 'clash_pung');
        if (clash) {
          this.pendingSubmissions.set(seatIdx, clash);
        } else {
          const kong = claims.find(c => c.type === 'kong');
          if (kong) {
            this.pendingSubmissions.set(seatIdx, kong);
          } else {
            const pung = claims.find(c => c.type === 'pung');
            if (pung) {
              this.pendingSubmissions.set(seatIdx, pung);
            } else {
              const eat = claims.find(c => c.type === 'eat');
              if (eat && Math.random() > 0.3) {
                this.pendingSubmissions.set(seatIdx, eat);
              } else {
                this.pendingSubmissions.set(seatIdx, null); // Pass
              }
            }
          }
        }
      }

      if (this.pendingSubmissions.size >= this.pendingClaimsMap.size) {
        this.resolvePendingClaims(io);
      }
    }, 1200 + Math.random() * 800);
  }

  // Resolve all collected claim choices by Mahjong priority
  private resolvePendingClaims(io: SocketIOServer): void {
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }
    this.claimDeadline = 0;

    let winningClaim: { seatIdx: number; claim: AvailableClaim } | null = null;

    // Filter valid positive claims
    const activeSubmissions: Array<{ seatIdx: number; claim: AvailableClaim }> = [];
    this.pendingSubmissions.forEach((claim, seatIdx) => {
      if (claim) {
        activeSubmissions.push({ seatIdx, claim });
      }
    });

    if (activeSubmissions.length > 0) {
      // Sort by priority descending
      activeSubmissions.sort((a, b) => b.claim.priority - a.claim.priority);
      winningClaim = activeSubmissions[0];
    }

    this.pendingClaimsMap.clear();
    this.pendingSubmissions.clear();

    if (winningClaim) {
      this.executeClaim(io, winningClaim.seatIdx, winningClaim.claim);
    } else {
      // All passed, proceed to next player's draw
      const nextSeat = ((this.lastDiscard?.playerIndex ?? this.currentTurn) + 1) % 4;
      this.advanceToNextTurn(io, nextSeat);
    }
  }

  // Execute the winning claim (Eat/Pung/Clash/Kong/Hu)
  private executeClaim(io: SocketIOServer, claimantSeatIdx: number, claim: AvailableClaim): void {
    const claimant = this.players[claimantSeatIdx];
    if (!claimant || !this.lastDiscard) return;

    const discarderSeatIdx = this.lastDiscard.playerIndex;
    const discarder = this.players[discarderSeatIdx];
    const claimedTile = this.lastDiscard.tile;

    // Remove tile from discarder's discards
    if (discarder) {
      let discIdx = -1;
      for (let d = discarder.discards.length - 1; d >= 0; d--) {
        if (discarder.discards[d].id === claimedTile.id) {
          discIdx = d;
          break;
        }
      }
      if (discIdx !== -1) {
        discarder.discards.splice(discIdx, 1);
      }
    }

    if (claim.type === 'hu') {
      // Trigger Ron Hu
      const winningTiles = [...claimant.hand, claimedTile];
      const huResult = checkHu(winningTiles, claimant.melds, false, false);

      this.triggerRoundEnd(io, {
        winnerIndex: claimantSeatIdx,
        winnerName: claimant.name,
        isSelfDraw: false,
        discarderIndex: discarderSeatIdx,
        huResult,
        winningTiles,
      });
      return;
    }

    // Eat, Pung, Clash Pung, Kong
    // Remove matching tiles from claimant's hand
    const usedTileIds = new Set(claim.tiles.map(t => t.id));
    claimant.hand = claimant.hand.filter(t => !usedTileIds.has(t.id));

    let meldType: MeldType = 'triplet';
    if (claim.type === 'clash_pung') meldType = 'clash_meld';
    else if (claim.type === 'kong') meldType = 'kong';
    else if (claim.type === 'eat') {
      // Find matching kan type
      meldType = 'five_elements_generation';
    }

    const fullMeldTiles = [...claim.tiles, claimedTile];
    const meld: Meld = {
      type: meldType,
      typeLabel: claim.label,
      tiles: fullMeldTiles,
      sourcePlayerIndex: discarderSeatIdx,
      claimedTile,
    };

    claimant.melds.push(meld);
    claimant.handCount = claimant.hand.length;

    this.addSystemMessage(io, `⚡【${claimant.name}】 执行了 【${claim.label}】！`);

    // Turn moves to claimant, they now need to discard (unless kong, then draw kong replacement)
    this.currentTurn = claimantSeatIdx;
    this.lastDiscard = null;

    if (claim.type === 'kong') {
      this.drawKongTile(io, claimantSeatIdx);
    } else {
      this.broadcastState(io);
      this.scheduleTurnTimer(io);
      if (claimant.isBot) {
        this.scheduleBotTurn(io);
      }
    }
  }

  // Draw tile for player whose turn it is
  private advanceToNextTurn(io: SocketIOServer, nextSeatIdx: number): void {
    // Check if wall is exhausted
    if (this.wallIndex >= this.deck.length) {
      this.triggerRoundEnd(io, null); // Huang Zhuang (荒庄/流局)
      return;
    }

    this.currentTurn = nextSeatIdx;
    const player = this.players[nextSeatIdx];
    if (!player) return;

    // Draw one tile from wall
    const drawnTile = this.deck[this.wallIndex++];
    player.hand.push(drawnTile);
    player.lastDrawnTile = drawnTile;
    player.handCount = player.hand.length;

    this.broadcastState(io);
    this.scheduleTurnTimer(io);

    if (player.isBot) {
      this.scheduleBotTurn(io);
    }
  }

  // Draw replacement tile for Kong
  private drawKongTile(io: SocketIOServer, seatIdx: number): void {
    if (this.wallIndex >= this.deck.length) {
      this.triggerRoundEnd(io, null);
      return;
    }

    const player = this.players[seatIdx];
    if (!player) return;

    const drawnTile = this.deck[this.wallIndex++];
    player.hand.push(drawnTile);
    player.lastDrawnTile = drawnTile;
    player.handCount = player.hand.length;

    this.addSystemMessage(io, `🀄【${player.name}】 杠后补得一张牌！`);

    this.broadcastState(io);
    this.scheduleTurnTimer(io);

    if (player.isBot) {
      this.scheduleBotTurn(io);
    }
  }

  // Player Self-Draw Hu (自摸胡牌)
  playerSelfDrawHu(io: SocketIOServer, userId: string): boolean {
    if (this.status !== 'playing') return false;

    const player = this.players[this.currentTurn];
    if (!player || player.userId !== userId) return false;

    const huResult = checkHu(player.hand, player.melds, false, false);
    if (!huResult.isHu) return false;

    this.triggerRoundEnd(io, {
      winnerIndex: this.currentTurn,
      winnerName: player.name,
      isSelfDraw: true,
      huResult,
      winningTiles: player.hand,
    });
    return true;
  }

  // End round with settlement
  private triggerRoundEnd(io: SocketIOServer, winnerData: MultiplayerGameState['winnerData']): void {
    this.clearTurnTimer();
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }

    this.status = 'round_end';
    this.winnerData = winnerData;

    if (winnerData) {
      const winner = this.players[winnerData.winnerIndex];
      const winPoints = winnerData.huResult.fans * 100;

      if (winnerData.isSelfDraw) {
        // All other 3 players pay winPoints
        this.players.forEach((p, idx) => {
          if (p && idx !== winnerData.winnerIndex) {
            p.score -= winPoints;
          }
        });
        if (winner) winner.score += winPoints * 3;
        this.addSystemMessage(io, `🏆 恭喜【${winnerData.winnerName}】自摸胡牌！${winnerData.huResult.fans}番，各家付 ${winPoints} 分！`);
      } else {
        // Discarder pays winPoints
        const discarder = this.players[winnerData.discarderIndex!];
        if (discarder) discarder.score -= winPoints;
        if (winner) winner.score += winPoints;
        this.addSystemMessage(io, `🏆 恭喜【${winnerData.winnerName}】捉炮胡牌！${winnerData.huResult.fans}番，【${discarder?.name}】放铳付 ${winPoints} 分！`);
      }
    } else {
      this.addSystemMessage(io, `💨 牌墙摸尽，本局荒庄（流局）！各家积分不变。`);
    }

    this.broadcastState(io);
  }

  // Bot Turn Automation (Simulate smart discard or self-draw Hu)
  private scheduleBotTurn(io: SocketIOServer): void {
    if (this.botTimer) clearTimeout(this.botTimer);

    this.botTimer = setTimeout(() => {
      if (this.status !== 'playing') return;
      const bot = this.players[this.currentTurn];
      if (!bot || !bot.isBot || bot.hand.length === 0) return;

      // 1. Check if bot can Self-Draw Hu
      const huCheck = checkHu(bot.hand, bot.melds, false, false);
      if (huCheck.isHu) {
        this.playerSelfDrawHu(io, bot.userId);
        return;
      }

      // 2. Select discard tile (discard lone tile or worst synergistic tile)
      const tileToDiscard = bot.hand[Math.floor(Math.random() * bot.hand.length)];
      this.playerDiscard(io, bot.userId, tileToDiscard.id);
    }, 1500 + Math.random() * 1000);
  }

  // Turn Countdown Timer
  private scheduleTurnTimer(io: SocketIOServer): void {
    this.clearTurnTimer();
    const limitMs = (this.settings.turnTimeLimit || 20) * 1000;
    this.turnDeadline = Date.now() + limitMs;

    this.turnTimer = setTimeout(() => {
      // Auto discard last drawn tile or first tile if turn times out
      const player = this.players[this.currentTurn];
      if (player && player.hand && player.hand.length > 0) {
        const autoTile = player.lastDrawnTile || player.hand[player.hand.length - 1];
        this.addSystemMessage(io, `⏱️ 【${player.name}】 出牌超时，系统自动打出 【${autoTile.name}】`);
        this.playerDiscard(io, player.userId, autoTile.id);
      }
    }, limitMs);
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  // Chat message
  addChatMessage(io: SocketIOServer, msg: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `chat_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    this.chatMessages.push(fullMsg);
    if (this.chatMessages.length > 100) this.chatMessages.shift();
    io.to(this.roomId).emit('room:chat_message', fullMsg);
  }

  private addSystemMessage(io: SocketIOServer, text: string): void {
    this.addChatMessage(io, {
      senderId: 'system',
      senderName: '系统公告',
      avatar: '📢',
      text,
      isSystem: true,
    });
  }

  // Broadcast state to each socket in room
  broadcastState(io: SocketIOServer): void {
    // Send customized view to each seated player
    this.players.forEach(player => {
      if (player && !player.isBot && player.isConnected) {
        const state = this.getClientState(player.userId);
        io.to(player.id).emit('room:game_state', state);
      }
    });

    // Send spectator view to room channel
    const publicState = this.getClientState();
    this.spectators.forEach(spec => {
      io.to(spec.socketId).emit('room:game_state', publicState);
    });
  }
}

// Global Rooms Repository
export class MahjongRoomManager {
  private rooms: Map<string, MahjongRoom> = new Map();

  createRoom(hostUserId: string, hostName: string, roomName?: string, settings?: Partial<RoomSettings>): MahjongRoom {
    const roomId = String(Math.floor(100000 + Math.random() * 900000));
    const name = roomName || `五行${roomId.slice(-4)}号台`;
    const room = new MahjongRoom(roomId, name, hostUserId, settings);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): MahjongRoom | undefined {
    return this.rooms.get(roomId);
  }

  getPublicRooms(): RoomListItem[] {
    return Array.from(this.rooms.values())
      .filter(r => !r.settings.isPrivate)
      .map(r => r.summary);
  }

  findQuickMatch(): MahjongRoom | undefined {
    return Array.from(this.rooms.values()).find(
      r => r.status === 'waiting' && !r.settings.isPrivate && r.players.some(p => p === null)
    );
  }

  cleanupEmptyRooms(): void {
    this.rooms.forEach((room, id) => {
      const activeCount = room.players.filter(p => p !== null && !p.isBot && p.isConnected).length;
      if (activeCount === 0 && room.status === 'waiting') {
        this.rooms.delete(id);
      }
    });
  }
}

export const roomManager = new MahjongRoomManager();
