
import Phaser from 'phaser';

/**
 * Optimized Lantern System
 * - Lantern and flame sprites are generated from Graphics → Texture
 * - Light effect is a single pre-rendered radial gradient texture
 * - Flicker is done with scale/alpha instead of redrawing circles
 */
export class Lantern {
    private scene: Phaser.Scene;
    private player: any;
    private lanternSprite: Phaser.GameObjects.Sprite | null = null;
    private flameSprite: Phaser.GameObjects.Sprite | null = null;
    private lightSprite: Phaser.GameObjects.Image | null = null;
    private isActive: boolean = false;
    private flickerTimer: number = 0;

    constructor(scene: Phaser.Scene, player: any) {
        this.scene = scene;
        this.player = player;

        // Create textures once
        this.createLanternTexture();
        this.createFlameTexture();
        this.createLightTexture();

        // Setup sprites
        this.setupLantern();
    }

    private createLanternTexture(): void {
        const graphics = this.scene.add.graphics();

        // Lantern body
        graphics.fillStyle(0x2C1810);
        graphics.fillRect(0, 0, 6, 12);

        // Glass panels
        graphics.fillStyle(0x4A4A4A, 0.3);
        graphics.fillRect(1, 2, 4, 8);

        // Frame details
        graphics.fillStyle(0x1A1A1A);
        graphics.fillRect(0, 0, 6, 1);
        graphics.fillRect(0, 11, 6, 1);
        graphics.fillRect(0, 0, 1, 12);
        graphics.fillRect(5, 0, 1, 12);

        // Handle attachment
        graphics.fillStyle(0x3C3C3C);
        graphics.fillRect(2, -2, 2, 2);

        // Base
        graphics.fillStyle(0x2C1810);
        graphics.fillRect(1, 12, 4, 2);

        graphics.generateTexture('lantern-sprite', 8, 16);
        graphics.destroy();
    }

    private createFlameTexture(): void {
        const graphics = this.scene.add.graphics();

        // Flame base
        graphics.fillStyle(0xFF4500);
        graphics.fillRect(2, 2, 2, 3);

        // Flame middle
        graphics.fillStyle(0xFF8C00);
        graphics.fillRect(2, 1, 2, 2);

        // Flame top
        graphics.fillStyle(0xFFFF00);
        graphics.fillRect(2, 0, 2, 1);

        graphics.generateTexture('flame-sprite', 6, 6);
        graphics.destroy();
    }

    private createLightTexture(): void {
        const radius = 100; // base radius for light
        const rt = this.scene.textures.createCanvas('lantern-light', radius * 2, radius * 2);

        if (rt) {
            const ctx = rt.getContext();

            const cx = radius;
            const cy = radius;

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, 'rgba(248, 247, 247, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, radius * 2, radius * 2);

            rt.refresh();
        }
    }

    private setupLantern(): void {
        // Lantern
        this.lanternSprite = this.scene.add.sprite(0, 0, 'lantern-sprite');
        this.lanternSprite.setScale(0.8);
        this.lanternSprite.setDepth(500);
        this.lanternSprite.setVisible(false);

        // Flame
        this.flameSprite = this.scene.add.sprite(0, 0, 'flame-sprite');
        this.flameSprite.setScale(0.6);
        this.flameSprite.setDepth(501);
        this.flameSprite.setVisible(false);

        // Light effect (prebaked gradient)
        this.lightSprite = this.scene.add.image(0, 0, 'lantern-light');
        this.lightSprite.setOrigin(0.5, 0.5);
        this.lightSprite.setBlendMode(Phaser.BlendModes.ADD);
        this.lightSprite.setDepth(1000);
        this.lightSprite.setVisible(false);
    }

    public update(): void {
        if (!this.lanternSprite || !this.flameSprite || !this.lightSprite) return;

        this.flickerTimer += 0.1;

        const lx = this.player.x + 15;
        const ly = this.player.y - 8;

        // Position sprites
        this.lanternSprite.setPosition(lx, ly);
        this.flameSprite.setPosition(lx, ly);
        this.lightSprite.setPosition(lx, ly);

        if (this.isActive) {
            // Flicker scale for light
            const flickerScale = Math.sin(this.flickerTimer) * 0.05 + 0.95;

            const darknessIntensity = this.getDarknessIntensity();
            const baseScale = darknessIntensity > 0.3 ? 1 : 0;

            this.lightSprite.setScale(baseScale * flickerScale);
            this.lightSprite.setAlpha(darknessIntensity);
        }
    }

    private getDarknessIntensity(): number {
        const worldScene = this.scene as any;
        if (worldScene.dayNightCycle) {
            return worldScene.dayNightCycle.getDarknessIntensity();
        }
        return 0.8; // fallback
    }

    public toggle(): void {
        this.setActive(!this.isActive);
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        if (this.lanternSprite) this.lanternSprite.setVisible(active);
        if (this.flameSprite) this.flameSprite.setVisible(active);
        if (this.lightSprite) this.lightSprite.setVisible(active);
    }

    public isLit(): boolean {
        return this.isActive;
    }

    public destroy(): void {
        this.lanternSprite?.destroy();
        this.flameSprite?.destroy();
        this.lightSprite?.destroy();
    }
}
