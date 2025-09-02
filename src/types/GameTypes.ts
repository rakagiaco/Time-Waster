import Phaser from 'phaser';

// Extended Scene interface with custom properties
export interface GameScene extends Phaser.Scene {
    p1: any; // Player object
    miniMapCamera: Phaser.Cameras.Scene2D.Camera;
}

// Extended Game interface with custom properties
export interface Game extends Phaser.Game {
    p1: any; // Player object
    miniMapCamera: Phaser.Cameras.Scene2D.Camera;
}

// Entity types
export interface GameEntity {
    HIT_POINTS: number;
    MAX_HIT_POINTS: number;
    VELOCITY: number;
    healthBar: Phaser.GameObjects.Graphics;
    healthBarText: Phaser.GameObjects.BitmapText;
    animsFSM: any; // StateMachine
    getPosition(): [number, number];
    setVelocity(x: number, y: number): void;
    setVelocityX(x: number): void;
    setVelocityY(y: number): void;
    isDead(): boolean;
    takeDamage(amount: number): void;
    updateHealthBar(): void;
}

// Player specific interface
export interface Player extends GameEntity {
    windowOpen: boolean;
    p1Inventory: any; // Inventory
    questStatus: any;
    currentWindow: any;
    attackLightCooldown: boolean;
    attackHeavyCooldown: boolean;
    sprintCooldown: boolean;
    lastSprintTime: number;
}

// Enemy specific interface
export interface Enemy extends GameEntity {
    looted: boolean;
    is_lootable: boolean;
    entity_type: string;
    isAttacking: boolean;
    isBoss: boolean;
    attackPower: number;
    lightAttack_dmg: number;
    heavyAttack_dmg: number;
    FSM: any; // StateMachine
    INTERVAL_ID: any;
    entity_text: Phaser.GameObjects.BitmapText;
    reset(): void;
}

// Ally specific interface
export interface Ally extends GameEntity {
    INTERVAL_ID: any;
    entity_text: Phaser.GameObjects.BitmapText;
}

// Item interface
export interface GameItem {
    item_type: string;
    soundEffect?: {
        sound: string;
        volume: number;
    };
    destroy(): void;
    setAlpha(alpha: number): GameItem;
    setScale(scale: number): GameItem;
}
