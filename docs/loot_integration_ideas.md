# Sector 16: Loot Integration & Quest Ideas

Here are 10 creative ideas for deeply integrating specific items (that already exist in your `SPACE_JUNK` loot table) into gameplay mechanics and side-quests, along with a high-level approach on how to build them in the codebase.

## 1. Sovereign Admiral's Log (ID: 62) -> Map Node Unlock
*   **The Idea:** The Admiral's Log contains coordinates to a hidden "Fallen Fleet" sector. While in your inventory, it permanently unlocks a special, perilous map node that doesn't disappear when you jump.
*   **How to Build It:** 
    *   Update `useMap.ts`. When generating `nodes`, check `state.inventory` or `state.storageLocker` for the Sovereign Admiral's Log item ID.
    *   If found, manually append a persistent node to the map layout. 
    *   Clicking this node triggers a unique encounter ID in `useEncounter.ts` with a high-level boss and guaranteed rare loot.

## 2. Neon Medusa Core (ID: 63) -> Jump Drive Overclock
*   **The Idea:** You can wire this unstable core directly into your jump drive. It grants a permanent buff to your "Flee" chance during combat, but slowly drains 1 Nocturnium on every jump.
*   **How to Build It:**
    *   In the `InventoryModal`, add an "Overclock Drive" action when the Neon Medusa Core is selected.
    *   Executing this removes the item and sets a new boolean `medusaCoreActive: true` in `GameState`.
    *   Update `useJump.ts` to deduct 1 Nocturnium during `handleJump()` if the boolean is true.
    *   Update `useCombat.ts` to grant a +1 bonus to all escape/flee rolls.

## 3. Crystalline Neural Matrix (ID: 61) -> Wizard Transcendence
*   **The Idea:** The Wizard NPC doesn't just buy the Matrix; he offers a permanent "Phase Shift" ritual in exchange for it, dropping all incoming damage by 10% permanently.
*   **How to Build It:**
    *   In `WizardModal.tsx`, check if the Crystalline Neural Matrix ID is in `state.inventory`. 
    *   If present, display a unique, glowing dialogue option: "Offer Neural Matrix." 
    *   Choosing it removes the matrix and sets `voidTranscended: true` in `GameState`, which adds a modifier function in `useCombat.ts` (e.g., `let damage = baseDamage * (state.voidTranscended ? 0.9 : 1)`).

## 4. The Genesis Orb (ID: 64) -> Auto-Resurrection
*   **The Idea:** A one-time use panic button. If you die in combat while holding this orb, it shatters and rewinds time to right before the battle started.
*   **How to Build It:**
    *   When an encounter starts, deep copy the `GameState` (excluding The Genesis Orb itself) to a new variable: `temporalSaveState`.
    *   In `useCombat.ts`, in the block that handles `playerHull <= 0` (Game Over), check for The Genesis Orb.
    *   Instead of rendering the game over screen, replace the current `GameState` with `temporalSaveState`, display a massive "GENESIS REBIRTH" alert overlay, and consume the item.

## 5. AI Logic Chip (ID: 42) -> Automated Trade Negotiation
*   **The Idea:** You can install this chip into your ship's mainframe to automate trading and maximize your leverage, guaranteeing the best deals.
*   **How to Build It:**
    *   Add an "Install" button to the inventory. Clicking it removes the chip and sets `hasAILogicInstalled: true`.
    *   In `useTrading.ts`, intercept all buying/selling calculations. If `hasAILogicInstalled` is true, automatically apply a modifier that increases sell prices by 20% and reduces buy prices by 20%.

## 6. Unmarked Data Drive (ID: 53) -> Map Vision Expansion
*   **The Idea:** A purely passive item. While in your cargo hold, the data drive decrypts local sector routes, pushing back the fog of war and revealing the next 3 depths instead of just 1.
*   **How to Build It:**
    *   In `MapView.tsx`, the logic currently calculates which nodes are visible based on the current depth (e.g., `node.depth <= currentDepth + 1`).
    *   Modify this logic: `let visibleDepth = state.inventory.some(i => i.id === 53) ? 3 : 1;` 
    *   Update the rendering loop to show nodes where `node.depth <= currentDepth + visibleDepth`.

## 7. Encrypted Smuggler Deck (ID: 58) -> Black Market Access
*   **The Idea:** Holding this item acts as a VIP pass. Accessing the Trade Hub or encountering Merchant ships replaces their standard shop with a "Black Market."
*   **How to Build It:**
    *   In `TradeHubPanel.tsx` or Trading Modals, check for item ID 58 in `inventory`.
    *   If present, switch the UI view to a "Black Market" state. 
    *   This state reveals exclusive max-tier upgrades or unique mechanics, but requires payment entirely in Nocturnium rather than Credits.

## 8. Experimental Warp Drive (ID: 60) -> Sector Skipping
*   **The Idea:** By installing this item, the player gains the risky ability to skip the next immediate map depth entirely, moving straight to depth + 2.
*   **How to Build It:** 
    *   Add an "Install Warp Drive" button. Sets `hasExperimentalWarp: true` and removes the item.
    *   In `useJump.ts` and `MapView.tsx`, allow the player to click nodes that are 2 depths away. 
    *   Make this action risky: Doing so consumes 3 Nocturnium and rolls a `Math.random()` 15% chance to trigger an emergency hostile encounter.

## 9. Intact Mining Drone (ID: 57) -> Passive Nocturnium Gathering
*   **The Idea:** An autonomous drone. While stored in your cargo, it has a chance to passively generate Nocturnium whenever you jump into an Asteroid Belt.
*   **How to Build It:**
    *   In `useJump.ts`, check if ID 57 is in the `inventory`. 
    *   If the player jumps to a node of type `Asteroid Belt`, invoke a rolling function (e.g., 30% chance).
    *   If successful, automatically add +2 Nocturnium to the `GameState` and push an `addLog` notification so the player knows the drone found something.

## 10. Medical Auto-Doc (ID: 45) -> Emergency Overheal
*   **The Idea:** Instead of paying for repairs at a hub, you can activate the Auto-Doc anywhere in deep space.
*   **How to Build It:**
    *   Add a "Use Auto-Doc" button on the item in `InventoryModal`. 
    *   Clicking it completely restores your defense/hull stats to maximum, permanently adds a +1 buffer to your defense cap, and destroys the item.
