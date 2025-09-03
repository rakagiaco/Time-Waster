/**
 * Game Type Definitions
 * 
 * Comprehensive TypeScript interfaces for all game entities, scenes, and objects.
 * These interfaces provide type safety and better IDE support throughout the codebase.
 * 
 * Interfaces are organized by functionality:
 * - Scene extensions for custom Phaser scenes
 * - Entity interfaces for all game characters and objects
 * - Player-specific interfaces for inventory and state management  
 * - Enemy interfaces for AI and combat systems
 * - Item interfaces for inventory and pickup systems
 */

import Phaser from 'phaser';

/**
 * Extended Scene interface with game-specific properties
 * Adds player reference and minimap camera for world scenes
 */
export interface GameScene extends Phaser.Scene {
    p1: any; // Player object reference for scene access
    miniMapCamera: Phaser.Cameras.Scene2D.Camera; // Dedicated camera for minimap rendering
}

/**
 * Extended Game interface with global game properties
 * Provides access to shared game state across scenes
 */
export interface Game extends Phaser.Game {
    p1: any; // Global player object reference
    miniMapCamera: Phaser.Cameras.Scene2D.Camera; // Global minimap camera
}

/**
 * Base Entity Interface
 * 
 * Defines the common properties and methods shared by all game entities
 * including players, enemies, and NPCs. Provides standardized health,
 * movement, and animation management.
 */
export interface GameEntity {
    HIT_POINTS: number;                              // Current health points
    MAX_HIT_POINTS: number;                          // Maximum health capacity
    VELOCITY: number;                                // Movement speed in pixels/second
    healthBar: Phaser.GameObjects.Graphics;          // Visual health bar representation
    healthBarText: Phaser.GameObjects.BitmapText;    // Health text display
    animsFSM: any; // StateMachine                   // Animation state machine for sprite control
    
    // Movement and positioning methods
    getPosition(): [number, number];                 // Returns [x, y] coordinates
    setVelocity(x: number, y: number): void;         // Sets movement velocity
    setVelocityX(x: number): void;                   // Sets horizontal velocity only
    setVelocityY(y: number): void;                   // Sets vertical velocity only
    
    // Health and status methods
    isDead(): boolean;                               // Returns true if health <= 0
    takeDamage(amount: number): void;                // Reduces health by specified amount
    updateHealthBar(): void;                         // Refreshes health bar visual display
}

/**
 * Player Interface
 * 
 * Extends GameEntity with player-specific properties for inventory management,
 * quest tracking, UI state, and combat cooldowns. Represents the main character
 * controlled by the player.
 */
export interface Player extends GameEntity {
    windowOpen: boolean;                    // True when any UI window is open
    p1Inventory: any; // Inventory          // Player's inventory system
    questStatus: any;                       // Current quest progress and status
    currentWindow: any;                     // Reference to currently open UI window
    attackLightCooldown: boolean;           // True when light attack is on cooldown
    attackHeavyCooldown: boolean;           // True when heavy attack is on cooldown
    sprintCooldown: boolean;                // True when sprint is on cooldown
    lastSprintTime: number;                 // Timestamp of last sprint usage
}

/**
 * Enemy Interface
 * 
 * Extends GameEntity with enemy-specific properties for AI behavior,
 * combat mechanics, loot systems, and state management. Covers all
 * hostile entities from basic enemies to boss characters.
 */
export interface Enemy extends GameEntity {
    looted: boolean;                        // True if player has looted this enemy
    is_lootable: boolean;                   // True if enemy drops loot when killed
    entity_type: string;                    // Enemy classification (scout, observer, boss, etc.)
    isAttacking: boolean;                   // True when enemy is in attack animation
    isBoss: boolean;                        // True for boss-level enemies
    attackPower: number;                    // Base damage dealt by this enemy
    lightAttack_dmg: number;                // Damage from light attacks received
    heavyAttack_dmg: number;                // Damage from heavy attacks received
    FSM: any; // StateMachine               // AI state machine for behavior control
    INTERVAL_ID: any;                       // Timer reference for periodic actions
    entity_text: Phaser.GameObjects.BitmapText; // Name/status text display
    reset(): void;                          // Resets enemy to initial state
}

/**
 * Ally Interface
 * 
 * Extends GameEntity for friendly NPCs and companion characters.
 * Includes text display and timer management for dialogue and interactions.
 */
export interface Ally extends GameEntity {
    INTERVAL_ID: any;                       // Timer reference for NPC actions
    entity_text: Phaser.GameObjects.BitmapText; // Dialogue/name text display
}

/**
 * Game Item Interface
 * 
 * Defines collectible items throughout the game world including consumables,
 * quest items, and resources. Supports visual effects and audio feedback.
 */
export interface GameItem {
    item_type: string;                      // Item classification for inventory sorting
    soundEffect?: {                         // Optional audio feedback on pickup
        sound: string;                      // Audio file identifier
        volume: number;                     // Playback volume (0.0 to 1.0)
    };
    destroy(): void;                        // Removes item from game world
    setAlpha(alpha: number): GameItem;      // Sets transparency (0.0 to 1.0)
    setScale(scale: number): GameItem;      // Sets visual size multiplier
}
