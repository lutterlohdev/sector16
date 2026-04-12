# Sector 16 Loot Icon Generation Plan

This document tracks the progress and exact method used to generate the 64 unique loot icons for Sector 16.

## Overall Progress
- **Completed:** 25 / 64
- **Remaining:** 39 / 64

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

### Remaining Items to Generate
- Micro-welder
- Standard Issue Rations
- Plasma Torch
- Hand-crank Generator
- Loose Ball Bearings
- Stabilizer Fin
- Signal Amplifier
- Navigation Plotter
- Atmospheric Scrubber
- Solid-state Hard Drive
- High-Capacity Battery
- Communications Array
- Scrap Torpedo Casing
- Hydroponics Grow Light
- Reinforced Hull Plate
- Subspace Antenna
- AI Logic Chip
- Quantum Capacitor
- Shield Emitter Coil
- Medical Auto-Doc
- Advanced Targeting Lens
- Sublight Engine Thruster
- Black Market Hyper-fuel
- Military-Grade CPU
- Prototype Laser Diode
- Intact Surveyor Satellite
- Rare Earth Magnet Cluster
- Unmarked Data Drive
- Emergency Warp Core
- First-Gen Plasma Rifle
- Pre-War Cybernetics
- Intact Mining Drone
- Encrypted Smuggler Deck
- Anti-Matter Fragment
- Experimental Warp Drive
- Crystalline Neural Matrix
- Sovereign Admiral's Log
- Neon Medusa Core
- The Genesis Orb

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
