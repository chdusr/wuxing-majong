export type ElementType = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export type TileCategory = 'element' | 'stem' | 'branch';

export interface MahjongTileData {
  id: string; // unique instance ID e.g. "甲_0"
  name: string; // display char e.g. "甲", "木", "寅"
  category: TileCategory;
  element: ElementType;
  elementName: string; // '木', '火', '土', '金', '水'
  yinYang?: 'yang' | 'yin';
}

export type MeldType =
  | 'triplet' // 三同字刻子 (e.g. 甲甲甲)
  | 'five_elements_generation' // 五行相生 (金水木, 水木火, 木火土, 火土金, 土金水)
  | 'stem_combine' // 天干五合 (甲己土, 乙庚金, 丙辛水, 丁壬木, 戊癸火)
  | 'branch_six_combine' // 地支六合 (巳申水, 卯戌火, 寅亥木, 午未土, 辰酉金, 子丑土)
  | 'branch_three_harmony' // 地支三合 (寅午戌, 亥卯未, 申子辰, 巳酉丑)
  | 'branch_three_meet' // 地支三会 (巳午未, 申酉戌, 亥子丑, 寅卯辰)
  | 'branch_three_penalty' // 地支三刑 (寅巳申, 丑未戌)
  | 'clash_meld' // 冲战砍 (e.g. 庚庚甲, 辛辛乙, 水水火, 子子午...)
  | 'kong'; // 杠 (4 identical)

export interface Meld {
  type: MeldType;
  typeLabel: string;
  tiles: MahjongTileData[];
  sourcePlayerIndex?: number; // who discarded the claimed tile (if claimed)
  claimedTile?: MahjongTileData;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHuman: boolean;
  position: 'self' | 'right' | 'opposite' | 'left'; // Down(Self), Right(Xiajia), Up(Duijia), Left(Shangjia)
  hand: MahjongTileData[];
  melds: Meld[]; // Claimed chows/pungs/kongs
  discards: MahjongTileData[];
  isDealer: boolean;
  score: number;
  lastDrawnTile?: MahjongTileData | null;
}

export interface HuResult {
  isHu: boolean;
  isSevenPairs?: boolean;
  fans: number;
  fanDetails: string[];
  pair?: MahjongTileData[];
  kans?: MahjongTileData[][];
  explanation: string;
}

export type ClaimType = 'eat' | 'pung' | 'clash_pung' | 'kong' | 'hu' | 'pass';

export interface AvailableClaim {
  type: ClaimType;
  label: string;
  tiles: MahjongTileData[]; // cards in hand used for this action
  targetTile: MahjongTileData; // the discarded card
  priority: number; // For clash pung priority over normal pung
}

export type GamePhase =
  | 'seat_selection' // 摸甲乙丙丁定庄
  | 'dice_roll' // 掷骰子抓牌
  | 'playing' // 摸打阶段
  | 'round_end'; // 胡牌/流局结算
