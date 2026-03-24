# SECTOR 16: Technical Specification & Game Logic Guide

This document provides a comprehensive technical breakdown of the "Sector 16" game engine, mechanics, and user interface. It is designed to serve as a blueprint for rebuilding the game from scratch.

---

## 1. Data Architecture

### 1.1 Game State (`GameState`)
The entire game state is persisted in `localStorage` under the key `sector16_save_v1`.
- `shipName`: String. User-defined.
- `credits`: Number. Starting value: 50.
- `nocturnium`: Number. Current ore count.
- `cargoCapacity`: Number. Starting value: 8.
- `power`: Number. Base attack stat. Starting value: 1.
- `defense`: Number. Base defense stat. Starting value: 1.
- `inventory`: Array of `Item` objects.
- `globalCoords`: Object `{ x: number, y: number }`. Range: 0-63. Starting value: (40, 24).
- `lastJumpTime`: Timestamp.
- `upgrades`: Object `{ cargo: number, shields: number, weapons: number }`. Starting value: `{ cargo: 0, shields: 1, weapons: 1 }`.
- `damagedUpgrades`: Object `{ cargo: boolean, shields: boolean, weapons: boolean }`.
- `moveCount`: Number. Total steps taken (used for rotational rarity).
- `log`: Array of Strings. Persisted game events.

### 1.2 Item Structure
- `id`: Unique identifier.
- `name`: String.
- `value`: Number (Credits).

### 1.3 Sector Structure
- `id`: 0-15.
- `type`: One of `SectorType`.
- `name`: String.
- `coords`: Object `{ r: number, c: number }` (Row/Column in 4x4 grid).

---

## 2. World Generation & Navigation

### 2.1 Map Generation Logic
The map is a 4x4 grid of 16 sectors.
- **Fixed Sectors**:
    - Sector 0 (0,0): Ruin Sector
    - Sector 15 (3,3): Ruin Sector
    - Sector 6 (1,2): Trade Hub
    - Sector 9 (2,1): Trade Hub
- **Distribution Pool**: The remaining 12 sectors are shuffled from a pool containing:
    - 4x Asteroid Belt
    - 2x Ship Graveyard
    - 4x The Void
    - 2x Nebula
- **Naming**: Trade Hubs are named from a fixed list (`HUB_NAMES`). Other sectors are named after their type.

### 2.2 Coordinate Systems
- **Global Grid**: 64x64 units.
- **Sector Grid**: 4x4 sectors.
- **Sub-Grid**: Each sector is 16x16 units.
- **Mapping**: `SectorIndex = Math.floor(globalY / 16) * 4 + Math.floor(globalX / 16)`.

### 2.3 Movement
- **Input**: Arrow keys.
- **Boundary**: Clamped between 0 and 63.
- **Encounter Chance (on move)**:
    - Trade Hub: 0%
    - Asteroid Belt: 0%
    - Others: 5%
- **Ambush Chance**: 40% for any encounter triggered.

### 2.4 Jump Drive
- **Duration**: `Math.min(ManhattanDistance * 2000, 8000)` milliseconds.
- **Encounter Chance (on jump)**:
    - Trade Hub: 0%
    - Others: 5%

---

## 3. Economy & Scavenging

### 3.1 Nocturnium Mining
- **Location**: Asteroid Belt only.
- **Trigger**: 10% chance per move within an Asteroid Belt.
- **Yield**: `Math.floor(Math.random() * 3) + 1`.
- **Value**: 3 Credits per unit.

### 3.2 Rotational Scavenging (Space Junk)
Items are found based on a "Rotational Rarity" system.
- **Candidate Selection**: `ItemIndex = moveCount % SPACE_JUNK.length`.
- **Rarity Formula**:
    - `baseOdds = candidateItem.value / 2`.
    - `successThreshold = sectorMultiplier`.
- **Sector Multipliers**:
    - Ship Graveyard: 4x
    - Ruin Sector: 2x
    - Trade Hub: 0x
    - Asteroid Belt: 0x
    - Others: 1x
- **Roll**: `Math.random() * baseOdds < successThreshold`.

---

## 4. Combat Engine (Dice Exchange)

### 4.1 Stats & Dice
- **Power (Offense)**: Determines attack dice count. `DiceCount = Math.min(Math.floor(power), 3)`.
- **Defense**: Determines defense dice count. `DiceCount = Math.min(Math.floor(defense), 2)`.

### 4.2 NPC Scaling
- **Power/Defense**:
    - **Low Stats (<= 5)**: `PlayerStat + Variance`.
        - Normal Sector: `+3 / -3`.
        - Ruin Sector: `+5 / -1`.
    - **High Stats (> 5)**: `[1, PlayerStat + Bonus]`.
        - Normal Sector Bonus: `+3`.
        - Ruin Sector Bonus: `+5`.
    - Minimum: 1.
