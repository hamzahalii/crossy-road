// ── Grid & World ──
export const TILE_SIZE = 1;
export const ROWS_VISIBLE_AHEAD = 22;
export const ROWS_VISIBLE_BEHIND = 6;
export const LANE_WIDTH = 20;       // x-axis tiles visible (±10)
export const HALF_LANE = 10;

// ── Row generation weights ──
export const ROW_WEIGHTS = {
  grass: 3,
  road: 4,
  river: 2,
  rail: 1,
  safe: 1,
};
export const MAX_CONSECUTIVE_ROAD = 3;
export const MAX_CONSECUTIVE_RIVER = 3;
export const SAFE_ROW_INTERVAL = [8, 12]; // guaranteed safe row every N rows

// ── Vehicle speeds (tiles per second) ──
export const CAR_SPEEDS = [2.0, 2.8, 3.5, 4.2, 5.0];
export const TRUCK_CHANCE = 0.3;
export const VEHICLES_PER_LANE = [2, 3, 4];

// ── River ──
export const LOG_SPEEDS = [1.5, 2.0, 2.5, 3.0];
export const LOG_LENGTHS = [2, 3, 4];
export const LOGS_PER_ROW = [2, 3, 4];

// ── Rail ──
export const TRAIN_WARNING_TIME = 1500;  // ms of blinking before train
export const TRAIN_SPEED = 18;           // tiles per second

// ── Player ──
export const HOP_DURATION = 0.12;        // seconds
export const EAGLE_IDLE_TIME = 4000;     // ms before eagle comes

// ── Camera ──
export const CAMERA_DISTANCE = 14;
export const CAMERA_HEIGHT = 14;
export const CAMERA_LERP_SPEED = 5;

// ── Coins ──
export const COIN_SPAWN_CHANCE = 0.15;   // per row
export const GUMBALL_COST = 5;

// ── Difficulty ──
export const DIFFICULTY_SPEED_INCREASE = 0.005; // per score point
export const DIFFICULTY_MAX_MULTIPLIER = 2.0;

// ── Colors ──
export const COLORS = {
  sky: 0x87CEEB,
  grass: 0x4CAF50,
  grassDark: 0x388E3C,
  road: 0x424242,
  roadLine: 0xBDBDBD,
  water: 0x2196F3,
  waterDeep: 0x1565C0,
  rail: 0x795548,
  railTie: 0x5D4037,
  tree: 0x2E7D32,
  treeTrunk: 0x5D4037,
  rock: 0x757575,
  log: 0x8D6E63,
  coin: 0xFFD700,
  white: 0xFFFFFF,
  chickenBody: 0xFFFFFF,
  chickenHead: 0xFFFFFF,
  chickenBeak: 0xFF8F00,
  chickenComb: 0xE53935,
  chickenEye: 0x212121,
};

