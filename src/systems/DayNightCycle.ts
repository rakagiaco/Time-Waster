/**
 * Day/Night Cycle System
 * 
 * Manages dynamic lighting and time progression throughout the game world.
 * Creates immersive environmental changes that affect gameplay mechanics
 * including enemy behavior, visibility, and atmosphere.
 * 
 * Features:
 * - Configurable cycle timing and transitions
 * - Visual overlay system for darkness effects
 * - Real-time display of current game time
 * - Debug controls for testing different times
 * - Integration with AI detection systems
 */

import Phaser from 'phaser';

/**
 * Configuration interface for day/night cycle timing
 */
export interface DayNightConfig {
    cycleDuration: number;      // Total cycle duration in milliseconds
    dayDuration: number;        // Day duration in milliseconds  
    nightDuration: number;      // Night duration in milliseconds
    transitionDuration: number; // Transition duration in milliseconds
}

/**
 * Day/Night Cycle Management Class
 * 
 * Handles time progression, lighting changes, and environmental effects
 * throughout the game world. Integrates with other systems for dynamic
 * gameplay modifications based on time of day.
 */
export class DayNightCycle {
    private scene: Phaser.Scene;                          // Scene reference for rendering
    private config: DayNightConfig;                       // Timing configuration
    private currentTime: number = 0.5;                    // Current cycle position (0-1) - 12 PM (noon/midday start)
    private isDay: boolean = true;                         // Current day/night state
    private isTransitioning: boolean = false;             // Whether in transition period
    
    // Visual rendering components
    private overlay: Phaser.GameObjects.Graphics | null = null;      // Main camera darkness overlay
    private minimapOverlay: Phaser.GameObjects.Graphics | null = null; // Minimap camera darkness overlay
    private timeText: Phaser.GameObjects.BitmapText | null = null;   // Time display
    
    // Development and testing tools  
    private debugMode: boolean = false;                   // Debug mode toggle
    private debugTimeOverride: number | null = null;      // Manual time override

    /**
     * Creates a new day/night cycle system
     * 
     * @param scene - The Phaser scene to attach visual elements to
     * @param config - Optional configuration overrides for timing
     * @param initialTime - Optional initial time position (0-1) for save game restoration
     */
    constructor(scene: Phaser.Scene, config?: Partial<DayNightConfig>, initialTime?: number) {
        this.scene = scene;
        
        // Merge default configuration with any provided overrides
        this.config = {
            cycleDuration: 24 * 60 * 1000,       // 24 minutes total cycle (1 real minute = 1 game hour)
            dayDuration: 12 * 60 * 1000,         // 12 minutes of daylight
            nightDuration: 12 * 60 * 1000,       // 12 minutes of darkness
            transitionDuration: 2 * 60 * 1000,   // 2 minutes for dawn/dusk
            ...config
        };
        
        // Set initial time (for save game restoration or custom start time)
        if (initialTime !== undefined) {
            this.currentTime = initialTime;
            console.log(`DayNightCycle initialized with saved time: ${initialTime}`);
        } else {
            console.log(`DayNightCycle initialized with default time: ${this.currentTime}`);
        }
        
        // Update day/night state based on current time
        this.updateDayNightState();
        
        // Initialize visual components and controls
        this.setupVisualElements();
        this.setupDebugControls();
    }

    private setupVisualElements(): void {
        // Create main camera overlay for darkness
        this.overlay = this.scene.add.graphics();
        this.overlay.setDepth(1000);
        this.overlay.setScrollFactor(0); // Fixed to camera
        this.overlay.setBlendMode(Phaser.BlendModes.NORMAL); // Normal blend so ERASE can work on it
        
        // Create minimap overlay for darkness (positioned like ring, not camera-relative)
        this.minimapOverlay = this.scene.add.graphics();
        this.minimapOverlay.setDepth(999); // Just below ring (depth 1000) but above camera content
        this.minimapOverlay.setScrollFactor(0); // Fixed to screen like the ring
        
        // Create time display
        this.timeText = this.scene.add.bitmapText(
            this.scene.cameras.main.width - 200, 
            20, 
            '8-bit', 
            '', 
            16
        ).setOrigin(1, 0);
        this.timeText.setDepth(1001);
        this.timeText.setScrollFactor(0);
        this.timeText.setTint(0xffffff);
        this.timeText.setScale(2)
    }

    private setupDebugControls(): void {
        // Add debug key controls
        this.scene.input.keyboard?.on('keydown-F2', () => {
            this.toggleDebugMode();
        });
        
        // F3 and F4 day/night toggles are now handled by DebugManager
    }

