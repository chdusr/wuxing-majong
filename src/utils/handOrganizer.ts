import { MahjongTileData, MeldType } from '../types/mahjong';
import {
  checkThreeTilesKan,
  CANONICAL_KANS,
  CLASH_PAIRS,
  sortHand,
} from './mahjongRules';

export interface HandGroupSlot {
  id: string;
  name: string;
  type: 'kan' | 'pair';
  maxTiles: number;
  tiles: MahjongTileData[];
}

export interface SlotValidationResult {
  isValid: boolean;
  type?: MeldType | 'pair';
  label: string;
  isComplete: boolean;
}

/**
 * Validate whether the tiles in a slot form a valid Kan (3 tiles) or Pair (2 tiles).
 */
export function validateSlot(tiles: MahjongTileData[], slotType: 'kan' | 'pair'): SlotValidationResult {
  if (tiles.length === 0) {
    return {
      isValid: false,
      isComplete: false,
      label: slotType === 'pair' ? '空将牌槽 (需2张)' : '空砍牌槽 (需3张)',
    };
  }

  if (slotType === 'pair') {
    if (tiles.length === 1) {
      return {
        isValid: false,
        isComplete: false,
        label: `单张【${tiles[0].name}】(需凑对子)`,
      };
    }
    if (tiles.length === 2) {
      if (tiles[0].name === tiles[1].name) {
        return {
          isValid: true,
          isComplete: true,
          type: 'pair',
          label: `雀头将牌：【${tiles[0].name}${tiles[1].name}】`,
        };
      }
      return {
        isValid: false,
        isComplete: true,
        label: `非对子【${tiles[0].name} + ${tiles[1].name}】`,
      };
    }
  }

  if (slotType === 'kan') {
    if (tiles.length < 3) {
      // Check partial formation
      if (tiles.length === 2) {
        // Check if 2 tiles are identical (potential triplet or clash)
        if (tiles[0].name === tiles[1].name) {
          const clash = CLASH_PAIRS[tiles[0].name];
          return {
            isValid: false,
            isComplete: false,
            label: `对子【${tiles[0].name}${tiles[1].name}】(等第3张或冲战【${clash || ''}】)`,
          };
        }
        // Check if 2 tiles are part of a canonical Kan
        const matched = CANONICAL_KANS.filter(k =>
          k.tiles.includes(tiles[0].name) && k.tiles.includes(tiles[1].name)
        );
        if (matched.length > 0) {
          const needed = matched[0].tiles.find(t => t !== tiles[0].name && t !== tiles[1].name);
          return {
            isValid: false,
            isComplete: false,
            label: `待成【${matched[0].name}】(缺【${needed}】)`,
          };
        }
      }
      return {
        isValid: false,
        isComplete: false,
        label: `未成砍 (已放入 ${tiles.length}/3 张)`,
      };
    }

    if (tiles.length === 3) {
      const names = tiles.map(t => t.name);
      const res = checkThreeTilesKan(names);
      if (res && res.isValid) {
        return {
          isValid: true,
          isComplete: true,
          type: res.type,
          label: `${res.typeLabel}：【${names.join('·')}】`,
        };
      }
      return {
        isValid: false,
        isComplete: true,
        label: `非有效组合【${names.join('·')}】`,
      };
    }
  }

  return {
    isValid: false,
    isComplete: false,
    label: '无效状态',
  };
}

/**
 * Intelligent Hand Auto-Grouping:
 * Decomposes any hand (1 to 14 tiles) into greedy/optimal 4 Kans + 1 Pair arrangement.
 */
