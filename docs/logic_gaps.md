# Sector 16 Logic Gaps Checklist

1. Defend dice double-counts temporary defense.
   - In [src/App.tsx](src/App.tsx#L960), `playerDiceCount` uses `totalDefense + encounter.tempDefense`, but `totalDefense` already includes `encounter.tempDefense`.
   - Impact: defense rolls can be stronger than intended.

2. Upgrade purchase is allowed while a system is damaged.
   - [src/App.tsx](src/App.tsx#L612) does not block `buyUpgrade()` when `state.damagedUpgrades[type]` is true.
   - UI suggests damage should be repaired, but logic still permits upgrading damaged systems.

3. Duct Tape item ID violates `Item` contract.
   - In [src/App.tsx](src/App.tsx#L684), `id` is generated as a string, but `Item.id` is typed as a number in [src/types.ts](src/types.ts#L9).
   - Impact: type mismatch and possible future logic bugs for ID-based checks.

4. Victory log can report incorrect Nocturnium amount.
   - In [src/App.tsx](src/App.tsx#L942), message uses `noctLoot` (rolled amount), not the actually added amount (`noctLooted`).
   - Impact: user can see loot text that exceeds cargo-constrained gains.

5. Encounter rates are inconsistent between movement and jumping for Asteroid Belts.
   - Movement uses 0% in Asteroid Belt at [src/App.tsx](src/App.tsx#L198).
   - Jump completion uses 5% for all non-Trade-Hub sectors at [src/App.tsx](src/App.tsx#L539).
   - Impact: same sector can be “safe” by movement but risky by jump.

6. Nebula hazard model is split and inconsistent.
   - Movement in Nebula damages only shields at [src/App.tsx](src/App.tsx#L185).
   - Jumping into Nebula damages random upgraded cargo/shields/weapons at [src/App.tsx](src/App.tsx#L511).
   - Impact: hazard behavior changes by travel method, not clearly signposted in UI.

7. Void description conflicts with actual encounter chance.
   - UI text says “Low probability of encounters” in [src/App.tsx](src/App.tsx#L1600).
   - Actual movement chance is standard 5% (same as most non-safe sectors) at [src/App.tsx](src/App.tsx#L198).

8. Miner upgrade requirement UX vs logic mismatch.
   - Upgrade center checks “has all total” across cargo + storage at [src/App.tsx](src/App.tsx#L1928), but install only works when all items are in cargo at [src/App.tsx](src/App.tsx#L1927).
   - Impact: users can see all requirements met but still cannot install until manual transfer.

9. Dead/unused code path remains.
   - `handleAction()` is defined but empty in [src/App.tsx](src/App.tsx#L608).
   - `useCallback` is imported but unused in [src/App.tsx](src/App.tsx#L6).
   - Impact: maintenance noise and unclear intended architecture.
