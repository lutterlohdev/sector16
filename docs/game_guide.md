# Sector 16 Game Guide (Player + Technical)

This is the canonical game guide for Sector 16. It combines gameplay notes and implementation details and reflects the current code behavior.

## Core Loop

- Navigate a 64x64 grid (4x4 sectors, each 16x16).
- Collect salvage and Nocturnium.
- Sell cargo at Trade Hubs.
- Upgrade ship stats and storage.
- Survive encounters and hazards.

## Starting State

- Credits: `50`
- Nocturnium: `0`
- Cargo capacity: `8`
- Storage capacity: `8`
- Power: `0`
- Defense: `0`
- Upgrades: cargo/shields/weapons/storage all start at level `0`
- Position: `(40, 24)`
- Save key: `sector16_save_v1`

## World Layout

Map generation is deterministic in structure and randomized in remaining tiles:

- Fixed sectors:
  - `0` (0,0): Ruin Sector
  - `15` (3,3): Ruin Sector
  - `6` (1,2): Trade Hub
  - `9` (2,1): Trade Hub
- Trade Hub names:
  - Endless Summer Station
  - The Nocturnal Hub
- Remaining sectors are shuffled from distribution:
  - Asteroid Belt x4
  - Ship Graveyard x2
  - The Void x4
  - Nebula x2

Sector index mapping:

`Math.floor(globalY / 16) * 4 + Math.floor(globalX / 16)`

## Movement & Jumping

- Arrow keys move 1 tile, clamped to `0..63`.
- Jump drive duration: `min(ManhattanDistance * 2000ms, 8000ms)`.
- Jump destination is sector center `(col * 16 + 8, row * 16 + 8)`.

## Encounters

### Encounter Chance

- **On movement**:
  - Trade Hub: 0%
  - Asteroid Belt: 0%
  - Other sectors: 5%
- **On jump completion**:
  - Trade Hub: 0%
  - Other sectors (including Asteroid Belt): 5%

### Encounter Type

- Ruin sectors spawn ruin/guardian-style encounters.
- Other sectors spawn pirate-style encounters.
- Ambush chance is 40%.

### Combat Notes

- Attack dice: `min(floor(power), 3)`.
- Defense dice are capped at 2.
- Ties go to defender.
- If player attack wins: enemy defense decreases.
- If player attack loses exchanges: player power can drop.
- Enemy may warp out after player has attacked (10% chance each subsequent attack).

On victory:

- Credits awarded from encounter.
- Salvage chance: 80% (Ruin) / 30% (non-Ruin).
- Random Nocturnium loot (0-8), subject to cargo capacity.

On defeat:

- Player is moved to the first Trade Hub found in map order.
- Credits reduced to 10% of current value.
- Power/Defense reset to 0.
- Cargo/Shields/Weapons upgrade levels reset to 0.
- Cargo capacity reset to 8.
- Inventory + Nocturnium is trimmed randomly to fit capacity.

## Hazards

### Nebula Radiation

- **While moving in Nebula**:
  - 20% chance to damage shields (if cloaking spell not active).
- **When jumping into Nebula**:
  - 20% chance to damage one random upgraded system among cargo/shields/weapons.

Damaged systems can be repaired at Trade Hubs.

## Economy, Loot, and Upgrades

### Nocturnium

- Found in Asteroid Belt via discovery events (10% move chance).
- Base yield: `1..3` per event.
- If Miner upgrade installed: `+2` yield.
- Sell value: `3` credits per unit.

### Rotational Scavenging

- Candidate item is selected by move index:
  - `SPACE_JUNK[moveCount % SPACE_JUNK.length]`
- Discovery formula:
  - `baseOdds = item.value / 2`
  - sector multipliers:
    - Ship Graveyard: 4
    - Ruin Sector: 2
    - Trade Hub / Asteroid Belt: 0
    - Others: 1

### Trade Hub Upgrade Costs

- Upgrade cost formula:
  - `floor(16 * 2^currentLevel)`
- Effects:
  - Cargo: +8 slots/level
  - Shields: +1 defense/level
  - Weapons: +1 power/level
  - Storage: +8 slots/level
- Repair cost:
  - `floor(currentUpgradeCost * 0.2)`

### Special Upgrade Center (Nocturnal Hub)

Nocturnium Miner upgrade requires these components:

- Functioning Relay (ID 17)
- Heavy Duty Cables (ID 23)
- Atmospheric Scrubber (ID 34)

## Special Systems

### Storage Locker

- Located at randomized coordinates inside Endless Summer Station.
- Access only when standing exactly on locker coordinates.
- Separate secure inventory with independent capacity.

### Upgrade Center

- Located at randomized coordinates inside The Nocturnal Hub.
- Access only when standing exactly on upgrade-center coordinates.

### Wizard

- Wizard initially appears at a hidden coordinate in a Nebula.
- First meeting gives quest for item ID 39 (Hydroponics Grow Light).
- After first meeting, future sightings in Nebula are random.
- Turning in item grants Cloaking Spell:
  - Avoid action becomes guaranteed success.
  - Nebula movement radiation no longer applies.

## Notes

- The root-level guide was consolidated into this file.
- See logic review checklist in docs/logic_gaps.md.
