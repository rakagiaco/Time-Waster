/**
 * Game Configuration Constants
 * 
 * Centralized configuration system that eliminates magic numbers throughout the codebase.
 * All timing, movement, combat, UI, and other game-related constants are defined here
 * for easy tuning and maintenance.
 * 
 * Each section is carefully balanced for optimal gameplay experience:
 * - TIMING: Controls game pace and responsiveness
 * - MOVEMENT: Defines character speeds and physics responses  
 * - COMBAT: Balances damage, health, and attack mechanics
 * - UI: Standardizes interface element sizing and positioning
 * - DETECTION: Sets interaction and AI detection ranges
 * - ANIMATION: Controls sprite animation speeds and smoothness
 * - SCALE: Maintains consistent visual sizing across all game objects
 * - SPAWN: Defines default starting positions
 */

export interface GameConfigType {
  // Timing-related constants for game pacing and cooldowns
  TIMING: {
    SPRINT_INTERVAL: number;              // How often sprint stamina regenerates (ms)
    SPRINT_DURATION: number;              // Total sprint duration before exhaustion (ms)
    ATTACK_LIGHT_COOLDOWN: number;        // Light attack cooldown period (ms)
    ATTACK_HEAVY_COOLDOWN: number;        // Heavy attack cooldown period (ms)
    ENEMY_ATTACK_DELAY: number;           // Delay before enemy executes attack (ms)
    ENEMY_RESET_DELAY: number;            // Time before enemy returns to patrol state (ms)
    ENEMY_DEATH_DELAY: number;            // Death animation duration (ms)
    ENEMY_FADE_DELAY: number;             // Time before dead enemy fades from view (ms)
    ENEMY_REVIVE_DELAY: number;           // Respawn timer for defeated enemies (ms)
    HEAL_INTERVAL: number;                // Health regeneration tick rate (ms)
    DAMAGE_TEXT_DURATION: number;         // How long damage numbers display (ms)
    CURSOR_ANIMATION_DURATION: number;    // UI cursor animation speed (ms)
    TREE_ANIMATION_DELAYS: number[];      // Staggered tree animation delays for natural look
  };
  // Movement and physics constants for all game entities
  MOVEMENT: {
    PLAYER_BASE_VELOCITY: number;         // Normal player movement speed (pixels/second)
    PLAYER_SPRINT_VELOCITY: number;       // Enhanced sprint movement speed (pixels/second)
    PLAYER_WATER_VELOCITY: number;        // Reduced speed when moving through water (pixels/second)
    ENEMY_BASE_VELOCITY: number;          // Standard enemy movement speed (pixels/second)
    KNOCKBACK_LIGHT: number;              // Light attack knockback force (pixels)
    KNOCKBACK_HEAVY: number;              // Heavy attack knockback force (pixels)
    BOSS_KNOCKBACK: number;               // Boss attack knockback force (pixels)
    ENEMY_MOVEMENT_DURATION: number;      // Length of enemy movement phases (ms)
    ENEMY_MOVEMENT_PAUSE: number;         // Pause between enemy movement phases (ms)
  };
  // Combat system constants for health, damage, and battle mechanics
  COMBAT: {
    PLAYER_MAX_HEALTH: number;            // Maximum player health points
    ENEMY_SCOUT_HEALTH: number;           // Health for scout-type enemies
    ENEMY_OBSERVER_HEALTH: number;        // Health for observer-type enemies  
    BOSS_HEALTH: number;                  // Boss enemy health points
    ENEMY_SCOUT_ATTACK: number;           // Damage dealt by scout enemies
    ENEMY_OBSERVER_ATTACK: number;        // Damage dealt by observer enemies
    BOSS_ATTACK: number;                  // Damage dealt by boss enemies
    LIGHT_ATTACK_MIN: number;             // Minimum player light attack damage
    LIGHT_ATTACK_MAX: number;             // Maximum player light attack damage
    HEAVY_ATTACK_MIN: number;             // Minimum player heavy attack damage
    HEAVY_ATTACK_MAX: number;             // Maximum player heavy attack damage
    BOSS_AOE_DAMAGE_MIN: number;          // Minimum boss area-of-effect damage
    BOSS_AOE_DAMAGE_MAX: number;          // Maximum boss area-of-effect damage
    BOSS_HEAL_AMOUNT: number;             // Health restored per boss heal tick
    BOSS_HEAL_INTERVAL: number;           // Time between boss self-healing (ms)
    ENEMY_ATTACK_DAMAGE: number;          // Standard enemy attack damage
    // Environmental modifiers for night-time difficulty scaling
    NIGHT_SPEED_MULTIPLIER: number;       // Enemy speed increase during night (multiplier)
    NIGHT_DAMAGE_MULTIPLIER: number;      // Enemy damage increase during night (multiplier)
  };
  // User interface element sizing and positioning constants
  UI: {
    HEALTH_BAR_WIDTH: number;             // Player health bar width (pixels)
    HEALTH_BAR_HEIGHT: number;            // Player health bar height (pixels)
    STAMINA_BAR_WIDTH: number;            // Sprint stamina bar width (pixels)
    STAMINA_BAR_HEIGHT: number;           // Sprint stamina bar height (pixels)
    HEALTH_BAR_OFFSET_X: number;          // Health bar horizontal offset from player (pixels)
    HEALTH_BAR_OFFSET_Y: number;          // Health bar vertical offset from player (pixels)
    STAMINA_BAR_OFFSET_Y: number;         // Stamina bar vertical offset from player (pixels)
    QUEST_TRACKER_OFFSET_X: number;       // Quest tracker horizontal screen position (pixels)
    QUEST_TRACKER_OFFSET_Y: number;       // Quest tracker vertical screen position (pixels)
    QUEST_TRACKER_BODY_OFFSET_Y: number;  // Quest description text vertical offset (pixels)
    HEALTH_BAR_WIDTH_DEFAULT: number;     // Default entity health bar width (pixels)
    HEALTH_BAR_HEIGHT_DEFAULT: number;    // Default entity health bar height (pixels)
  };
  // Detection and interaction range constants for AI and game mechanics
  DETECTION: {
    DEFAULT_DISTANCE: number;             // Standard enemy detection radius (pixels)
    BOSS_DETECTION: number;               // Boss enemy detection radius (pixels)
    ENEMY_OBSERVER_DETECTION: number;     // Observer-type enemy detection radius (pixels)
    ITEM_DETECTION: number;               // Item pickup interaction radius (pixels)
    BOSS_AOE_RANGE: number;               // Boss area-of-effect attack radius (pixels)
    ENEMY_ATTACK_RANGE: number;           // Melee attack range for enemies (pixels)
  };
  // Animation frame rates for smooth and consistent sprite animations
  ANIMATION: {
    PLAYER_WALK_FRAMERATE: number;        // Player walking animation speed (fps)
    PLAYER_FRAME_RATE: number;            // General player animation speed (fps)
    ENEMY_IDLE_FRAMERATE: number;         // Enemy idle animation speed (fps)
    ENEMY_FRAME_RATE: number;             // General enemy animation speed (fps)
    ENEMY_DEATH_FRAMERATE: number;        // Enemy death animation speed (fps)
    BOSS_IDLE_FRAMERATE: number;          // Boss idle animation speed (fps)
    BOSS_FRAME_RATE: number;              // General boss animation speed (fps)
    BOSS_DEATH_FRAMERATE: number;         // Boss death animation speed (fps)
    BOSS_AOE_FRAMERATE: number;           // Boss area-attack animation speed (fps)
    BOSS_AOE_FRAME_RATE: number;          // Boss AOE effect frame rate (fps)
    QUEST_ICON_FRAMERATE: number;         // Quest indicator animation speed (fps)
    QUEST_ICON_FRAME_RATE: number;        // Quest icon frame rate (fps)
    QUEST_COMPLETE_FRAME_RATE: number;    // Quest completion animation speed (fps)
    WATER_FRAMERATE: number;              // Water animation speed (fps)
    WATER_FRAME_RATE: number;             // Water effect frame rate (fps)
    TREE_FRAMERATE: number;               // Tree swaying animation speed (fps)
    TREE_FRAME_RATE: number;              // Tree frame rate (fps)
    BUSH_FRAMERATE: number;               // Bush animation speed (fps)
    ATTACK_FRAME_RATE: number;            // Attack animation speed (fps)
    DEATH_FRAME_RATE: number;             // Death animation speed (fps)
  };
  // Scaling constants for consistent visual sizing across all game objects
  SCALE: {
    PLAYER: number;                       // Player sprite scale multiplier
    ENTITY_BASE: number;                  // Base scale for all entities
    ENEMY: number;                        // Enemy sprite scale multiplier
    TREE: number;                         // Tree sprite scale multiplier
    WATER: number;                        // Water tile scale multiplier
    BUSH: number;                         // Bush sprite scale multiplier
    UI_BUTTON: number;                    // UI button scale multiplier
    UI_SMALL: number;                     // Small UI element scale multiplier
    UI_TINY: number;                      // Tiny UI element scale multiplier
  };
  // Default spawn positions for game entities
  SPAWN: {
    PLAYER_X: number;                     // Default player X spawn coordinate (pixels)
    PLAYER_Y: number;                     // Default player Y spawn coordinate (pixels)
  };
}

