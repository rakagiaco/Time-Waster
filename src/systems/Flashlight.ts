import Phaser from 'phaser';

export interface FlashlightConfig {
    radius: number;
    intensity: number;
    color: number;
    flickerIntensity: number;
    flickerSpeed: number;
}

export class Flashlight {
    private scene: Phaser.Scene;
    private player: Phaser.GameObjects.Sprite;
    private config: FlashlightConfig;
    
    // Visual elements
    private lightMask: Phaser.GameObjects.Graphics | null = null;
    private lightOverlay: Phaser.GameObjects.Graphics | null = null;
    private isActive: boolean = false;
    
    // Flicker effect
    private flickerTimer: number = 0;
    private baseRadius: number;
    
    // Darkness response
    private darknessIntensity: number = 0;

    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite, config?: Partial<FlashlightConfig>) {
        this.scene = scene;
        this.player = player;
        this.config = {
            radius: 120,
            intensity: 0.8,
            color: 0xffffaa,
            flickerIntensity: 0.1,
            flickerSpeed: 0.02,
            ...config
        };
        
        this.baseRadius = this.config.radius;
        this.setupLight();
        this.setupDarknessListener();
    }

    private setupLight(): void {
        // Create light mask that will cut holes in the darkness overlay
        this.lightMask = this.scene.add.graphics();
        this.lightMask.setDepth(1001); // Above darkness overlay (depth 1000)
        this.lightMask.setScrollFactor(0); // Fixed to screen like darkness overlay
        this.lightMask.setBlendMode(Phaser.BlendModes.ERASE); // This erases darkness overlay
        
        // Create light glow effect for ambiance
        this.lightOverlay = this.scene.add.graphics();
        this.lightOverlay.setDepth(1002); // Above light mask
        this.lightOverlay.setScrollFactor(0);
    }

    private setupDarknessListener(): void {
        this.scene.events.on('darknessIntensityChange', (intensity: number) => {
            this.darknessIntensity = intensity;
        });
    }

    public update(delta: number): void {
        // Always update flicker timer for smooth animation
        this.flickerTimer += delta * this.config.flickerSpeed;
        
        // Always update position and effect - let updateLightEffect handle visibility logic
        this.updateLightPosition();
        this.updateLightEffect();
    }

    private updateLightPosition(): void {
        if (!this.lightMask || !this.lightOverlay) return;
        
        // Convert player world position to screen coordinates for screen-fixed graphics
        const camera = this.scene.cameras.main;
        const playerScreenX = this.player.x - camera.scrollX;
        const playerScreenY = this.player.y - camera.scrollY;
        
        // Position light graphics at player's screen position (since they're screen-fixed)
        this.lightMask.x = playerScreenX;
        this.lightMask.y = playerScreenY;
        
        this.lightOverlay.x = playerScreenX;
        this.lightOverlay.y = playerScreenY;
    }

    private updateLightEffect(): void {
        if (!this.lightMask || !this.lightOverlay) return;
        
        // Calculate flicker effect
        const flicker = Math.sin(this.flickerTimer) * this.config.flickerIntensity;
        const currentRadius = this.baseRadius * (1 + flicker);
        
        // Always clear previous graphics first
        this.lightMask.clear();
        this.lightOverlay.clear();
        
        // Only draw light if flashlight is active AND there's darkness to cut through
        if (!this.isActive || this.darknessIntensity <= 0.1) {
            return; // Don't draw anything - let darkness overlay show through
        }
        
        // Dynamic light intensity based on darkness level
        // The darker it is, the more effective the flashlight should be
        const lightEffectiveness = Math.min(1.0, this.darknessIntensity * 1.2);
        
        // Create main light circle that erases darkness
        this.lightMask.fillStyle(0xffffff, lightEffectiveness);
        this.lightMask.fillCircle(0, 0, currentRadius);
        
        // Add gradual falloff that responds to darkness intensity
        const falloffSteps = 4;
        for (let i = 1; i <= falloffSteps; i++) {
            const falloffRadius = currentRadius + (i * 8);
            const falloffAlpha = lightEffectiveness * (1.0 - (i / (falloffSteps + 1)));
            this.lightMask.fillStyle(0xffffff, falloffAlpha);
            this.lightMask.fillCircle(0, 0, falloffRadius);
        }
        
        // Create subtle atmospheric glow (not too bright)
        const glowIntensity = Math.min(0.15, this.darknessIntensity * 0.2);
        if (glowIntensity > 0) {
            this.lightOverlay.fillStyle(this.config.color, glowIntensity);
            this.lightOverlay.fillCircle(0, 0, currentRadius * 0.6);
        }
    }

    public activate(): void {
        this.isActive = true;
        if (this.lightMask) this.lightMask.setVisible(true);
        if (this.lightOverlay) this.lightOverlay.setVisible(true);
    }

    public deactivate(): void {
        this.isActive = false;
        if (this.lightMask) this.lightMask.setVisible(false);
        if (this.lightOverlay) this.lightOverlay.setVisible(false);
    }

    public toggle(): void {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    public isLightActive(): boolean {
        return this.isActive;
    }

    public getLightRadius(): number {
        return this.baseRadius;
    }

    public setLightRadius(radius: number): void {
        this.baseRadius = radius;
        this.config.radius = radius;
    }

    public isPointInLight(x: number, y: number): boolean {
        if (!this.isActive) return false;
        
        const distance = Phaser.Math.Distance.Between(
            this.player.x, 
            this.player.y, 
            x, 
            y
        );
        
        return distance <= this.baseRadius;
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        if (this.lightMask) this.lightMask.setVisible(active);
        if (this.lightOverlay) this.lightOverlay.setVisible(active);
        console.log(`Flashlight set to: ${active ? 'ON' : 'OFF'}`);
    }

    public destroy(): void {
        if (this.lightMask) {
            this.lightMask.destroy();
        }
        if (this.lightOverlay) {
            this.lightOverlay.destroy();
        }
    }
}
