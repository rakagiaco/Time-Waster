import Phaser from 'phaser';

export interface DebugInfo {
    fps: number;
    entities: number;
    enemies: number;
    allies: number;
    items: number;
    playerPosition: { x: number; y: number };
    playerHealth: { current: number; max: number };
    playerVelocity: { x: number; y: number };
    cameraPosition: { x: number; y: number };
    cameraZoom: number;
    worldBounds: { width: number; height: number };
    activeAnimations: string[];
    inputKeys: { [key: string]: boolean };
    memoryUsage?: number;
    renderTime?: number;
    // Day/Night Cycle Info
    timeOfDay?: string;
    currentTime?: number;
    darknessIntensity?: number;
    flashlightActive?: boolean;
    treeLightsActive?: boolean;
    // Enemy Night Stats
    enemiesEnhanced?: number;
    totalEnemies?: number;
    // Pathfinding Stats
    enemiesWithPaths?: number;
    totalObstacles?: number;
}

export class DebugManager {
    private scene: Phaser.Scene;
    private isEnabled: boolean = false;
    private debugPanelElement!: HTMLElement;
    private debugContentElement!: HTMLElement;
    private debugGraphics!: Phaser.GameObjects.Graphics;
    private collisionBoxes: Phaser.GameObjects.Graphics[] = [];
    private pathVisualizations: Phaser.GameObjects.Graphics[] = [];
    private infoTexts: Phaser.GameObjects.BitmapText[] = [];

    // Debug info storage
    private debugInfo: DebugInfo = {
        fps: 0,
        entities: 0,
        enemies: 0,
        allies: 0,
        items: 0,
        playerPosition: { x: 0, y: 0 },
        playerHealth: { current: 0, max: 0 },
        playerVelocity: { x: 0, y: 0 },
        cameraPosition: { x: 0, y: 0 },
        cameraZoom: 1,
        worldBounds: { width: 0, height: 0 },
        activeAnimations: [],
        inputKeys: {}
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupExternalDebugPanel();
        this.setupDebugGraphics();
        this.setupKeybinds();
    }

    private setupExternalDebugPanel(): void {
        // Get references to the external HTML debug panel
        this.debugPanelElement = document.getElementById('debugPanel') as HTMLElement;
        this.debugContentElement = document.getElementById('debugContent') as HTMLElement;

        if (!this.debugPanelElement || !this.debugContentElement) {
            console.error('Debug panel HTML elements not found!');
            return;
        }

        // Initially hide the panel
        this.debugPanelElement.style.display = 'none';
    }

    private setupDebugGraphics(): void {
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.setScrollFactor(0);
        this.debugGraphics.setDepth(9999);
        this.debugGraphics.setVisible(false);
    }

    private setupKeybinds(): void {
        // Toggle debug mode with backtick (`)
        this.scene.input.keyboard?.on('keydown-BACKTICK', () => {
            this.toggle();
        });

        // Additional debug keys
        this.scene.input.keyboard?.on('keydown-F2', () => {
            this.toggleCollisionBoxes();
        });

        this.scene.input.keyboard?.on('keydown-F3', () => {
            this.togglePathVisualization();
        });

        // Day/Night cycle toggles
        this.scene.input.keyboard?.on('keydown-F4', () => {
            this.toggleToPeakDay();
        });

        this.scene.input.keyboard?.on('keydown-F5', () => {
            this.toggleToPeakNight();
        });
    }

