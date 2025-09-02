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
        // Create light effect (bright circle that cuts through darkness)
        this.lightMask = this.scene.add.graphics();
        this.lightMask.setDepth(1001); // Above darkness overlay
        this.lightMask.setScrollFactor(0);
        
        // Create light glow effect
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
        if (!this.isActive) return;
        
        // Only work at night (when darkness intensity is high)
        if (this.darknessIntensity < 0.3) {
            this.deactivate();
            return;
        }
        
        this.flickerTimer += delta * this.config.flickerSpeed;
        
        // Update light position to follow player
        this.updateLightPosition();
        this.updateLightEffect();
    }

    private updateLightPosition(): void {
        if (!this.lightMask || !this.lightOverlay) return;
        
        const camera = this.scene.cameras.main;
        const playerScreenX = this.player.x - camera.scrollX;
        const playerScreenY = this.player.y - camera.scrollY;
        
        // Update light mask position
        this.lightMask.x = playerScreenX;
        this.lightMask.y = playerScreenY;
        
        // Update light overlay position
        this.lightOverlay.x = playerScreenX;
        this.lightOverlay.y = playerScreenY;
    }

    private updateLightEffect(): void {
        if (!this.lightMask || !this.lightOverlay) return;
        
        // Calculate flicker effect
        const flicker = Math.sin(this.flickerTimer) * this.config.flickerIntensity;
        const currentRadius = this.baseRadius + (flicker * this.baseRadius);
        
        // Clear previous graphics
        this.lightMask.clear();
        this.lightOverlay.clear();
        
        // Create a mask that cuts through the darkness overlay
        // This creates a transparent circle in the darkness
        this.lightMask.fillStyle(0x000000, 0); // Completely transparent
        this.lightMask.fillCircle(0, 0, currentRadius);
        
        // Create light glow effect (subtle yellow light)
        const glowIntensity = 0.2 + (this.darknessIntensity * 0.3);
        this.lightOverlay.fillStyle(0xffffaa, glowIntensity);
        this.lightOverlay.fillCircle(0, 0, currentRadius * 0.9);
        
        // Outer glow
        this.lightOverlay.fillStyle(0xffffaa, glowIntensity * 0.2);
        this.lightOverlay.fillCircle(0, 0, currentRadius * 1.3);
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

    public destroy(): void {
        if (this.lightMask) {
            this.lightMask.destroy();
        }
        if (this.lightOverlay) {
            this.lightOverlay.destroy();
        }
    }
}
