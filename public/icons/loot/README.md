# Sector 16 Loot Icon Generation Plan

This document tracks the progress and exact method used to generate the 64 unique loot icons for Sector 16.

## Overall Progress
- **Completed:** 64 / 64
- **Remaining:** 0 / 64

### Completed Items
1. Frayed Power Cable (`frayed_power_cable.png`)
2. Rusted Servo Motor (`rusted_servo_motor.png`)
3. Burned Motherboard (`burned_motherboard.png`)
4. Bent Antenna (`bent_antenna.png`)
5. Corroded Battery Pack (`corroded_battery_pack.png`)
6. Stripped Copper Wire (`stripped_copper_wire.png`)
7. Shattered Viewport Glass (`shattered_viewport_glass.png`)
8. Dull Carbon Plating (`dull_carbon_plating.png`)
9. Spent Thruster Shell (`spent_thruster_shell.png`)
10. Smashed Keypad (`smashed_keypad.png`)
11. Blown Fuse Box (`blown_fuse_box.png`)
12. Empty Coolant Tube (`empty_coolant_tube.png`)
13. Dusty Cathode Tube (`dusty_cathode_tube.png`)
14. Depleted Oxygen Tank (`depleted_oxygen_tank.png`)
15. Warped Heat Sink (`warped_heat_sink.png`)
16. Cracked Data Pad (`cracked_data_pad.png`)
17. Functioning Relay (`functioning_relay.png`)
18. Spare Spark Plug (`spare_spark_plug.png`)
19. Reclaimed Titanium Scrap (`reclaimed_titanium_scrap.png`)
20. Intact Magnetic Seal (`intact_magnetic_seal.png`)
21. Hydraulic Fluid Canister (`hydraulic_fluid_canister.png`)
22. Clean Engine Filter (`clean_engine_filter.png`)
23. Heavy Duty Cables (`heavy_duty_cables.png`)
24. Backup Bios Chip (`backup_bios_chip.png`)
25. Portable Med-Kit (`portable_med_kit.png`)
26. Micro-welder (`micro_welder.png`)
27. Standard Issue Rations (`standard_issue_rations.png`)
28. Plasma Torch (`plasma_torch.png`)
29. Hand-crank Generator (`hand_crank_generator.png`)
30. Loose Ball Bearings (`loose_ball_bearings.png`)
31. Stabilizer Fin (`stabilizer_fin.png`)
32. Signal Amplifier (`signal_amplifier.png`)
33. Navigation Plotter (`navigation_plotter.png`)
34. Atmospheric Scrubber (`atmospheric_scrubber.png`)
35. Solid-state Hard Drive (`solid_state_hard_drive.png`)
36. High-Capacity Battery (`high_capacity_battery.png`)
37. Communications Array (`communications_array.png`)
38. Scrap Torpedo Casing (`scrap_torpedo_casing.png`)
39. Hydroponics Grow Light (`hydroponics_grow_light.png`)
40. Reinforced Hull Plate (`reinforced_hull_plate.png`)
41. Subspace Antenna (`subspace_antenna.png`)
42. AI Logic Chip (`ai_logic_chip.png`)
43. Quantum Capacitor (`quantum_capacitor.png`)
44. Shield Emitter Coil (`shield_emitter_coil.png`)
45. Medical Auto-Doc (`medical_auto_doc.png`)
46. Advanced Targeting Lens (`advanced_targeting_lens.png`)
47. Sublight Engine Thruster (`sublight_engine_thruster.png`)
48. Black Market Hyper-fuel (`black_market_hyper_fuel.png`)
49. Military-Grade CPU (`military_grade_cpu.png`)
50. Prototype Laser Diode (`prototype_laser_diode.png`)
51. Intact Surveyor Satellite (`intact_surveyor_satellite.png`)
52. Rare Earth Magnet Cluster (`rare_earth_magnet_cluster.png`)
53. Unmarked Data Drive (`unmarked_data_drive.png`)
54. Emergency Warp Core (`emergency_warp_core.png`)
55. First-Gen Plasma Rifle (`first_gen_plasma_rifle.png`)
56. Pre-War Cybernetics (`pre_war_cybernetics.png`)
57. Intact Mining Drone (`intact_mining_drone.png`)
58. Encrypted Smuggler Deck (`encrypted_smuggler_deck.png`)
59. Anti-Matter Fragment (`anti_matter_fragment.png`)
60. Experimental Warp Drive (`experimental_warp_drive.png`)
61. Crystalline Neural Matrix (`crystalline_neural_matrix.png`)
62. Sovereign Admiral's Log (`sovereign_admirals_log.png`)
63. Neon Medusa Core (`neon_medusa_core.png`)
64. The Genesis Orb (`the_genesis_orb.png`)

## Generation Process

Due to rate limits with the AI image generator, the icons are being generated in batches. The images are generated with a pure white background, and a secondary bash script using ImageMagick converts the white background to absolute transparency to support the game UI.

### 1. Generation Prompt

To ensure consistency in style across all icons (a clean, non-gritty, 32-bit pixel art style with space/sci-fi elements and neon accents), we use the following exact base prompt structure replacing `[Item Name]`:

> "A clean 32-bit retro pixel art icon of a '[Item Name]'. Sci-fi space game inventory asset. Low detail, distinct pixels, subtle glowing neon accents, clean aesthetic, not gritty. Isolated entirely on a pure solid white background so it can be made transparent. No background elements."

### 2. Processing (Transparency Script)

Once the raw images with white backgrounds are saved in `public/icons/loot/`, we run this loop using `ImageMagick` to process the newly created images and extract the subject perfectly.

```bash
# Example processing loop using ImageMagick's convert tool
for img in public/icons/loot/*.png; do
  convert "$img" -fuzz 10% -transparent white "public/icons/loot/$(basename "$img")"
done
```

> **Note:** The `-fuzz 10%` flag is important to deal with minor anti-aliasing artifacts introduced by the AI generator against the white canvas!