    public toggle(): void {
        this.isEnabled = !this.isEnabled;

        if (this.debugPanelElement) {
            this.debugPanelElement.style.display = this.isEnabled ? 'block' : 'none';
        }

        this.debugGraphics.setVisible(this.isEnabled);

        if (this.isEnabled) {
            this.updateDebugDisplay();
        } else {
            this.clearVisualDebug();
        }

        console.log(`Debug mode ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);

        if (this.isEnabled) {
            this.scene.events.emit('debug-enabled');
        } else {
            this.scene.events.emit('debug-disabled');
        }
    }

    public isDebugEnabled(): boolean {
        return this.isEnabled;
    }



    public updateDebugInfo(info: Partial<DebugInfo>): void {
        this.debugInfo = { ...this.debugInfo, ...info };
        this.updateDebugDisplay();
    }

    private updateDebugDisplay(): void {
        if (!this.isEnabled || !this.debugContentElement) return;

        const html = `
            <div class="debug-section">
                <div class="debug-label">FPS:</div>
                <div class="debug-value">${this.debugInfo.fps}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Entities:</div>
                <div class="debug-value">${this.debugInfo.entities} (Enemies: ${this.debugInfo.enemies}, Allies: ${this.debugInfo.allies}, Items: ${this.debugInfo.items})</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Player Position:</div>
                <div class="debug-value">(${Math.round(this.debugInfo.playerPosition.x)}, ${Math.round(this.debugInfo.playerPosition.y)})</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Player Health:</div>
                <div class="debug-value">${this.debugInfo.playerHealth.current}/${this.debugInfo.playerHealth.max}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Player Velocity:</div>
                <div class="debug-value">(${Math.round(this.debugInfo.playerVelocity.x)}, ${Math.round(this.debugInfo.playerVelocity.y)})</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Camera Position:</div>
                <div class="debug-value">(${Math.round(this.debugInfo.cameraPosition.x)}, ${Math.round(this.debugInfo.cameraPosition.y)})</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Camera Zoom:</div>
                <div class="debug-value">${this.debugInfo.cameraZoom.toFixed(2)}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">World Bounds:</div>
                <div class="debug-value">${this.debugInfo.worldBounds.width} x ${this.debugInfo.worldBounds.height}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Active Animations:</div>
                <div class="debug-value">${this.debugInfo.activeAnimations.join(', ') || 'None'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Input Keys:</div>
                <div class="debug-value">
                    ${Object.entries(this.debugInfo.inputKeys)
                .filter(([_, pressed]) => pressed)
                .map(([key, _]) => `${key}: PRESSED`)
                .join('<br>') || 'None'}
                </div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Time of Day:</div>
                <div class="debug-value">${this.debugInfo.timeOfDay || 'Unknown'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Current Time:</div>
                <div class="debug-value">${this.debugInfo.currentTime ? (this.debugInfo.currentTime * 24).toFixed(1) + 'h' : 'Unknown'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Darkness Intensity:</div>
                <div class="debug-value">${this.debugInfo.darknessIntensity ? (this.debugInfo.darknessIntensity * 100).toFixed(1) + '%' : 'Unknown'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Flashlight:</div>
                <div class="debug-value">${this.debugInfo.flashlightActive ? 'ON' : 'OFF'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Tree Lights:</div>
                <div class="debug-value">${this.debugInfo.treeLightsActive ? 'ON' : 'OFF'}</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Enemy Enhancement:</div>
                <div class="debug-value">${this.debugInfo.enemiesEnhanced || 0}/${this.debugInfo.totalEnemies || 0} enhanced</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Pathfinding:</div>
                <div class="debug-value">${this.debugInfo.enemiesWithPaths || 0} enemies with paths, ${this.debugInfo.totalObstacles || 0} obstacles</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-label">Debug Controls:</div>
                <div class="debug-value">
                    <button id="debug-collision-btn" style="background: #FF9800; color: white; border: none; padding: 5px 10px; margin: 2px; cursor: pointer; border-radius: 3px;">Collision Boxes (F2)</button>
                    <button id="debug-path-btn" style="background: #9C27B0; color: white; border: none; padding: 5px 10px; margin: 2px; cursor: pointer; border-radius: 3px;">Paths (F3)</button>
                    <button id="debug-day-btn" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; margin: 2px; cursor: pointer; border-radius: 3px;">Peak Day (F4)</button>
                    <button id="debug-night-btn" style="background: #2196F3; color: white; border: none; padding: 5px 10px; margin: 2px; cursor: pointer; border-radius: 3px;">Peak Night (F5)</button>
                </div>
            </div>
            

        `;

        this.debugContentElement.innerHTML = html;

        // Set up button listeners after HTML is updated
        this.setupDebugButtons();
    }

    private setupDebugButtons(): void {
        console.log('Setting up debug buttons...');

        if (!this.debugContentElement) {
            console.warn('Debug content element not available yet, skipping button setup');
            return;
        }

        // Wait a bit for the DOM to be fully updated
        setTimeout(() => {
            this.attachButtonListeners();
        }, 200);
    }

    private attachButtonListeners(): void {
        console.log('Attaching button listeners...');

        const collisionBtn = document.getElementById('debug-collision-btn');
        const pathBtn = document.getElementById('debug-path-btn');
        const dayBtn = document.getElementById('debug-day-btn');
        const nightBtn = document.getElementById('debug-night-btn');

        console.log('Debug buttons found:', {
            collisionBtn: !!collisionBtn,
            pathBtn: !!pathBtn,
            dayBtn: !!dayBtn,
            nightBtn: !!nightBtn
        });

        if (collisionBtn) {
            collisionBtn.onclick = () => {
                console.log('Collision button clicked - DIRECT');
                this.toggleCollisionBoxes();
            };
        }

        if (pathBtn) {
            pathBtn.onclick = () => {
                console.log('Path button clicked - DIRECT');
                this.togglePathVisualization();
            };
        }

        if (dayBtn) {
            dayBtn.onclick = () => {
                console.log('Day button clicked - DIRECT');
                this.toggleToPeakDay();
            };
        }

        if (nightBtn) {
            nightBtn.onclick = () => {
                console.log('Night button clicked - DIRECT');
                this.toggleToPeakNight();
            };
        }

        console.log('All button listeners attached via onclick');
    }

    public drawCollisionBox(entity: Phaser.Physics.Arcade.Sprite, color: number = 0xff0000): void {
        if (!this.isEnabled) return;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        graphics.strokeRect(
            entity.x - entity.width / 2,
            entity.y - entity.height / 2,
            entity.width,
            entity.height
        );
        graphics.setScrollFactor(0);
        graphics.setDepth(9998);

        this.collisionBoxes.push(graphics);
    }


    public drawCircle(centerX: number, centerY: number, radius: number, color: number = 0xffff00): void {
        if (!this.isEnabled) return;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        graphics.strokeCircle(centerX, centerY, radius);
        graphics.setScrollFactor(0);
        graphics.setDepth(9996);

        this.collisionBoxes.push(graphics);
    }

    public drawPath(path: { x: number; y: number }[], color: number = 0x00ff00): void {
        if (!this.isEnabled || path.length < 2) return;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, color, 0.8);

        // Draw path lines
        for (let i = 0; i < path.length - 1; i++) {
            graphics.moveTo(path[i].x, path[i].y);
            graphics.lineTo(path[i + 1].x, path[i + 1].y);
        }

        // Draw waypoint markers
        graphics.fillStyle(color, 0.6);
        path.forEach((point, index) => {
            graphics.fillCircle(point.x, point.y, 4);
        });

        graphics.setScrollFactor(0);
        graphics.setDepth(9995);

        this.pathVisualizations.push(graphics);
    }

    public addInfoText(x: number, y: number, text: string, color: number = 0xffffff): void {
        if (!this.isEnabled) return;

        const infoText = this.scene.add.bitmapText(x, y, 'pixel-white', text, 10);
        infoText.setTint(color);
        infoText.setScrollFactor(0);
        infoText.setDepth(10001);

        this.infoTexts.push(infoText);
    }

    public toggleCollisionBoxes(): void {
        console.log('toggleCollisionBoxes called, isEnabled:', this.isEnabled);
        if (!this.isEnabled) return;

        console.log('Collision boxes count:', this.collisionBoxes.length);
        this.collisionBoxes.forEach(box => {
            box.setVisible(!box.visible);
        });
    }

    public togglePathVisualization(): void {
        console.log('togglePathVisualization called, isEnabled:', this.isEnabled);
        if (!this.isEnabled) return;

        console.log('Path visualizations count:', this.pathVisualizations.length);
        this.pathVisualizations.forEach(path => {
            path.setVisible(!path.visible);
        });
    }

    public clearVisualDebug(): void {
        // Clear collision boxes
        this.collisionBoxes.forEach(box => box.destroy());
        this.collisionBoxes = [];

        // Clear path visualizations
        this.pathVisualizations.forEach(path => path.destroy());
        this.pathVisualizations = [];

        // Clear info texts
        this.infoTexts.forEach(text => text.destroy());
        this.infoTexts = [];

        // Clear debug graphics
        this.debugGraphics.clear();
    }

    public update(): void {
        if (!this.isEnabled) return;

        // Update FPS
        this.debugInfo.fps = Math.round(this.scene.game.loop.actualFps);

        // Clear previous frame's visual debug
        this.clearVisualDebug();
    }

    private toggleToPeakDay(): void {
        console.log('🌅 Debug: Toggle to Peak Day button clicked');

        // Method 1: Scene-level event
        this.scene.events.emit('debug-setToPeakDay');

        // Method 2: Global game-level event (works across all scenes)
        this.scene.game.events.emit('debug-setToPeakDay');

        // Method 3: Registry-based global signal
        this.scene.registry.set('debugCommand', { type: 'setToPeakDay', timestamp: Date.now() });

        // Method 4: Direct access as backup
        const worldScene = this.scene as any;
        if (worldScene.dayNightCycle) {
            worldScene.dayNightCycle.setToPeakDay();
            console.log('🌅 Debug: Set to peak day via direct access');
        }

        console.log('🌅 Debug: All peak day triggers fired');
    }

    private toggleToPeakNight(): void {
        console.log('🌙 Debug: Toggle to Peak Night button clicked');

        // Method 1: Scene-level event
        this.scene.events.emit('debug-setToPeakNight');

        // Method 2: Global game-level event (works across all scenes)
        this.scene.game.events.emit('debug-setToPeakNight');

        // Method 3: Registry-based global signal
        this.scene.registry.set('debugCommand', { type: 'setToPeakNight', timestamp: Date.now() });

        // Method 4: Direct access as backup
        const worldScene = this.scene as any;
        if (worldScene.dayNightCycle) {
            worldScene.dayNightCycle.setToPeakNight();
            console.log('🌙 Debug: Set to peak night via direct access');
        }

        console.log('🌙 Debug: All peak night triggers fired');
    }

    public destroy(): void {
        this.clearVisualDebug();
        this.debugGraphics.destroy();

        // Hide the external debug panel
        if (this.debugPanelElement) {
            this.debugPanelElement.style.display = 'none';
        }
    }
}