- **Archetypes**: 20% Glass Cannon (1.5x Power, 0.5x Defense), 20% Tank (0.5x Power, 1.5x Defense), 60% Standard.
- **Credits**: `(npcPower + npcDefense) * 8 * (0.7 to 1.3)` (Range: 70% to 130% of base value).

### 4.3 Exchange Logic
1. Both sides roll their dice (1-6).
2. Dice are sorted descending.
3. Compare pairs (Player[0] vs NPC[0], Player[1] vs NPC[1]).
4. **Ties**: Defender wins.

#### Player Attacking:
- Player wins comparison: NPC loses 1 Defense, Player gains 1 Power.
- NPC wins comparison: Player loses 1 Power.
- **Warp Out**: 10% chance for other ship to flee after the initial attack.
- **Victory**: If NPC Defense reaches 0. Player gains NPC Credits + salvage chance + random Nocturnium loot.
    - **Salvage Chance**: 80% in Ruin Sector, 30% elsewhere.
    - **Nocturnium Loot**: Randomly collect up to 8 units of Nocturnium Ore (if cargo space allows).
    - **Salvage Rarity**: `Math.random() * (itemValue / 4) < 2`.
- **Failure**: If Player wins 0 comparisons, the other ship successfully defends itself and flies away. Player loses 1 Power.

#### Player Defending:
- NPC wins comparison: Player loses 1 Defense.
- Player wins comparison: Player gains the "Counter-Attack" advantage (can Attack Back or Fly Away).
- **Survival**: If the other ship disengages (random chance after failed defense or split decision).
- **Defeat**: If Player Defense reaches 0.

### 4.4 Defeat Consequences
- Teleport to nearest Trade Hub (usually [40, 24] or the hub center).
- Credits: 90% loss (`credits = Math.floor(credits * 0.1)`).
- Stats: Power/Defense reset to 0.
- Upgrades: All levels reset to 0 (Capacity resets to 8).
- Cargo: If inventory + nocturnium exceeds the new capacity (8), random items/ore are lost until it fits.

---

## 5. Progression & Upgrades

### 5.1 Upgrade Types
- **Cargo**: +8 capacity per level.
- **Shields**: +1 Defense per level.
- **Weapons**: +1 Power per level.

### 5.2 Cost Scaling
- **Base Price**: 16 CR for all upgrades.
- **Cost**: `Math.floor(BasePrice * 2 ^ CurrentLevel)`.
- **Initial Upgrade**:
    - Cargo (0 to 1): 16 CR.
    - Shields/Weapons (1 to 2): 32 CR.

### 5.3 System Damage (Nebula)
- **Trigger**: 20% chance per jump into a Nebula.
- **Effect**: Sets `damagedUpgrades[type] = true`.
- **Repair**: 20% of current upgrade cost. Damaged systems cannot be further upgraded.

---

## 6. User Interface & Experience

### 6.1 Visual Identity
- **CRT Filter**: `flicker` animation, `crt` class with scanline overlays.
- **Typography**: Monospace font (JetBrains Mono or similar).
- **Color Palette**: High-contrast white/emerald/red on black.

### 6.2 Map Interaction
- **Centering**: The map container uses `motion.div` to animate `x/y` offsets. The player is always at the visual center.
- **Grid Rendering**: 64x64 grid of 32px cells.
- **Sector Markers**: Boundaries are highlighted every 16 cells.
- **Icons**: Sparse icons (Zap, Shield, Skull) appear at the center of sectors to indicate type.

### 6.3 Modals & Overlays
- **Jump Overlay**: Full-screen black overlay with a progress bar and a "starfield" animation (moving white pixels).
- **Encounter Modal**: Displays "Your Stats" vs "Enemy Stats" with dice counts. Includes an "Exchange Result" text area for roll history.
- **Log System**: Bottom-right area showing the last 10 events. Newest events at the top.

### 6.4 Trade Terminal
- **Docking**: Only active if `globalX % 16 === 8` and `globalY % 16 === 8` within a Trade Hub sector.
- **Liquidate**: One-click button to sell all non-rare cargo.
- **Upgrade UI**: Displays current level, damage status, and dynamic cost.

---

## 7. Constants & Assets

### 7.1 Sector Names
- Trade Hubs: "Endless Summer Station", "The Nocturnal Hub".
- Others: Named by type (e.g., "Asteroid Belt").

### 7.2 NPC Name Generation
- **Prefix**: The, Vampire's, Lost, Kids of the, Sunset, Neon, Shadow, Comet, Void, Stellar.
- **Suffix**: Shadow, Gambit, Boy, Void, Cruiser, Medusa, Ghost, Reaper, Wanderer, Drifter.
