import Phaser from 'phaser';

export interface LanternConfig {
    radius: number;
    intensity: number;
    color: number;
    flickerIntensity: number;
    flickerSpeed: number;
    offsetX: number; // Offset from player center
    offsetY: number;
}

/**
 * Lantern System - Creates a held lantern that emanates light to cancel out darkness
 * The lantern effectiveness scales dynamically with darkness levels
 */
export class Lantern {
    private scene: Phaser.Scene;
    private player: Phaser.GameObjects.Sprite;
    private config: LanternConfig;
    
    // Visual elements
    private lanternSprite: Phaser.GameObjects.Sprite | null = null;
    private lightMask: Phaser.GameObjects.Graphics | null = null;
    private lightGlow: Phaser.GameObjects.Graphics | null = null;
    private isActive: boolean = false;
    
    // Animation and effects
    private flickerTimer: number = 0;
    private baseRadius: number;
    private darknessIntensity: number = 0;
    
    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite, config?: Partial<LanternConfig>) {
        this.scene = scene;
        this.player = player;
        this.config = {
            radius: 100,
            intensity: 0.9,
            color: 0xffaa44, // Warm lantern light
            flickerIntensity: 0.08,
            flickerSpeed: 0.015,
            offsetX: 15, // Hold lantern to the right side
            offsetY: -5,
            ...config
        };
        
        this.baseRadius = this.config.radius;
        this.setupLantern();
        this.setupDarknessListener();
    }

    private setupLantern(): void {
        // Create custom pixel art lantern using graphics
        this.lanternSprite = this.scene.add.graphics();
        this.lanternSprite.setDepth(500); // Above player
        this.lanternSprite.setVisible(false);
        this.createPixelArtLantern();
        
        // Create lantern light mask - reduces darkness intensity with distance
        this.lightMask = this.scene.add.graphics();
        this.lightMask.setDepth(1001); // Above darkness overlay (depth 1000)
        this.lightMask.setScrollFactor(0); // Fixed to screen like darkness overlay
        this.lightMask.setBlendMode(Phaser.BlendModes.ERASE); // Erases darkness based on distance
        
        // Create warm atmospheric glow (purely visual)
        this.lightGlow = this.scene.add.graphics();
        this.lightGlow.setDepth(1002); // Above light mask
        this.lightGlow.setScrollFactor(0);
        this.lightGlow.setBlendMode(Phaser.BlendModes.ADD); // Additive warm glow
        
        console.log('Lantern system initialized - toggle mode with gradient masking');
    }

    private createPixelArtLantern(): void {
        if (!this.lanternSprite) return;
        
        const g = this.lanternSprite as Phaser.GameObjects.Graphics;
        g.clear();
        
        // Lantern body (dark metal frame)
        g.fillStyle(0x2C1810); // Dark brown/black metal
        g.fillRect(-3, -8, 6, 12); // Main frame
        
        // Lantern glass panels (slightly transparent)
        g.fillStyle(0x4A4A4A, 0.3); // Semi-transparent gray
        g.fillRect(-2, -6, 4, 8); // Glass panel
        
        // Metal frame details
        g.fillStyle(0x1A1A1A); // Very dark metal
        g.fillRect(-3, -8, 6, 1); // Top frame
        g.fillRect(-3, 3, 6, 1); // Bottom frame
        g.fillRect(-3, -8, 1, 12); // Left frame
        g.fillRect(2, -8, 1, 12); // Right frame
        
        // Lantern handle/chain attachment (top)
        g.fillStyle(0x3C3C3C); // Medium gray metal
        g.fillRect(-1, -10, 2, 2); // Handle attachment
        
        // Base/bottom of lantern
        g.fillStyle(0x2C1810); // Dark metal
        g.fillRect(-2, 4, 4, 2); // Bottom base
        
        // Create animated flame effect (will be updated each frame)
        this.updateFlameAnimation();
    }

    private updateFlameAnimation(): void {
        if (!this.lanternSprite) return;
        
        const g = this.lanternSprite as Phaser.GameObjects.Graphics;
        
        // Calculate flame flicker based on timer
        const flicker = Math.sin(this.flickerTimer * 8) * 0.3 + Math.sin(this.flickerTimer * 12) * 0.2;
        const flameHeight = 3 + flicker;
        const flameWidth = 1.5 + Math.abs(flicker) * 0.5;
        
        // Clear previous flame
        g.fillStyle(0x000000, 0); // Transparent to "erase" previous flame
        g.fillRect(-2, -6, 4, 8); // Clear flame area
        
        // Redraw glass first
        g.fillStyle(0x4A4A4A, 0.3);
        g.fillRect(-2, -6, 4, 8);
        
        // Only draw flame if lantern is active
        if (this.isActive) {
            // Draw flame base (orange-red)
            g.fillStyle(0xFF4500); // Orange-red base
            g.fillRect(-Math.floor(flameWidth), -Math.floor(flameHeight), Math.floor(flameWidth * 2), Math.floor(flameHeight));
            
            // Draw flame middle (bright orange)
            g.fillStyle(0xFF8C00); // Bright orange
            g.fillRect(-Math.floor(flameWidth * 0.7), -Math.floor(flameHeight * 0.8), Math.floor(flameWidth * 1.4), Math.floor(flameHeight * 0.6));
            
            // Draw flame top (yellow)
            g.fillStyle(0xFFFF00); // Bright yellow
            g.fillRect(-Math.floor(flameWidth * 0.4), -Math.floor(flameHeight * 0.6), Math.floor(flameWidth * 0.8), Math.floor(flameHeight * 0.3));
            
            // Add tiny bright white core for intensity during dark times
            if (this.darknessIntensity > 0.3) {
                g.fillStyle(0xFFFFFF); // Bright white
                g.fillRect(0, -Math.floor(flameHeight * 0.3), 1, 1);
            }
        }
    }

    private setupDarknessListener(): void {
        // Listen for darkness intensity changes from day/night cycle
        this.scene.events.on('darknessIntensityChange', (intensity: number) => {
            this.darknessIntensity = intensity;
        });
    }

    public update(delta: number): void {
        // Always update flicker timer for smooth animation
        this.flickerTimer += delta * this.config.flickerSpeed;
        
        // Update lantern position and effects
        this.updateLanternPosition();
        this.updateLightEffect();
        
        // Update flame animation if lantern is active
        if (this.isActive) {
            this.updateFlameAnimation();
        }
    }

    private updateLanternPosition(): void {
        if (!this.lanternSprite || !this.lightMask || !this.lightGlow) return;
        
        // Position lantern sprite relative to player (world coordinates)
        this.lanternSprite.x = this.player.x + this.config.offsetX;
        this.lanternSprite.y = this.player.y + this.config.offsetY;
        
        // Convert player position to screen coordinates for light effects
        const camera = this.scene.cameras.main;
        const playerScreenX = this.player.x - camera.scrollX + this.config.offsetX;
        const playerScreenY = this.player.y - camera.scrollY + this.config.offsetY;
        
        // Position light effects at lantern's screen position
        this.lightMask.x = playerScreenX;
        this.lightMask.y = playerScreenY;
        
        this.lightGlow.x = playerScreenX;
        this.lightGlow.y = playerScreenY;
    }

    private updateLightEffect(): void {
        if (!this.lightMask || !this.lightGlow) return;
        
        // Clear previous graphics
        this.lightMask.clear();
        this.lightGlow.clear();
        
        // Don't draw light if lantern is off
        if (!this.isActive) {
            return;
        }
        
        // Only create light effect if there's darkness to counter
        if (this.darknessIntensity <= 0.05) {
            // Very subtle glow during day
            this.lightGlow.fillStyle(this.config.color, 0.02);
            this.lightGlow.fillCircle(0, 0, this.baseRadius * 0.3);
            return;
        }
        
        // Calculate flicker effect
        const flicker = Math.sin(this.flickerTimer) * this.config.flickerIntensity;
        const currentRadius = this.baseRadius * (1 + flicker);
        
        // Create gradient mask that reduces darkness intensity with distance
        // At center: complete darkness removal (normal daytime appearance)  
        // At edge: no darkness removal (full night darkness remains)
        
        // Draw from center to edge with INCREASING intensity (opposite of what we want visually)
        // Because ERASE mode: higher intensity = more darkness removal = brighter
        const gradientSteps = 20;
        
        for (let i = 0; i < gradientSteps; i++) {
            // Calculate radius for this step (from center to edge)
            const radiusRatio = (i + 1) / gradientSteps; // 1/20, 2/20, ... 20/20
            const stepRadius = currentRadius * radiusRatio;
            
            // Calculate mask intensity - REVERSE the logic
            // We want center to be BRIGHT (remove all darkness)
            // We want edge to be DARK (remove no darkness)
            // So: center = high erase intensity, edge = low erase intensity
            const distanceFromCenter = i / (gradientSteps - 1); // 0 at center, 1 at edge
            const eraseIntensity = (1 - distanceFromCenter) * this.darknessIntensity; // High at center, low at edge
            
            // Draw this step
            if (eraseIntensity > 0.01) {
                this.lightMask.fillStyle(0xffffff, eraseIntensity);
                this.lightMask.fillCircle(0, 0, stepRadius);
            }
        }
        
        // Add subtle warm atmospheric glow (purely visual, not affecting darkness)
        const glowIntensity = Math.min(0.08, this.darknessIntensity * 0.15);
        
        // Very subtle warm glow only at the edge where darkness transitions
        this.lightGlow.fillStyle(this.config.color, glowIntensity);
        this.lightGlow.fillCircle(0, 0, currentRadius * 0.9);
        
        // Even more subtle outer glow
        this.lightGlow.fillStyle(this.config.color, glowIntensity * 0.3);
        this.lightGlow.fillCircle(0, 0, currentRadius * 1.1);
    }

    public light(): void {
        this.isActive = true;
        if (this.lanternSprite) {
            this.lanternSprite.setVisible(true);
            this.createPixelArtLantern(); // Redraw lantern with flame
        }
        console.log('Lantern lit');
    }

    public extinguish(): void {
        this.isActive = false;
        if (this.lanternSprite) {
            // Clear flame but keep lantern structure visible briefly
            const g = this.lanternSprite as Phaser.GameObjects.Graphics;
            g.clear();
            this.createPixelArtLantern(); // Redraw without flame
            
            // Hide completely after a brief moment
            this.scene.time.delayedCall(100, () => {
                if (this.lanternSprite) this.lanternSprite.setVisible(false);
            });
        }
        if (this.lightMask) this.lightMask.clear();
        if (this.lightGlow) this.lightGlow.clear();
        console.log('Lantern extinguished');
    }

    public toggle(): void {
        if (this.isActive) {
            this.extinguish();
        } else {
            this.light();
        }
    }

    public isLit(): boolean {
        return this.isActive;
    }

    public setActive(active: boolean): void {
        if (active) {
            this.light();
        } else {
            this.extinguish();
        }
    }

    public getDarknessIntensity(): number {
        return this.darknessIntensity;
    }

    public destroy(): void {
        if (this.lanternSprite) {
            this.lanternSprite.destroy();
        }
        if (this.lightMask) {
            this.lightMask.destroy();
        }
        if (this.lightGlow) {
            this.lightGlow.destroy();
        }
        
        // Remove event listeners
        this.scene.events.off('darknessIntensityChange');
        
        console.log('Lantern system destroyed');
    }
}
