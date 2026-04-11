/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, SectorType, SectorLootTable } from "./types";

export const SECTOR_DISTRIBUTION: SectorType[] = [
  'Trade Hub', 'Trade Hub',
  'Asteroid Belt', 'Asteroid Belt', 'Asteroid Belt', 'Asteroid Belt',
  'Ship Graveyard', 'Ship Graveyard',
  'The Void', 'The Void', 'The Void', 'The Void',
  'Ruin Sector', 'Ruin Sector',
  'Nebula', 'Nebula'
];

export const HUB_NAMES = ["Endless Summer Station", "The Nocturnal Hub"];

export const SPACE_JUNK: Item[] = [
  { id: 1, name: "Frayed Power Cable", value: 64 },
  { id: 2, name: "Rusted Servo Motor", value: 64 },
  { id: 3, name: "Burned Motherboard", value: 64 },
  { id: 4, name: "Bent Antenna", value: 64 },
  { id: 5, name: "Corroded Battery Pack", value: 64 },
  { id: 6, name: "Stripped Copper Wire", value: 64 },
  { id: 7, name: "Shattered Viewport Glass", value: 64 },
  { id: 8, name: "Dull Carbon Plating", value: 64 },
  { id: 9, name: "Spent Thruster Shell", value: 64 },
  { id: 10, name: "Smashed Keypad", value: 64 },
  { id: 11, name: "Blown Fuse Box", value: 64 },
  { id: 12, name: "Empty Coolant Tube", value: 64 },
  { id: 13, name: "Dusty Cathode Tube", value: 64 },
  { id: 14, name: "Depleted Oxygen Tank", value: 64 },
  { id: 15, name: "Warped Heat Sink", value: 64 },
  { id: 16, name: "Cracked Data Pad", value: 64 },
  { id: 17, name: "Functioning Relay", value: 128 },
  { id: 18, name: "Spare Spark Plug", value: 128 },
  { id: 19, name: "Reclaimed Titanium Scrap", value: 128 },
  { id: 20, name: "Intact Magnetic Seal", value: 128 },
  { id: 21, name: "Hydraulic Fluid Canister", value: 128 },
  { id: 22, name: "Clean Engine Filter", value: 128 },
  { id: 23, name: "Heavy Duty Cables", value: 128 },
  { id: 24, name: "Backup Bios Chip", value: 128 },
  { id: 25, name: "Portable Med-Kit", value: 128 },
  { id: 26, name: "Micro-welder", value: 128 },
  { id: 27, name: "Standard Issue Rations", value: 128 },
  { id: 28, name: "Plasma Torch", value: 128 },
  { id: 29, name: "Hand-crank Generator", value: 128 },
  { id: 30, name: "Loose Ball Bearings", value: 128 },
  { id: 31, name: "Stabilizer Fin", value: 256 },
  { id: 32, name: "Signal Amplifier", value: 256 },
  { id: 33, name: "Navigation Plotter", value: 256 },
  { id: 34, name: "Atmospheric Scrubber", value: 256 },
  { id: 35, name: "Solid-state Hard Drive", value: 256 },
  { id: 36, name: "High-Capacity Battery", value: 256 },
  { id: 37, name: "Communications Array", value: 256 },
  { id: 38, name: "Scrap Torpedo Casing", value: 256 },
  { id: 39, name: "Hydroponics Grow Light", value: 256 },
  { id: 40, name: "Reinforced Hull Plate", value: 256 },
  { id: 41, name: "Subspace Antenna", value: 512 },
  { id: 42, name: "AI Logic Chip", value: 512 },
  { id: 43, name: "Quantum Capacitor", value: 512 },
  { id: 44, name: "Shield Emitter Coil", value: 512 },
  { id: 45, name: "Medical Auto-Doc", value: 512 },
  { id: 46, name: "Advanced Targeting Lens", value: 512 },
  { id: 47, name: "Sublight Engine Thruster", value: 512 },
  { id: 48, name: "Black Market Hyper-fuel", value: 512 },
  { id: 49, name: "Military-Grade CPU", value: 1024 },
  { id: 50, name: "Prototype Laser Diode", value: 1024 },
  { id: 51, name: "Intact Surveyor Satellite", value: 1024 },
  { id: 52, name: "Rare Earth Magnet Cluster", value: 1024 },
  { id: 53, name: "Unmarked Data Drive", value: 1024 },
  { id: 54, name: "Emergency Warp Core", value: 1024 },
  { id: 55, name: "First-Gen Plasma Rifle", value: 2048 },
  { id: 56, name: "Pre-War Cybernetics", value: 2048 },
  { id: 57, name: "Intact Mining Drone", value: 2048 },
  { id: 58, name: "Encrypted Smuggler Deck", value: 2048 },
  { id: 59, name: "Anti-Matter Fragment", value: 4096 },
  { id: 60, name: "Experimental Warp Drive", value: 4096 },
  { id: 61, name: "Crystalline Neural Matrix", value: 8192 },
  { id: 62, name: "Sovereign Admiral's Log", value: 16000 },
  { id: 63, name: "Neon Medusa Core", value: 16000 },
  { id: 64, name: "The Genesis Orb", value: 32000 }
];

