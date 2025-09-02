import Phaser from 'phaser';
import { updateHealthBar } from '../../lib/HelperFunc';
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
        
        // Create health bar
        this.createHealthBar();
    }

    protected createHealthBar(): void {
        this.healthBar = this.scene.add.graphics();
        this.healthBarText = this.scene.add.bitmapText(this.x, this.y - 30, 'pixel-white', '', 16);
        this.updateHealthBar();
    }

    protected updateHealthBar(): void {
        updateHealthBar(this.healthBar, this.HIT_POINTS, this.MAX_HIT_POINTS, this.x, this.y - 30, GameConfig.UI.HEALTH_BAR_WIDTH_DEFAULT, GameConfig.UI.HEALTH_BAR_HEIGHT_DEFAULT);
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
}
