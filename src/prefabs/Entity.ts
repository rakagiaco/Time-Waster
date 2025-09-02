import Phaser from 'phaser';
import GameConfig from '../config/GameConfig';

export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
    protected HIT_POINTS: number;
    protected MAX_HIT_POINTS: number;
    protected VELOCITY: number;
    protected healthBar!: Phaser.GameObjects.Graphics;
    protected healthBarText!: Phaser.GameObjects.BitmapText;
    public entity_text!: Phaser.GameObjects.BitmapText;
    public entity_type: string = 'Entity';

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);

        // Initialize properties
        this.HIT_POINTS = 100;
        this.MAX_HIT_POINTS = 100;
        this.VELOCITY = 100;

        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

    }

    protected createHealthBar(): void {
        this.healthBar = this.scene.add.graphics();
        this.healthBarText = this.scene.add.bitmapText(this.x, this.y, 'pixel-white', `${this.x}/${this.y}`, 16);

        // Set scroll factors so health bar follows the entity
        this.healthBar.setScrollFactor(1);
        this.healthBarText.setScrollFactor(1);
        
        // Set depth so health bar appears above other objects (but below minimap)
        this.healthBar.setDepth(500);
        this.healthBarText.setDepth(501);

        // Draw initial health bar
        this.healthBar.clear();
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(this.x, this.y, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);
    }

    protected updateHealthBar(): void {
        // Store health data in the entity for the helper function to access
        this.setData('hitPoints', this.HIT_POINTS);
        this.setData('maxHitPoints', this.MAX_HIT_POINTS);

        console.log(`updateHealthBar called: health=${this.HIT_POINTS}/${this.MAX_HIT_POINTS}, healthBar exists=${!!this.healthBar}, healthBarText exists=${!!this.healthBarText}`);

        // Update health bar position and visual representation
        if (this.healthBar && this.healthBarText) {
            // Position health bar slightly under the entity
            const barX = this.x - GameConfig.UI.HEALTH_BAR_WIDTH / 2;
            const barY = this.y + 20; // Slightly under the entity
            
            this.healthBar.setPosition(barX, barY);
            this.healthBarText.setPosition(this.x, barY - 5);
            
            // Update health bar visual representation
            this.healthBar.clear();
            
            // Calculate health percentage
            const healthPercentage = this.HIT_POINTS / this.MAX_HIT_POINTS;
            const currentWidth = GameConfig.UI.HEALTH_BAR_WIDTH * healthPercentage;
            
            // Draw background (red)
            this.healthBar.fillStyle(0xff0000, 1);
            this.healthBar.fillRect(0, 0, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);
            
            // Draw current health (green)
            this.healthBar.fillStyle(0x00ff00, 1);
            this.healthBar.fillRect(0, 0, currentWidth, GameConfig.UI.HEALTH_BAR_HEIGHT);
            
            // Update text
            this.healthBarText.setText(`${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`);
        }
    }

    public takeDamage(amount: number): void {
        console.log(`Entity taking damage: ${amount}, current health: ${this.HIT_POINTS}`);
        this.HIT_POINTS = Math.max(0, this.HIT_POINTS - amount);
        console.log(`Health after damage: ${this.HIT_POINTS}`);
        this.updateHealthBar();

        if (this.HIT_POINTS <= 0) {
            this.die();
        }
    }

    public heal(amount: number): void {
        this.HIT_POINTS = Math.min(this.MAX_HIT_POINTS, this.HIT_POINTS + amount);
        this.updateHealthBar();
    }

    protected abstract die(): void;

    public getPosition(): [number, number] {
        return [this.x, this.y];
    }

    public getHealth(): number {
        return this.HIT_POINTS;
    }

    public getMaxHealth(): number {
        return this.MAX_HIT_POINTS;
    }

    public getVelocity(): number {
        return this.VELOCITY;
    }

    public isDead(): boolean {
        return this.HIT_POINTS <= 0;
    }

    public initializeHealthBar(): void {
        if (!this.healthBar) {
            this.createHealthBar();
        }
    }

    public createNameTag(): void {
        if (!this.entity_text) {
            console.log(`Creating name tag for ${this.entity_type} at (${this.x}, ${this.y})`);
            this.entity_text = this.scene.add.bitmapText(this.x, this.y - 30, 'pixel-white', this.entity_type, 12);
            this.entity_text.setOrigin(0.5, 0.5);
            this.entity_text.setScrollFactor(1); // Follow world scroll
            this.entity_text.setDepth(100);
            console.log(`Name tag created successfully for ${this.entity_type}`);
        }
    }

    public updateNameTag(): void {
        if (this.entity_text) {
            this.entity_text.setPosition(this.x, this.y - 30);
        }
    }
}