export const NPC_NAMES_PREFIX = [
  "The", "Vampire's", "Lost", "Kids of the", "Sunset", "Neon", "Shadow", "Comet", "Void", "Stellar",
  "Tydirium", "Coaxium", "Tantive", "Corellian", "Kuat", "Fondor", "Sullust", "Nebulon",
  "Quasar", "Arquitens", "Pelta", "Gozanti", "Razor", "Outrider", "Ebon", "Moldy", "Rogue",
  "Kyber", "Holocron", "Aurebesh"
];
export const NPC_NAMES_SUFFIX = [
  "Shadow", "Gambit", "Boy", "Void", "Cruiser", "Medusa", "Ghost", "Reaper", "Wanderer", "Drifter",
  "Crest", "Hawk", "Crow", "One", "Crystal", "Run", "Station", "Hub", "Yard", "Frigate",
  "Carrier", "Command", "Transport", "Shuttle", "Barge", "Yacht", "Skiff", "Speeder", "Tank", "Walker",
  "Droid", "Fighter", "Bomber", "Interceptor", "Defender", "Avenger", "Punisher", "Ravager", "Marauder", "Raider",
  "Corsair", "Privateer", "Smuggler", "Trader", "Merchant", "Miner", "Scavenger", "Salvager", "Explorer", "Surveyor",
  "Scout", "Sentinel", "Guardian", "Protector", "Warden", "Enforcer", "Executioner", "Assassin", "Hunter", "Stalker",
  "Predator"
];

/** Base drop chance per move for each discoverable sector */
export const SECTOR_DROP_CHANCE: Partial<Record<SectorType, number>> = {
  'Ship Graveyard': 0.06,
  'The Void': 0.04,
  'Nebula': 0.03,
  'Ruin Sector': 0.04,
};

/** Unique legendary item ids (61–64). Only one of each can exist in cargo at a time. */
export const UNIQUE_ITEM_IDS = [61, 62, 63, 64];

/**
 * Tiered loot tables per sector.
 * Each sector has three tiers (common, mid, legendary) with weighted random selection.
 */
export const SECTOR_LOOT_TABLES: Partial<Record<SectorType, SectorLootTable>> = {
  // Ship Graveyard — old battlefield, sunken ships, salvage
  'Ship Graveyard': {
    tiers: [
      { weight: 65, pool: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
      { weight: 30, pool: [31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48] },
      { weight: 5,  pool: [51,55,56,62] },
    ],
  },
  // The Void — deep space, drifting, unclaimed, eerie
  'The Void': {
    tiers: [
      { weight: 50, pool: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40] },
      { weight: 38, pool: [41,42,43,44,45,46,47,48,49,50,51,52,53,54] },
      { weight: 12, pool: [53,54,57,58] },
    ],
  },
  // Nebula — exotic, alien, cosmic, crystalline
  'Nebula': {
    tiers: [
      { weight: 30, pool: [31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48] },
      { weight: 45, pool: [49,50,51,52,53,54,59,60] },
      { weight: 25, pool: [61,63,64] },
    ],
  },
  // Ruin Sector — pre-war military, encrypted, dangerous tech
  'Ruin Sector': {
    tiers: [
      { weight: 35, pool: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40] },
      { weight: 45, pool: [41,42,43,44,45,46,47,48,49,50,51,52,53,54] },
      { weight: 20, pool: [49,50,52,59,60] },
    ],
  },
};