export function autoGroupHand(hand: MahjongTileData[]): {
  slots: HandGroupSlot[];
  unassigned: MahjongTileData[];
} {
  const unassigned = [...hand];
  const kanSlots: HandGroupSlot[] = [
    { id: 'kan_1', name: '砍一', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_2', name: '砍二', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_3', name: '砍三', type: 'kan', maxTiles: 3, tiles: [] },
    { id: 'kan_4', name: '砍四', type: 'kan', maxTiles: 3, tiles: [] },
  ];
  const pairSlot: HandGroupSlot = {
    id: 'pair_1',
    name: '将牌 (雀头)',
    type: 'pair',
    maxTiles: 2,
    tiles: [],
  };

  let kanSlotIndex = 0;

  // 1. Try finding complete valid 3-card Kans
  let foundKan = true;
  while (foundKan && kanSlotIndex < 4) {
    foundKan = false;
    for (let i = 0; i < unassigned.length; i++) {
      for (let j = i + 1; j < unassigned.length; j++) {
        for (let k = j + 1; k < unassigned.length; k++) {
          const names = [unassigned[i].name, unassigned[j].name, unassigned[k].name];
          const check = checkThreeTilesKan(names);
          if (check && check.isValid) {
            const t1 = unassigned[i];
            const t2 = unassigned[j];
            const t3 = unassigned[k];
            kanSlots[kanSlotIndex].tiles = [t1, t2, t3];
            kanSlotIndex++;
            // Remove from unassigned (in reverse order to preserve indices)
            unassigned.splice(k, 1);
            unassigned.splice(j, 1);
            unassigned.splice(i, 1);
            foundKan = true;
            break;
          }
        }
        if (foundKan) break;
      }
      if (foundKan) break;
    }
  }

  // 2. Try finding a pair for the pair slot
  const counts: Record<string, MahjongTileData[]> = {};
  for (const t of unassigned) {
    counts[t.name] = counts[t.name] || [];
    counts[t.name].push(t);
  }
  const pairCandidate = Object.values(counts).find(arr => arr.length >= 2);
  if (pairCandidate) {
    pairSlot.tiles = [pairCandidate[0], pairCandidate[1]];
    // Remove from unassigned
    unassigned.splice(unassigned.findIndex(t => t.id === pairCandidate[0].id), 1);
    unassigned.splice(unassigned.findIndex(t => t.id === pairCandidate[1].id), 1);
  }

  // 3. Try finding 2-card partial Kans for remaining empty Kan slots
  while (kanSlotIndex < 4 && unassigned.length >= 2) {
    let foundPartial = false;
    for (let i = 0; i < unassigned.length; i++) {
      for (let j = i + 1; j < unassigned.length; j++) {
        const a = unassigned[i];
        const b = unassigned[j];
        // Are they identical?
        const isPair = a.name === b.name;
        // Are they part of a canonical kan?
        const isCanonical = CANONICAL_KANS.some(k => k.tiles.includes(a.name) && k.tiles.includes(b.name));
        // Are they clash pair?
        const isClash = CLASH_PAIRS[a.name] === b.name;

        if (isPair || isCanonical || isClash) {
          kanSlots[kanSlotIndex].tiles = [a, b];
          kanSlotIndex++;
          unassigned.splice(j, 1);
          unassigned.splice(i, 1);
          foundPartial = true;
          break;
        }
      }
      if (foundPartial) break;
    }
    if (!foundPartial) break;
  }

  // Combine slots: 4 Kans + 1 Pair
  const allSlots = [...kanSlots, pairSlot];

  return {
    slots: allSlots,
    unassigned,
  };
}

/**
 * Reorder hand by Clash / Combat pairs
 */
export function sortByClashPairs(hand: MahjongTileData[]): MahjongTileData[] {
  const result: MahjongTileData[] = [];
  const remaining = [...hand];

  while (remaining.length > 0) {
    const current = remaining.shift()!;
    result.push(current);

    // Look for matching identical or clash opposite
    const clashTarget = CLASH_PAIRS[current.name];
    const sameIndex = remaining.findIndex(t => t.name === current.name);
    if (sameIndex !== -1) {
      result.push(remaining.splice(sameIndex, 1)[0]);
      // Check for third same or clash
      const thirdSame = remaining.findIndex(t => t.name === current.name);
      if (thirdSame !== -1) {
        result.push(remaining.splice(thirdSame, 1)[0]);
      } else if (clashTarget) {
        const clashIdx = remaining.findIndex(t => t.name === clashTarget);
        if (clashIdx !== -1) {
          result.push(remaining.splice(clashIdx, 1)[0]);
        }
      }
    } else if (clashTarget) {
      const clashIdx = remaining.findIndex(t => t.name === clashTarget);
      if (clashIdx !== -1) {
        result.push(remaining.splice(clashIdx, 1)[0]);
      }
    }
  }

  return result;
}
