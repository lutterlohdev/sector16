# Sector 16: Trading System Concepts

These are brainstormed concepts for creating a deep, dynamic trading system with other ships.

## 1. The "Power Dynamic" (Intimidation & Leverage)
Instead of a static shop, the attitude of the NPC merchant is entirely dictated by a comparison of your ship's stats versus theirs.
*   **The Underdog (`Player Power << NPC Power`):** The NPC sees you as weak. They charge extortionate markups (e.g., 150% standard price) and offer you lower values for your goods. They might even demand a "toll" or "bribe" of credits/ore just to show you their inventory.
*   **Equal Footing (`Player Power == NPC Power`):** Standard, fair trade rates. 
*   **The Intimidator (`Player Power >> NPC Power`):** You have a new UI option: **"Demand Better Deal."** By flexing your superior firepower, you force a massive discount (e.g., 50% off) and they buy your junk at a premium.
*   **The Risk/Reward Hook:** If you press the "Intimidate" button, there's a risk. If you push a terrified, cornered merchant too far, they might panic and attack first, or immediately engage their jump drive and flee, locking you out of a rare item you really wanted.

## 2. Contextual "Need States" & Desperation
Make the NPCs feel like real entities surviving in Sector 16 by giving them temporary "Need States" when you encounter them.
*   **Stranded/Damaged:** You find a ship with reduced defense stats and a "Critical" status. They are desperate for a specific item (e.g., "Repair Nanites" or "Scrap Metal"). If you trade them that specific item, its value is multiplied by 5x, allowing you to clean out their entire inventory for a single cheap item. 
*   **Over-encumbered:** A mining vessel that is completely full of Nocturnium but needs to offload it fast to jump away from pirates. They sell Nocturnium at dirt-cheap prices but will ONLY accept Credits, no barter.

## 3. The "Scale" Barter System
Move away from purely clicking "Sell" or "Buy" with credits, and implement a hybrid barter window.
*   **How it Works:** The UI works like a scale. You select the NPC items you want. To match their requested value, you can offer any combination of Credits, Nocturnium, and items from your inventory.
*   **Subjective Value:** NPCs don't value all items equally.
    *   *Pirates* don't care about Credits; they only want weapons/armor items or Nocturnium.
    *   *Wizards/Anomalous Entities* might only trade rare tech for strange, specific "Junk" items from your inventory.
*   **The Racket:** You can sometimes get ripped off. A shady trader might offer a "Sealed Military Crate" for a high price. You don't know what's inside until you buy it—it could be a max-tier weapon upgrade, or it could be literal garbage.

## 4. Integration with Combat Dice (The Haggling Mini-Game)
Since the game utilizes a Risk-style dice mechanic for combat, this system can be reused for trading.
*   **How it Works:** When trading, you can choose to "Haggle." You roll dice based on your `Power` vs their `Defense` (treating haggling as conversational combat).
*   **Outcomes:** 
    *   Win the roll: Prices drop by 10%. You can keep rolling to push prices lower.
    *   Lose the roll: The NPC gets offended, prices go UP, and their patience meter drops.
    *   Lose too many rolls: Trade is locked out, and combat initiates.
