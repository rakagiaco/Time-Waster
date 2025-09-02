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
        `;

        this.debugContentElement.innerHTML = html;
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

    public drawPath(points: { x: number; y: number }[], color: number = 0x00ff00): void {
        if (!this.isEnabled || points.length < 2) return;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        
        graphics.setScrollFactor(0);
        graphics.setDepth(9997);
        
        this.pathVisualizations.push(graphics);
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

    public addInfoText(x: number, y: number, text: string, color: number = 0xffffff): void {
        if (!this.isEnabled) return;

        const infoText = this.scene.add.bitmapText(x, y, 'pixel-white', text, 10);
        infoText.setTint(color);
        infoText.setScrollFactor(0);
        infoText.setDepth(10001);
        
        this.infoTexts.push(infoText);
    }

    public toggleCollisionBoxes(): void {
        if (!this.isEnabled) return;
        
        this.collisionBoxes.forEach(box => {
            box.setVisible(!box.visible);
        });
    }

    public togglePathVisualization(): void {
        if (!this.isEnabled) return;
        
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

    public destroy(): void {
        this.clearVisualDebug();
        this.debugGraphics.destroy();
        
        // Hide the external debug panel
        if (this.debugPanelElement) {
            this.debugPanelElement.style.display = 'none';
        }
    }
}
