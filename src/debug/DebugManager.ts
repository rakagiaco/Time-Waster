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

    // Debug text management
    private debugTextObjects: Phaser.GameObjects.Text[] = [];
    private maxTextObjects: number = 50; // Limit to prevent performance issues

    // Collision box visibility
    private showCollisionBoxes: boolean = false;

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
        this.attachButtonListeners()
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
        this.debugGraphics.setScrollFactor(1, 1); // Follow world coordinates
        this.debugGraphics.setDepth(9999);
        this.debugGraphics.setVisible(false);
    }

    private setupKeybinds(): void {
        // Toggle debug mode with backtick (`)
        this.scene.input.keyboard?.on('keydown-BACKTICK', () => {
            this.toggle();
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
            this.clearDebugText();
            this.resetTextObjectPool();
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
        `;

        this.debugContentElement.innerHTML = html;
    }

    private attachButtonListeners(): void {
        const dayBtn = document.getElementById('debug-day-btn');
        const nightBtn = document.getElementById('debug-night-btn');
        const normalTimeBtn = document.getElementById('debug-normal-time-btn');
        const collisionBtn = document.getElementById('debug-collision-btn');

        console.log("Attaching button listeners", { dayBtn, nightBtn, normalTimeBtn, collisionBtn });
      
        if (dayBtn) {
            dayBtn.addEventListener("click", () => {
                console.log("Day button clicked")
                this.toggleToPeakDay()
            })
        } else {
            console.log("Day button not found")
        }

        if (nightBtn) {
            nightBtn.onclick = () => {
                this.toggleToPeakNight();
            };
        }

        if (normalTimeBtn) {
            normalTimeBtn.onclick = () => {
                this.disableDebugMode();
            };
        }

        if (collisionBtn) {
            collisionBtn.onclick = () => {
                this.toggleCollisionBoxes();
            };
        }
    }

    public update(): void {
        if (!this.isEnabled) return;

        // Update FPS
        this.debugInfo.fps = Math.round(this.scene.game.loop.actualFps);

        // Clear previous frame's visual debug
        // this.clearVisualDebug();
    }

    private toggleToPeakDay(): void {
        this.scene.events.emit('debug-setToPeakDay');
    }

    private toggleToPeakNight(): void {
        this.scene.events.emit('debug-setToPeakNight');
    }

    private disableDebugMode(): void {
        this.scene.events.emit('debug-disableTimeOverride');
    }

    public drawCollisionBox(entity: any, color: number): void {
        if (!this.isEnabled || !this.debugGraphics || !entity) return;

        // Get entity bounds
        const bounds = entity.getBounds ? entity.getBounds() : null;
        if (!bounds) return;

        // Set line style and draw rectangle
        this.debugGraphics.lineStyle(2, color, 1);
        this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    public drawVectorPoints(x: number, y: number, width: number, height: number, color: number): void {
        if (!this.isEnabled || !this.debugGraphics) return;

        // Set line style for vector points
        this.debugGraphics.lineStyle(1, color, 0.8);
        
        // Draw corner points
        const pointSize = 3;
        this.debugGraphics.fillStyle(color, 0.6);
        
        // Top-left corner
        this.debugGraphics.fillCircle(x, y, pointSize);
        // Top-right corner
        this.debugGraphics.fillCircle(x + width, y, pointSize);
        // Bottom-left corner
        this.debugGraphics.fillCircle(x, y + height, pointSize);
        // Bottom-right corner
        this.debugGraphics.fillCircle(x + width, y + height, pointSize);
        
        // Center point
        this.debugGraphics.fillCircle(x + width / 2, y + height / 2, pointSize / 2);
    }

    public addInfoText(x: number, y: number, text: string, color: number = 0xffffff): void {
        if (!this.isEnabled || !this.debugGraphics) return;
        
        // Convert hex color to CSS color string
        const colorStr = `#${color.toString(16).padStart(6, '0')}`;
        
        // Find an available text object or create a new one
        let textObj = this.debugTextObjects.find(obj => !obj.visible);
        
        if (!textObj && this.debugTextObjects.length < this.maxTextObjects) {
            // Create new text object
            textObj = this.scene.add.text(0, 0, '', {
                fontSize: '12px',
                color: colorStr,
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            
            // Set properties - use world space for proper following
            textObj.setScrollFactor(1, 1); // Follow world coordinates
            textObj.setDepth(10000);
            textObj.setOrigin(0.5, 0.5);
            
            this.debugTextObjects.push(textObj);
        }
        
        if (textObj) {
            // Update existing text object
            textObj.setPosition(x, y);
            textObj.setText(text);
            textObj.setStyle({ color: colorStr });
            textObj.setVisible(true);
        }
    }

    public clearDebugText(): void {
        // Hide all debug text objects instead of destroying them
        this.debugTextObjects.forEach(textObj => {
            if (textObj) {
                textObj.setVisible(false);
            }
        });
    }

    public clearDebugGraphics(): void {
        // Clear the debug graphics to prevent accumulation
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    private resetTextObjectPool(): void {
        // Reset all text objects to a clean state
        this.debugTextObjects.forEach(textObj => {
            if (textObj) {
                textObj.setVisible(false);
                textObj.setText('');
                textObj.setPosition(0, 0);
            }
        });
    }

    public destroy(): void {
        // Destroy all debug text objects
        this.debugTextObjects.forEach(textObj => {
            if (textObj && textObj.destroy) {
                textObj.destroy();
            }
        });
        this.debugTextObjects = [];
        
        // Destroy debug graphics
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }

        // Hide the external debug panel
        if (this.debugPanelElement) {
            this.debugPanelElement.style.display = 'none';
        }
    }

    /**
     * Draws a path for debugging purposes
     */
    public drawPath(path: Phaser.Math.Vector2[], color: number = 0x00ff00): void {
        if (!this.isEnabled || !this.debugGraphics) return;
        
        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(2, color);
        
        if (path.length > 1) {
            this.debugGraphics.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                this.debugGraphics.lineTo(path[i].x, path[i].y);
            }
        }
    }

    /**
     * Toggle collision box visibility
     */
    private toggleCollisionBoxes(): void {
        this.showCollisionBoxes = !this.showCollisionBoxes;
        console.log(`Collision boxes ${this.showCollisionBoxes ? 'enabled' : 'disabled'}`);
        
        // Emit event to World scene to toggle collision drawing
        this.scene.events.emit('debug-toggleCollisionBoxes', this.showCollisionBoxes);
    }

    /**
     * Get collision box visibility state
     */
    public getCollisionBoxVisibility(): boolean {
        return this.showCollisionBoxes;
    }

    /**
     * Set collision box visibility state
     */
    public setCollisionBoxVisibility(visible: boolean): void {
        this.showCollisionBoxes = visible;
    }


    public drawCircleCollision(x: number, y: number, radius: number, color: number): void {
        if (!this.isEnabled || !this.debugGraphics) return;
        
        this.debugGraphics.lineStyle(2, color, 0.6);
        this.debugGraphics.strokeCircle(x, y, radius);
        
        // Draw center point
        this.debugGraphics.fillStyle(color, 0.8);
        this.debugGraphics.fillCircle(x, y, 2);
        
        // Draw radius lines (cross)
        this.debugGraphics.lineStyle(1, color, 0.4);
        this.debugGraphics.lineBetween(x - radius, y, x + radius, y); // Horizontal
        this.debugGraphics.lineBetween(x, y - radius, x, y + radius); // Vertical
    }

    public drawRectangleCollision(x: number, y: number, width: number, height: number, color: number): void {
        if (!this.isEnabled || !this.debugGraphics) return;
        
        // Draw rectangle outline
        this.debugGraphics.lineStyle(2, color, 0.8);
        this.debugGraphics.strokeRect(x, y, width, height);
        
        // Draw center point
        this.debugGraphics.fillStyle(color, 0.8);
        this.debugGraphics.fillCircle(x + width / 2, y + height / 2, 2);
        
        // Draw diagonal lines to show it's a collision box
        this.debugGraphics.lineStyle(1, color, 0.4);
        this.debugGraphics.lineBetween(x, y, x + width, y + height); // Top-left to bottom-right
        this.debugGraphics.lineBetween(x + width, y, x, y + height); // Top-right to bottom-left
    }
}
