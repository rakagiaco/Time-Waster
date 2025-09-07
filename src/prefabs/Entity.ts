/**
 * Entity Base Class
 * 
 * Abstract base class for all interactive game objects including players, enemies,
 * and NPCs. Provides common functionality for health management, movement, and
 * visual representation with health bars and name tags.
 * 
 * Features:
 * - Health system with visual health bars
 * - Movement and velocity management
 * - Name tag display system
 * - Death state handling
 * - Standardized entity interface
 * 
 * This class should be extended by specific entity types (Player, Enemy, Ally)
 * rather than instantiated directly.
 */

import Phaser from 'phaser';
import GameConfig from '../config/GameConfig';

export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
    protected HIT_POINTS: number;                    // Current health points
    protected MAX_HIT_POINTS: number;                // Maximum health capacity
    protected VELOCITY: number;                      // Movement speed in pixels/second
    protected healthBar!: Phaser.GameObjects.Graphics;      // Visual health bar
    protected healthBarText!: Phaser.GameObjects.BitmapText; // Health text display
    public entity_text!: Phaser.GameObjects.BitmapText;     // Entity name/status text
    public entity_type: string = 'Entity';           // Entity classification

    /**
     * Creates a new Entity instance
     * 
     * @param scene - The Phaser scene to add this entity to
     * @param x - Initial X coordinate
     * @param y - Initial Y coordinate  
     * @param texture - Sprite texture key
     * @param frame - Optional specific frame of the texture
     */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);

        // Initialize default entity properties
        this.HIT_POINTS = 100;
        this.MAX_HIT_POINTS = 100;
        this.VELOCITY = 100;

        // Register entity with scene and physics system
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    /**
     * Creates the visual health bar and text display
     * 
     * Initializes graphics objects for displaying entity health status.
     * Health bar follows the entity and appears above most other objects.
     */
    protected createHealthBar(): void {
        this.healthBar = this.scene.add.graphics();
        this.healthBarText = this.scene.add.bitmapText(this.x, this.y, 'pixel-white', `${this.x}/${this.y}`, 16);

        // Ensure health bar follows camera movement with entity
        this.healthBar.setScrollFactor(1);
        this.healthBarText.setScrollFactor(1);
        
        // Set display depth (above entities, below UI)
        this.healthBar.setDepth(500);
        this.healthBarText.setDepth(501);

        // Draw initial health bar background
        this.healthBar.clear();
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(this.x, this.y, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);
    }

    /**
     * Updates the visual health bar to reflect current health status
     * 
     * Repositions and redraws the health bar based on entity position and
     * current health percentage. Shows both graphical bar and numeric text.
     */
    protected updateHealthBar(): void {
        // Store health data for external access
        this.setData('hitPoints', this.HIT_POINTS);
        this.setData('maxHitPoints', this.MAX_HIT_POINTS);

        // Only update if health bar components exist
        if (this.healthBar && this.healthBarText) {
            // Position health bar relative to entity position
            const barX = this.x - GameConfig.UI.HEALTH_BAR_WIDTH / 2;
            const barY = this.y + 20; // Offset below entity sprite
            
            this.healthBar.setPosition(barX, barY);
            this.healthBarText.setPosition(this.x, barY - 5);
            
            // Redraw health bar with current values
            this.healthBar.clear();
            
            // Calculate health percentage for bar width
            const healthPercentage = this.HIT_POINTS / this.MAX_HIT_POINTS;
            const currentWidth = GameConfig.UI.HEALTH_BAR_WIDTH * healthPercentage;
            
            // Draw red background (total health capacity)
            this.healthBar.fillStyle(0xff0000, 1);
            this.healthBar.fillRect(0, 0, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);
            
            // Draw green foreground (current health)
            this.healthBar.fillStyle(0x00ff00, 1);
            this.healthBar.fillRect(0, 0, currentWidth, GameConfig.UI.HEALTH_BAR_HEIGHT);
            
            // Update numeric health text
            this.healthBarText.setText(`${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`);
        }
    }

    /**
     * Applies damage to the entity and updates health status
     * 
     * @param amount - Amount of damage to apply (positive number)
     */
    public takeDamage(amount: number): void {
        // Reduce health, ensuring it doesn't go below zero
        this.HIT_POINTS = Math.max(0, this.HIT_POINTS - amount);
        this.updateHealthBar();

        // Trigger death behavior if health reaches zero
        if (this.HIT_POINTS <= 0) {
            this.die();
        }
    }

    /**
     * Restores health to the entity
     * 
     * @param amount - Amount of health to restore (positive number)
     */
    public heal(amount: number): void {
        // Increase health, ensuring it doesn't exceed maximum
        this.HIT_POINTS = Math.min(this.MAX_HIT_POINTS, this.HIT_POINTS + amount);
        this.updateHealthBar();
    }

    /**
     * Abstract method for handling entity death
     * 
     * Must be implemented by subclasses to define death behavior
     * such as animations, loot drops, or state changes.
     */
    protected abstract die(): void;

    /**
     * Gets the current position as a coordinate array
     * @returns [x, y] coordinate pair
     */
    public getPosition(): [number, number] {
        return [this.x, this.y];
    }

    /**
     * Gets the current health points
     * @returns Current health value
     */
    public getHealth(): number {
        return this.HIT_POINTS;
    }

    /**
     * Gets the maximum health capacity
     * @returns Maximum health value
     */
    public getMaxHealth(): number {
        return this.MAX_HIT_POINTS;
    }

    /**
     * Gets the movement velocity
     * @returns Movement speed in pixels/second
     */
    public getVelocity(): number {
        return this.VELOCITY;
    }

    /**
     * Checks if the entity is dead
     * @returns True if health is zero or below
     */
    public isDead(): boolean {
        return this.HIT_POINTS <= 0;
    }

    /**
     * Gets the current hit points
     * @returns Current hit points
     */
    public getHitPoints(): number {
        return this.HIT_POINTS;
    }

    /**
     * Gets the maximum hit points
     * @returns Maximum hit points
     */
    public getMaxHitPoints(): number {
        return this.MAX_HIT_POINTS;
    }

    /**
     * Initializes the health bar if it doesn't already exist
     * 
     * Safe method to ensure health bar is created without duplication.
     */
    public initializeHealthBar(): void {
        if (!this.healthBar) {
            this.createHealthBar();
        }
    }

    /**
     * Creates a name tag above the entity
     * 
     * Displays the entity type as text floating above the sprite.
     * Only creates if one doesn't already exist.
     */
    public createNameTag(): void {
        if (!this.entity_text) {
            this.entity_text = this.scene.add.bitmapText(this.x, this.y - 30, 'pixel-white', this.entity_type, 12);
            this.entity_text.setOrigin(0.5, 0.5);
            this.entity_text.setScrollFactor(1); // Follow camera movement
            this.entity_text.setDepth(100);      // Display above most objects
        }
    }

    /**
     * Updates the name tag position to follow the entity
     * 
     * Should be called in update loops to keep name tag positioned correctly.
     */
    public updateNameTag(): void {
        if (this.entity_text) {
            this.entity_text.setPosition(this.x, this.y - 30);
        }
    }

    /**
     * Gets the health bar graphics object
     * @returns The health bar graphics object
     */
    public getHealthBar(): Phaser.GameObjects.Graphics | undefined {
        return this.healthBar;
    }

    /**
     * Gets the health bar text object
     * @returns The health bar text object
     */
    public getHealthBarText(): Phaser.GameObjects.BitmapText | undefined {
        return this.healthBarText;
    }
}