    public update(delta: number): void {
        if (this.debugMode && this.debugTimeOverride !== null) {
            this.currentTime = this.debugTimeOverride;
        } else {
            // Update time based on cycle duration
            this.currentTime += delta / this.config.cycleDuration;
            if (this.currentTime >= 1) {
                this.currentTime = 0;
            }
        }
        
        this.updateDayNightState();
        this.updateVisuals();
        this.updateTimeDisplay();
    }

    private updateDayNightState(): void {
        const wasDay = this.isDay;
        
        // Convert current time (0-1) to hours (0-24)
        const currentHour = this.currentTime * 24;
        
        // Define day/night periods (matching visual system)
        const dawnStart = 5;     // 5 AM - dawn begins
        const dayStart = 7;      // 7 AM - full daylight
        const duskStart = 19;    // 7 PM - dusk begins  
        const nightStart = 21;   // 9 PM - full darkness
        
        // Determine if it's day or night
        if (currentHour >= dayStart && currentHour < duskStart) {
            this.isDay = true;
            this.isTransitioning = false;
        } else if (currentHour >= nightStart || currentHour < dawnStart) {
            this.isDay = false;
            this.isTransitioning = false;
        } else {
            // In transition periods (dawn or dusk)
            this.isTransitioning = true;
            // Consider transition as day if closer to day, night if closer to night
            if (currentHour >= dawnStart && currentHour < dayStart) {
                this.isDay = false; // Dawn - transitioning from night to day
            } else {
                this.isDay = true; // Dusk - transitioning from day to night
            }
        }
        
        // Notify scene of day/night change
        if (wasDay !== this.isDay) {
            this.scene.events.emit('dayNightChange', { isDay: this.isDay, isTransitioning: this.isTransitioning });
        }
    }

    private updateVisuals(): void {
        if (!this.overlay) return;
        
        // Calculate darkness intensity based on time of day
        let darknessIntensity = 0;
        
        // Convert current time (0-1) to hours (0-24)
        const currentHour = this.currentTime * 24;
        
        // Define day/night periods
        const dawnStart = 5;     // 5 AM - dawn begins
        const dayStart = 7;      // 7 AM - full daylight
        const duskStart = 19;    // 7 PM - dusk begins  
        const nightStart = 21;   // 9 PM - full darkness
        
        if (currentHour >= nightStart || currentHour < dawnStart) {
            // Full night (9 PM to 5 AM) - almost impossible to see
            darknessIntensity = 0.95; // Very dark, nearly black
        } else if (currentHour >= duskStart && currentHour < nightStart) {
            // Dusk transition (7 PM to 9 PM)
            const duskProgress = (currentHour - duskStart) / (nightStart - duskStart);
            darknessIntensity = duskProgress * 0.95;
        } else if (currentHour >= dawnStart && currentHour < dayStart) {
            // Dawn transition (5 AM to 7 AM)
            const dawnProgress = (currentHour - dawnStart) / (dayStart - dawnStart);
            darknessIntensity = 0.95 * (1 - dawnProgress);
        } else {
            // Full day (7 AM to 7 PM)
            darknessIntensity = 0;
        }
        
        // Update main camera overlay
        this.updateMainCameraOverlay(darknessIntensity);
        
        // Update minimap overlay
        this.updateMinimapOverlay(darknessIntensity);
        
        // Emit darkness intensity for other systems (flashlight, tree lights)
        this.scene.events.emit('darknessIntensityChange', darknessIntensity);
    }

    private updateMainCameraOverlay(darknessIntensity: number): void {
        if (!this.overlay) return;
        
        const camera = this.scene.cameras.main;
        const width = camera.width;
        const height = camera.height;
        
        this.overlay.clear();
        
        // Draw darkness overlay if there's any darkness
        if (darknessIntensity > 0) {
            this.overlay.fillStyle(0x000000, darknessIntensity); // Pure black for maximum darkness
            this.overlay.fillRect(0, 0, width, height);
        }
    }

    private updateMinimapOverlay(darknessIntensity: number): void {
        if (!this.minimapOverlay) return;
        
        // Use exact same values as minimap setup (hardcoded to match ring positioning)
        const minimapSize = 175;
        const minimapX = 20;
        const minimapY = 20;
        
        // Calculate circle center and radius to match medieval ring exactly
        const centerX = minimapX + minimapSize / 2;
        const centerY = minimapY + minimapSize / 2;
        const outerRadius = (minimapSize / 2) + 8; // Match outer radius of medieval ring
        
        this.minimapOverlay.clear();
        
        // Draw circular darkness overlay to fill entire ring area
        if (darknessIntensity > 0) {
            this.minimapOverlay.fillStyle(0x000000, darknessIntensity); // Pure black for consistency
            this.minimapOverlay.fillCircle(centerX, centerY, outerRadius);
        }
    }

