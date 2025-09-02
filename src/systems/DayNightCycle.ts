import Phaser from 'phaser';

export interface DayNightConfig {
    cycleDuration: number; // Total cycle duration in milliseconds
    dayDuration: number;   // Day duration in milliseconds
    nightDuration: number; // Night duration in milliseconds
    transitionDuration: number; // Transition duration in milliseconds
}

export class DayNightCycle {
    private scene: Phaser.Scene;
    private config: DayNightConfig;
    private currentTime: number = 0.25; // Start at 25% through cycle (6 AM - early day)
    private isDay: boolean = true;
    private isTransitioning: boolean = false;
    
    // Visual elements
    private overlay: Phaser.GameObjects.Graphics | null = null;
    private timeText: Phaser.GameObjects.BitmapText | null = null;
    
    // Debug controls
    private debugMode: boolean = false;
    private debugTimeOverride: number | null = null;

    constructor(scene: Phaser.Scene, config?: Partial<DayNightConfig>) {
        this.scene = scene;
        this.config = {
            cycleDuration: 24 * 60 * 1000, // 24 minutes in milliseconds
            dayDuration: 12 * 60 * 1000,   // 12 minutes day
            nightDuration: 12 * 60 * 1000, // 12 minutes night
            transitionDuration: 2 * 60 * 1000, // 2 minutes transition
            ...config
        };
        
        this.setupVisualElements();
        this.setupDebugControls();
    }

    private setupVisualElements(): void {
        // Create overlay for darkness
        this.overlay = this.scene.add.graphics();
        this.overlay.setDepth(1000);
        this.overlay.setScrollFactor(0); // Fixed to camera
        
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
        const dayStart = 0;
        const dayEnd = this.config.dayDuration / this.config.cycleDuration;
        const nightStart = dayEnd;
        const nightEnd = 1;
        
        const wasDay = this.isDay;
        
        if (this.currentTime >= dayStart && this.currentTime < dayEnd) {
            this.isDay = true;
        } else {
            this.isDay = false;
        }
        
        // Check if we're in transition period
        const transitionStart = dayEnd - (this.config.transitionDuration / this.config.cycleDuration) / 2;
        const transitionEnd = dayEnd + (this.config.transitionDuration / this.config.cycleDuration) / 2;
        
        this.isTransitioning = this.currentTime >= transitionStart && this.currentTime <= transitionEnd;
        
        // Notify scene of day/night change
        if (wasDay !== this.isDay) {
            this.scene.events.emit('dayNightChange', { isDay: this.isDay, isTransitioning: this.isTransitioning });
        }
    }

    private updateVisuals(): void {
        if (!this.overlay) return;
        
        const camera = this.scene.cameras.main;
        const width = camera.width;
        const height = camera.height;
        
        this.overlay.clear();
        
        // Calculate darkness intensity for the entire cycle
        let darknessIntensity = 0;
        
        const dayEnd = this.config.dayDuration / this.config.cycleDuration;
        
        if (this.currentTime >= dayEnd) {
            // Night time - simple calculation
            const nightProgress = (this.currentTime - dayEnd) / (1 - dayEnd);
            darknessIntensity = Math.min(1, nightProgress * 2); // Gradual darkening
        } else {
            // Day time - gradual lightening
            const dayProgress = this.currentTime / dayEnd;
            darknessIntensity = Math.max(0, 1 - (dayProgress * 2)); // Gradual lightening
        }
        
        // Draw darkness overlay if there's any darkness
        if (darknessIntensity > 0) {
            this.overlay.fillStyle(0x000000, darknessIntensity * 0.95); // Increased darkness
            this.overlay.fillRect(0, 0, width, height);
        }
        
        // Emit darkness intensity for other systems (flashlight, tree lights)
        this.scene.events.emit('darknessIntensityChange', darknessIntensity);
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
        if (this.isDay && !this.isTransitioning) return 0;
        if (!this.isDay && !this.isTransitioning) return 1;
        
        // Calculate transition intensity
        const dayEnd = this.config.dayDuration / this.config.cycleDuration;
        const transitionStart = dayEnd - (this.config.transitionDuration / this.config.cycleDuration) / 2;
        const transitionEnd = dayEnd + (this.config.transitionDuration / this.config.cycleDuration) / 2;
        
        if (this.currentTime < dayEnd) {
            const progress = (this.currentTime - transitionStart) / (dayEnd - transitionStart);
            return Math.max(0, Math.min(1, progress));
        } else {
            const progress = (this.currentTime - dayEnd) / (transitionEnd - dayEnd);
            return Math.max(0, Math.min(1, 1 - progress));
        }
    }

    // Debug methods
    public toggleDebugMode(): void {
        this.debugMode = !this.debugMode;
        console.log(`Day/Night debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    }

    public setToPeakDay(): void {
        this.debugTimeOverride = 0.25; // 6 AM
        console.log('Set to peak day (6 AM)');
    }

    public setToPeakNight(): void {
        this.debugTimeOverride = 0.75; // 6 PM
        console.log('Set to peak night (6 PM)');
    }

    public setTime(time: number): void {
        this.debugTimeOverride = Math.max(0, Math.min(1, time));
        console.log(`Set time to ${(time * 24).toFixed(1)} hours`);
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
