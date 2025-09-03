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
        // Create light mask that will punch holes in the darkness
        this.lightMask = this.scene.add.graphics();
        this.lightMask.setDepth(1001); // Above darkness overlay (depth 1000)
        this.lightMask.setScrollFactor(0);
        this.lightMask.setBlendMode(Phaser.BlendModes.ERASE); // This erases from darkness overlay
        
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
        if (!this.isActive) return;
        
        // Flashlight works when it's dark (darkness intensity > 0.1)
        if (this.darknessIntensity < 0.1) {
            // Hide light graphics during day but keep flashlight active
            if (this.lightMask) this.lightMask.setVisible(false);
            if (this.lightOverlay) this.lightOverlay.setVisible(false);
            return;
        } else {
            // Show light graphics during night
            if (this.lightMask) this.lightMask.setVisible(true);
            if (this.lightOverlay) this.lightOverlay.setVisible(true);
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
        
        // Create the mask that erases darkness (punch hole in darkness overlay)
        this.lightMask.fillStyle(0xffffff, 1); // White color will erase darkness when using ERASE blend mode
        this.lightMask.fillCircle(0, 0, currentRadius);
        
        // Add a soft edge to the light mask for realistic falloff
        const falloffSteps = 8;
        for (let i = 0; i < falloffSteps; i++) {
            const alpha = 1 - (i / falloffSteps);
            const radius = currentRadius * (1 + (i * 0.1));
            this.lightMask.fillStyle(0xffffff, alpha * 0.5);
            this.lightMask.fillCircle(0, 0, radius);
        }
        
        // Create atmospheric light glow (visible light effect)
        const glowIntensity = Math.min(0.4, this.darknessIntensity * 0.6);
        if (glowIntensity > 0) {
            // Inner bright glow
            this.lightOverlay.fillStyle(this.config.color, glowIntensity);
            this.lightOverlay.fillCircle(0, 0, currentRadius * 0.7);
            
            // Outer soft glow
            this.lightOverlay.fillStyle(this.config.color, glowIntensity * 0.3);
            this.lightOverlay.fillCircle(0, 0, currentRadius * 1.2);
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