    private updateTimeDisplay(): void {
        if (!this.timeText) return;
        
        const hours = Math.floor(this.currentTime * 24);
        const minutes = Math.floor((this.currentTime * 24 * 60) % 60);
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        const period = this.isDay ? 'DAY' : 'NIGHT';
        const color = this.isDay ? 0xffff00 : 0x4444ff;
        
        this.timeText.setText(`${timeString} - ${period}`);
        this.timeText.setTint(color);
    }

    // Public methods
    public isCurrentlyDay(): boolean {
        return this.isDay;
    }

    public isCurrentlyNight(): boolean {
        return !this.isDay;
    }

    public isInTransition(): boolean {
        return this.isTransitioning;
    }

    public getCurrentTime(): number {
        return this.currentTime;
    }

    public getTimeOfDay(): 'day' | 'night' | 'transition' {
        if (this.isTransitioning) return 'transition';
        return this.isDay ? 'day' : 'night';
    }

    public getDarknessIntensity(): number {
        // Convert current time (0-1) to hours (0-24)
        const currentHour = this.currentTime * 24;
        
        // Define day/night periods (matching visual system)
        const dawnStart = 5;     // 5 AM - dawn begins
        const dayStart = 7;      // 7 AM - full daylight
        const duskStart = 19;    // 7 PM - dusk begins  
        const nightStart = 21;   // 9 PM - full darkness
        
        if (currentHour >= nightStart || currentHour < dawnStart) {
            // Full night (9 PM to 5 AM)
            return 0.85;
        } else if (currentHour >= duskStart && currentHour < nightStart) {
            // Dusk transition (7 PM to 9 PM)
            const duskProgress = (currentHour - duskStart) / (nightStart - duskStart);
            return duskProgress * 0.85;
        } else if (currentHour >= dawnStart && currentHour < dayStart) {
            // Dawn transition (5 AM to 7 AM)
            const dawnProgress = (currentHour - dawnStart) / (dayStart - dawnStart);
            return 0.85 * (1 - dawnProgress);
        } else {
            // Full day (7 AM to 7 PM)
            return 0;
        }
    }

    // Debug methods
    public toggleDebugMode(): void {
        this.debugMode = !this.debugMode;
        console.log(`Day/Night debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    }

    public setToPeakDay(): void {
        this.debugTimeOverride = 0.5; // 12 PM (noon) - true peak day
        console.log('Set to peak day (12 PM noon)');
    }

    public setToPeakNight(): void {
        this.debugTimeOverride = 0.0; // 12 AM (midnight) - true peak night
        console.log('Set to peak night (12 AM midnight)');
    }

    public setTime(time: number): void {
        this.debugTimeOverride = Math.max(0, Math.min(1, time));
        console.log(`Set time to ${(time * 24).toFixed(1)} hours`);
    }

    public setDarknessIntensity(intensity: number): void {
        // This method is used by save system, but we calculate darkness based on time
        // So we need to reverse-engineer what time would produce this darkness
        if (intensity <= 0) {
            this.setTime(0.5); // Noon
        } else {
            this.setTime(0.0); // Midnight
        }
        console.log(`Set darkness intensity to ${intensity} (approximated time)`);
    }

    public setupMinimapCamera(): void {
        // Called by World scene after minimap is created to configure camera ignores
        const worldScene = this.scene as any;
        if (worldScene.miniMapCamera && this.overlay && this.minimapOverlay) {
            // Main camera sees main overlay but not minimap overlay
            this.scene.cameras.main.ignore(this.minimapOverlay);
            
            // Minimap camera ignores both main overlay AND minimap overlay (like the ring)
            worldScene.miniMapCamera.ignore(this.overlay);
            worldScene.miniMapCamera.ignore(this.minimapOverlay);
            
            console.log('Day/Night cycle: Configured camera overlays - minimap camera ignores both overlays');
        }
    }

    public destroy(): void {
        if (this.overlay) {
            this.overlay.destroy();
        }
        if (this.minimapOverlay) {
            this.minimapOverlay.destroy();
        }
        if (this.timeText) {
            this.timeText.destroy();
        }
    }
}
