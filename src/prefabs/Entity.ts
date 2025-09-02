import Phaser from 'phaser';
import GameConfig from '../config/GameConfig';

export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
    protected HIT_POINTS: number;
    protected MAX_HIT_POINTS: number;
    protected VELOCITY: number;
    protected healthBar!: Phaser.GameObjects.Graphics;
    protected healthBarText!: Phaser.GameObjects.BitmapText;

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
        this.healthBarText = this.scene.add.bitmapText(this.x, this.y, 'pixel-white', `${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`, 16);

        // Draw initial health bar
        this.healthBar.clear();
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(
            this.x,
            this.y,
            GameConfig.UI.HEALTH_BAR_WIDTH,
            GameConfig.UI.HEALTH_BAR_HEIGHT
        );
    }

    protected updateHealthBar(): void {
        // Store health data in the entity for the helper function to access
        this.setData('hitPoints', this.HIT_POINTS);
        this.setData('maxHitPoints', this.MAX_HIT_POINTS);

        // Update health bar position
        if (this.healthBar && this.healthBarText) {
            this.healthBar.setPosition(this.x / 2, this.y / 2);
        }
    }

    public takeDamage(amount: number): void {
        this.HIT_POINTS = Math.max(0, this.HIT_POINTS - amount);
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

    public isDead(): boolean {
        return this.HIT_POINTS <= 0;
    }

    public initializeHealthBar(): void {
        if (!this.healthBar) {
            this.createHealthBar();
        }
    }
}
