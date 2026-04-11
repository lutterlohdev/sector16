import { GameState, Item, SectorType } from '../types';
import { SPACE_JUNK, SECTOR_LOOT_TABLES, UNIQUE_ITEM_IDS } from '../constants';

/**
 * Pick a loot item from the sector's tiered loot table.
 *
 * 1. Look up the sector in SECTOR_LOOT_TABLES; return null if none exists.
 * 2. Weighted-random tier selection.
 * 3. Random item from the selected tier's pool.
 * 4. If the item is a unique legendary (ids 61–64) and already in cargo, re-roll
 *    once from the mid tier (index 1). No further re-rolls after that.
 */
export function pickLootItem(
  sectorType: SectorType,
  gameState: GameState
): Item | null {
  const table = SECTOR_LOOT_TABLES[sectorType];
  if (!table) return null;

  const { tiers } = table;

  // --- Weighted tier selection ---
  const totalWeight = tiers.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let selectedTierIndex = 0;
  for (let i = 0; i < tiers.length; i++) {
    roll -= tiers[i].weight;
    if (roll <= 0) {
      selectedTierIndex = i;
      break;
    }
  }

  const selectedTier = tiers[selectedTierIndex];

  // --- Pick a random item id from the tier pool ---
  const itemId = selectedTier.pool[Math.floor(Math.random() * selectedTier.pool.length)];
  let item = SPACE_JUNK.find(j => j.id === itemId) ?? null;

  if (!item) return null;

  // --- Unique legendary protection (ids 61–64) ---
  if (UNIQUE_ITEM_IDS.includes(itemId)) {
    const alreadyOwned = gameState.inventory.some(i => i.id === itemId);
    if (alreadyOwned) {
      // Re-roll once from the mid tier (index 1)
      const midTier = tiers[1];
      const rerollId = midTier.pool[Math.floor(Math.random() * midTier.pool.length)];
      item = SPACE_JUNK.find(j => j.id === rerollId) ?? item;
    }
  }

  return item;
}
