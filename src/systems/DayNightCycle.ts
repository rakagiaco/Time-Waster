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
    private timeText: Phaser.GameObjects.BitmapText | null = null;   // Time display

    // Development and testing tools  
    private debugMode: boolean = false;                   // Debug mode toggle
    private debugTimeOverride: number | null = null;      // Manual time override

    private darknessIntensity: number = 0;               // Current darkness intensity (0-1)

    /**
     * Creates a new day/night cycle system
     * 
     * @param scene - The Phaser scene to attach visual elements to
     * @param initialTime - Optional initial time position (0-1) for save game restoration
     */
    constructor(scene: Phaser.Scene, initialTime?: number) {
        this.scene = scene;

        this.config = {
            cycleDuration: 24 * 60 * 1000,       // 24 minutes total cycle (1 real minute = 1 game hour)
            dayDuration: 12 * 60 * 1000,         // 12 minutes of daylight
            nightDuration: 12 * 60 * 1000,       // 12 minutes of darkness
            transitionDuration: 2 * 60 * 1000,   // 2 minutes for dawn/dusk
        };
    
        // comment this in for 1 minute cycles fo testing
        // this.config = {
        //     cycleDuration: 60 * 1000,       // 24 minutes total cycle (1 real minute = 1 game hour)
        //     dayDuration: 60 * 1000,         // 12 minutes of daylight
        //     nightDuration: 60 * 1000,       // 12 minutes of darkness
        //     transitionDuration: 60 * 1000,   // 2 minutes for dawn/dusk
        // };

        // Set initial time (for save game restoration or custom start time)
        if (initialTime !== undefined) {
            this.currentTime = initialTime;
            // DayNightCycle initialized with saved time
        } else {
            this.currentTime = 0.5
            // DayNightCycle initialized with default time
        }

        // Initialize visual components and controls
        this.setupVisualElements();
    }

    private setupVisualElements(): void {
        // Create main camera overlay for darkness
        this.overlay = this.scene.add.graphics();
        this.overlay.setDepth(1000);
        this.overlay.setScrollFactor(0); // Fixed to camera
        this.overlay.setBlendMode(Phaser.BlendModes.NORMAL); // Normal blend so ERASE can work on it

        // Create time display - positioned at center top to avoid quest UI
        this.timeText = this.scene.add.bitmapText(
            this.scene.cameras.main.width / 2, // Center of screen
            20, // Top of screen
            '8-bit',
            '',
            16
        ).setOrigin(0.5, 0); // Center-aligned
        this.timeText.setDepth(1001);
        this.timeText.setScrollFactor(0);
        this.timeText.setScale(2)
    }

    public update(delta: number): void {
        if (this.debugMode && this.debugTimeOverride !== null) {
            this.currentTime = this.debugTimeOverride;
            // Debug: Log when time is frozen
            if (Math.random() < 0.001) { // Log occasionally to avoid spam
                // Time frozen at debug override
            }
        } else {
            // Update time based on cycle duration
            this.currentTime += delta / this.config.cycleDuration;
            if (this.currentTime >= 1) {
                this.currentTime = 0;
            }
        }

        this.updateDayNightState();
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
            this.darknessIntensity = 0;
        } else if (currentHour >= nightStart || currentHour < dawnStart) {
            this.isDay = false;
            this.isTransitioning = false;
            this.darknessIntensity = 0.95; // Very dark, nearly black
        } else {
            // In transition periods (dawn or dusk)
            this.isTransitioning = true;
            if (currentHour >= duskStart && currentHour < nightStart) {
                // Dusk transition (7 PM to 9 PM)
                const duskProgress = (currentHour - duskStart) / (nightStart - duskStart);
                this.darknessIntensity = duskProgress * 0.95;
                this.isDay = false; // Should be false during dusk
            } else if (currentHour >= dawnStart && currentHour < dayStart) {
                // Dawn transition (5 AM to 7 AM)
                const dawnProgress = (currentHour - dawnStart) / (dayStart - dawnStart);
                this.darknessIntensity = 0.95 * (1 - dawnProgress);
                this.isDay = true; // Should be true during dawn
            }
        }

        this.updateMainCameraOverlay();
        this.scene.events.emit('darknessIntensityChange', this.darknessIntensity);

        // Notify scene of day/night change
        if (wasDay !== this.isDay) {
            this.scene.events.emit('dayNightChange', { isDay: this.isDay, isTransitioning: this.isTransitioning });
        }
    }

    private updateMainCameraOverlay(): void {
        if (!this.overlay) return;

        const camera = this.scene.cameras.main;
        const width = camera.width;
        const height = camera.height;

        this.overlay.clear();

        // Draw darkness overlay if there's any darkness
        if (this.darknessIntensity > 0) {
            this.overlay.fillStyle(0x000000, this.darknessIntensity); // Pure black for maximum darkness
            this.overlay.fillRect(0, 0, width, height);
        }
        
        // Debug logging for darkness intensity
        if (this.darknessIntensity > 0.1) {
            // Drawing darkness overlay
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
    public getOverlay(): Phaser.GameObjects.Graphics {
        if (!this.overlay) {
            throw new Error("DayNightCycle overlay not initialized");
        }
        return this.overlay;
    }

    public isCurrentlyNight(): boolean {
        return !this.isDay;
    }

    public getCurrentTime(): number {
        return this.currentTime;
    }

    public getTimeOfDay(): 'day' | 'night' | 'transition' {
        if (this.isTransitioning) return 'transition';
        return this.isDay ? 'day' : 'night';
    }

    public getDarknessIntensity(): number {
        return this.darknessIntensity
    }

    public setToPeakDay(): void {
        this.debugMode = true;
        this.debugTimeOverride = 0.5; // 12 PM (noon) - true peak day
        // Set to peak day
    }

    public setToPeakNight(): void {
        this.debugMode = true;
        this.debugTimeOverride = 0.0; // 12 AM (midnight) - true peak night
        // Set to peak night
    }

    public setTime(time: number): void {
        this.debugMode = true;
        this.debugTimeOverride = Math.max(0, Math.min(1, time));
        // Set time
    }

    /**
     * Restores saved time without enabling debug mode (for save game loading)
     * @param time - Time position to restore (0-1)
     */
    public restoreSavedTime(time: number): void {
        this.currentTime = Math.max(0, Math.min(1, time));
        // Ensure debug mode is disabled so time can progress normally
        this.debugMode = false;
        this.debugTimeOverride = null;
        // Restored saved time - time will progress normally
    }

    public disableDebugMode(): void {
        this.debugMode = false;
        this.debugTimeOverride = null;
        // Debug mode disabled - returning to normal time progression
    }

    public forceResetDebugMode(): void {
        this.debugMode = false;
        this.debugTimeOverride = null;
        // FORCE RESET: Debug mode disabled - time should now progress normally
    }

    public setDarknessIntensity(intensity: number): void {
        this.darknessIntensity = intensity
        // Set darkness intensity
    }

    public destroy(): void {
        if (this.overlay) {
            this.overlay.destroy();
        }
        if (this.timeText) {
            this.timeText.destroy();
        }
    }
}