/**
 * Game Configuration Implementation
 * 
 * Carefully tuned values for optimal gameplay experience.
 * Values are the result of playtesting and balancing for fair, engaging gameplay.
 */
const GameConfig: GameConfigType = {
  // Timing constants - all values in milliseconds for consistency
  TIMING: {
    SPRINT_INTERVAL: 50,
    SPRINT_DURATION: 3000,
    ATTACK_LIGHT_COOLDOWN: 1000,
    ATTACK_HEAVY_COOLDOWN: 3000,
    ENEMY_ATTACK_DELAY: 2000,
    ENEMY_RESET_DELAY: 5000,
    ENEMY_DEATH_DELAY: 1250,
    ENEMY_FADE_DELAY: 5000,
    ENEMY_REVIVE_DELAY: 5000,
    HEAL_INTERVAL: 200,
    DAMAGE_TEXT_DURATION: 500,
    CURSOR_ANIMATION_DURATION: 250,
    TREE_ANIMATION_DELAYS: [2500, 3500, 4500, 5500, 6500, 7500]
  },

  // Movement and physics constants - all speeds in pixels per second
  MOVEMENT: {
    PLAYER_BASE_VELOCITY: 100,
    PLAYER_SPRINT_VELOCITY: 175,
    PLAYER_WATER_VELOCITY: 50,
    ENEMY_BASE_VELOCITY: 50,
    KNOCKBACK_LIGHT: 250,
    KNOCKBACK_HEAVY: 375,
    BOSS_KNOCKBACK: 400,
    ENEMY_MOVEMENT_DURATION: 750,
    ENEMY_MOVEMENT_PAUSE: 500
  },

  // Combat system constants - balanced for challenging but fair gameplay
  COMBAT: {
    PLAYER_MAX_HEALTH: 200,
    ENEMY_SCOUT_HEALTH: 50,
    ENEMY_OBSERVER_HEALTH: 50,
    BOSS_HEALTH: 100,
    ENEMY_SCOUT_ATTACK: 7,
    ENEMY_OBSERVER_ATTACK: 12,
    BOSS_ATTACK: 16,
    LIGHT_ATTACK_MIN: 10,
    LIGHT_ATTACK_MAX: 15,
    HEAVY_ATTACK_MIN: 20,
    HEAVY_ATTACK_MAX: 25,
    BOSS_AOE_DAMAGE_MIN: 15,
    BOSS_AOE_DAMAGE_MAX: 30,
    BOSS_HEAL_AMOUNT: 10,
    BOSS_HEAL_INTERVAL: 500,
    ENEMY_ATTACK_DAMAGE: 10,
    // Night-time difficulty modifiers for dynamic gameplay
    NIGHT_SPEED_MULTIPLIER: 1.4,  // Enemies move 40% faster at night
    NIGHT_DAMAGE_MULTIPLIER: 1.3  // Enemies deal 30% more damage at night
  },

  // User interface constants - optimized for 1000x800 game resolution
  UI: {
    HEALTH_BAR_WIDTH: 200,
    HEALTH_BAR_HEIGHT: 15,
    STAMINA_BAR_WIDTH: 150,
    STAMINA_BAR_HEIGHT: 5,
    HEALTH_BAR_OFFSET_X:  -75,
    HEALTH_BAR_OFFSET_Y: 100,
    STAMINA_BAR_OFFSET_Y: 155,
    QUEST_TRACKER_OFFSET_X: 10,
    QUEST_TRACKER_OFFSET_Y: 200,
    QUEST_TRACKER_BODY_OFFSET_Y: 170,
    HEALTH_BAR_WIDTH_DEFAULT: 100,
    HEALTH_BAR_HEIGHT_DEFAULT: 8
  },

  // Detection ranges - balanced for fair AI behavior and player interaction
  DETECTION: {
    DEFAULT_DISTANCE: 150,
    BOSS_DETECTION: 650,
    ENEMY_OBSERVER_DETECTION: 200,
    ITEM_DETECTION: 100,
    BOSS_AOE_RANGE: 50,
    ENEMY_ATTACK_RANGE: 32
  },

  // Animation frame rates - optimized for smooth 60fps gameplay
  ANIMATION: {
    PLAYER_WALK_FRAMERATE: 10,
    PLAYER_FRAME_RATE: 10,
    ENEMY_IDLE_FRAMERATE: 10,
    ENEMY_FRAME_RATE: 8,
    ENEMY_DEATH_FRAMERATE: 6,
    BOSS_IDLE_FRAMERATE: 6,
    BOSS_FRAME_RATE: 6,
    BOSS_DEATH_FRAMERATE: 6,
    BOSS_AOE_FRAMERATE: 8,
    BOSS_AOE_FRAME_RATE: 8,
    QUEST_ICON_FRAMERATE: 5,
    QUEST_ICON_FRAME_RATE: 5,
    QUEST_COMPLETE_FRAME_RATE: 5,
    WATER_FRAMERATE: 4,
    WATER_FRAME_RATE: 4,
    TREE_FRAMERATE: 3,
    TREE_FRAME_RATE: 3,
    BUSH_FRAMERATE: 5,
    ATTACK_FRAME_RATE: 8,
    DEATH_FRAME_RATE: 6
  },

  // Visual scaling factors - maintains pixel art aesthetic at game resolution
  SCALE: {
    PLAYER: 1.65,
    ENTITY_BASE: 2.5,
    ENEMY: 1.25,
    TREE: 2.5,
    WATER: 2.5,
    BUSH: 2,
    UI_BUTTON: 2,
    UI_SMALL: 0.75,
    UI_TINY: 0.5
  },

  // Default spawn positions - safe starting area for new players
  SPAWN: {
    PLAYER_X: 200,
    PLAYER_Y: 200
  }
}

// Export the configuration as default export for easy importing
export default GameConfig;
