import Phaser from 'phaser';

/**
 * Simple Lantern System - Creates a sprite from graphics and provides basic light effect
 * Uses the existing lantern graphics design but converts it to a sprite for better performance
 */
export class Lantern {
    private scene: Phaser.Scene;
    private player: any;
    private lanternSprite: Phaser.GameObjects.Sprite | null = null;
    private flameSprite: Phaser.GameObjects.Sprite | null = null;
    private lightEffect: Phaser.GameObjects.Graphics | null = null;
    private isActive: boolean = false;
    private flickerTimer: number = 0;

    constructor(scene: Phaser.Scene, player: any) {
        this.scene = scene;
        this.player = player;
        this.createLanternTexture();
        this.createFlameTexture();
        this.setupLantern();
    }

    private createLanternTexture(): void {
        // Create graphics to draw the lantern
        const graphics = this.scene.add.graphics();

        // Lantern body (dark metal frame)
        graphics.fillStyle(0x2C1810); // Dark brown/black metal
        graphics.fillRect(0, 0, 6, 12); // Main frame

        // Lantern glass panels (slightly transparent)
        graphics.fillStyle(0x4A4A4A, 0.3); // Semi-transparent gray
        graphics.fillRect(1, 2, 4, 8); // Glass panel

        // Metal frame details
        graphics.fillStyle(0x1A1A1A); // Very dark metal
        graphics.fillRect(0, 0, 6, 1); // Top frame
        graphics.fillRect(0, 11, 6, 1); // Bottom frame
        graphics.fillRect(0, 0, 1, 12); // Left frame
        graphics.fillRect(5, 0, 1, 12); // Right frame

        // Lantern handle/chain attachment (top)
        graphics.fillStyle(0x3C3C3C); // Medium gray metal
        graphics.fillRect(2, -2, 2, 2); // Handle attachment

        // Base/bottom of lantern
        graphics.fillStyle(0x2C1810); // Dark metal
        graphics.fillRect(1, 12, 4, 2); // Bottom base

        // Generate texture from graphics
        graphics.generateTexture('lantern-sprite', 8, 16);
        graphics.destroy(); // Clean up graphics object

        // Lantern sprite texture created
    }

    private createFlameTexture(): void {
        // Create graphics to draw the flame
        const graphics = this.scene.add.graphics();

        // Flame base (orange-red)
        graphics.fillStyle(0xFF4500); // Orange-red base
        graphics.fillRect(2, 2, 2, 3);

        // Flame middle (bright orange)
        graphics.fillStyle(0xFF8C00); // Bright orange
        graphics.fillRect(2, 1, 2, 2);

        // Flame top (yellow)
        graphics.fillStyle(0xFFFF00); // Bright yellow
        graphics.fillRect(2, 0, 2, 1);

        // Generate texture from graphics
        graphics.generateTexture('flame-sprite', 6, 6);
        graphics.destroy(); // Clean up graphics object

        // Flame sprite texture created
    }

    private setupLantern(): void {
        // Create lantern sprite using the generated texture
        this.lanternSprite = this.scene.add.sprite(0, 0, 'lantern-sprite');
        this.lanternSprite.setScale(0.8); // Much smaller size
        this.lanternSprite.setDepth(500);
        this.lanternSprite.setVisible(false);

        // Create flame sprite that appears inside the lantern
        this.flameSprite = this.scene.add.sprite(0, 0, 'flame-sprite');
        this.flameSprite.setScale(0.6); // Smaller than lantern
        this.flameSprite.setDepth(501); // Above lantern
        this.flameSprite.setVisible(false);

        // Create light effect that actually provides light (not darkness)
        this.lightEffect = this.scene.add.graphics();
        this.lightEffect.setDepth(1000);
        this.lightEffect.setBlendMode(Phaser.BlendModes.ADD); // Additive blending to create light

        // Lantern system initialized with custom sprite and flame
    }

    public update(): void {
        if (!this.lanternSprite || !this.lightEffect || !this.flameSprite) return;

        // Update flicker timer for flame effect
        this.flickerTimer += 0.1;

        // Position lantern next to player
        this.lanternSprite.x = this.player.x + 15;
        this.lanternSprite.y = this.player.y - 8;

        // Position flame inside the lantern
        this.flameSprite.x = this.player.x + 15;
        this.flameSprite.y = this.player.y - 8;

        // Add flicker animation to flame
        if (this.isActive) {
            const flickerAlpha = Math.sin(this.flickerTimer * 8) * 0.1 + 0.9; // 0.8 to 1.0
            this.flameSprite.setAlpha(flickerAlpha);
        }

        // Update light effect
        this.lightEffect.clear();
        if (this.isActive) {
            this.createGradientLight();
        }
    }

    private createGradientLight(): void {
        // Get darkness intensity from day/night cycle (0 = day, 1 = night)
        const darknessIntensity = this.getDarknessIntensity();

        // Calculate flicker effect
        const flickerRadius = Math.sin(this.flickerTimer) * 0.05 + 0.95;

        // Base light radius - smaller during day, larger at night
        const baseRadius = darknessIntensity > 0.3 ? 45 : 0; // cannot see lantern during day
        const currentRadius = baseRadius * flickerRadius;

        let lightIntensity = darknessIntensity * 0.1;

        // Only draw if intensity is significant
        if (this.lightEffect) {
            // Use warm light color with additive blending
            this.lightEffect.fillStyle(0xffaa44, lightIntensity); // Warm lantern light color
            // Light emanates from lantern position, not player position
            this.lightEffect.fillCircle(this.player.x + 15, this.player.y - 8, currentRadius);
        }
    }

    private getDarknessIntensity(): number {
        // Get darkness intensity from day/night cycle
        // This should match the day/night cycle system
        const worldScene = this.scene as any;
        if (worldScene.dayNightCycle) {
            return worldScene.dayNightCycle.getDarknessIntensity();
        }
        // Fallback - assume it's night if no day/night cycle found
        return 0.8;
    }

    public toggle(): void {
        this.isActive = !this.isActive;
        if (this.lanternSprite) {
            this.lanternSprite.setVisible(this.isActive);
        }
        if (this.flameSprite) {
            this.flameSprite.setVisible(this.isActive);
        }
        // Lantern state changed
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        if (this.lanternSprite) {
            this.lanternSprite.setVisible(this.isActive);
        }
        if (this.flameSprite) {
            this.flameSprite.setVisible(this.isActive);
        }
    }

    // we lit?
    public isLit(): boolean {
        return this.isActive;
    }

    public destroy(): void {
        if (this.lanternSprite) {
            this.lanternSprite.destroy();
        }
        if (this.flameSprite) {
            this.flameSprite.destroy();
        }
        if (this.lightEffect) {
            this.lightEffect.destroy();
        }
        // Lantern system destroyed
    }
}