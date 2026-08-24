import { MahjongTileData, Meld, HuResult, AvailableClaim } from './mahjong';

export interface OnlinePlayer {
  id: string; // socket.id or persistent uuid
  userId: string;
  name: string;
  avatar: string;
  seatIndex: number; // 0: 东(East), 1: 南(South), 2: 西(West), 3: 北(North)
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  isConnected: boolean;
  score: number;
  handCount: number; // For other players, just count
  hand?: MahjongTileData[]; // Only provided to self
  melds: Meld[];
  discards: MahjongTileData[];
  lastDrawnTile?: MahjongTileData | null;
}

export type RoomStatus = 'waiting' | 'playing' | 'round_end';

export interface RoomSettings {
  turnTimeLimit: number; // in seconds: 15, 25, 45
  autoFillBots: boolean; // Auto fill with AI if not enough players
  isPrivate: boolean;
  password?: string;
  roundsCount: number; // 1, 4 (one round of 4 winds)
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  type?: 'text' | 'emoji' | 'shout';
}

export interface DiscardEventData {
  playerIndex: number;
  tile: MahjongTileData;
  timestamp: number;
}

export interface ClaimOption {
  type: 'eat' | 'pung' | 'clash_pung' | 'kong' | 'hu' | 'pass';
  label: string;
  tiles: MahjongTileData[];
  targetTile: MahjongTileData;
  priority: number;
}

export interface MultiplayerGameState {
  roomId: string;
  roomName: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: (OnlinePlayer | null)[];
  currentTurn: number; // seatIndex (0..3)
  dealerIndex: number;
  wallRemaining: number;
  lastDiscard?: DiscardEventData | null;
  turnDeadline?: number; // timestamp when current turn expires
  claimWindowDeadline?: number; // timestamp when pending claims expire
  winnerData?: {
    winnerIndex: number;
    winnerName: string;
    isSelfDraw: boolean;
    discarderIndex?: number;
    huResult: HuResult;
    winningTiles: MahjongTileData[];
  } | null;
  roundNumber: number;
  diceRoll?: [number, number];
}

export interface RoomListItem {
  roomId: string;
  name: string;
  hostName: string;
  playerCount: number;
  status: RoomStatus;
  isPrivate: boolean;
  settings: RoomSettings;
}
