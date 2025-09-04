import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';
import { MenuRemarksSystem } from '../../systems/MenuRemarksSystem';

interface MenuData {
    qobj?: any;
    inv?: any;
}

export class Menu extends Phaser.Scene {


    constructor() {
        super('menuScene');
    }

    async create(_data: MenuData): Promise<void> {
        try {
            // console.log('=== MENU SCENE CREATE ===');
            // console.log('Scene key:', this.scene.key);

            // Load menu remarks first
            await MenuRemarksSystem.loadRemarks();

            // Stop any existing music first (with safety check)
            if (this.sound) {
                this.sound.stopAll();
                // console.log('Menu: Stopped all existing music');
            } else {
                // console.log('Menu: Sound system not ready yet, skipping stopAll');
            }

            // Start main menu music with a small delay to ensure sound system is ready
            this.time.delayedCall(100, () => {
                this.startMainMenuMusic();
            });

            // Create pixel art medieval background
            this.createMedievalBackground();

            // Create title with enhanced styling
            this.createTitle();

            // Setup custom cursor
            this.input.setDefaultCursor('url(/img/cursor.png), pointer');

            // Create medieval-themed menu buttons
            this.createMenuButtons();

            // console.log('Menu scene setup complete');

        } catch (error) {
            console.error('=== CRITICAL ERROR IN MENU CREATE ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('=====================================');
        }
    }

    /**
     * Interpolates between two colors for smooth gradients
     */
    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * Creates a high-resolution pixel art medieval background with castle, mountains, and sky
     */
    private createMedievalBackground(): void {
        const { width, height } = this.game.config as { width: number; height: number };

        // High-resolution sky gradient with more detailed color transitions
        const bg = this.add.graphics();
        bg.setDefaultStyles({ lineStyle: { width: 1, alpha: 1 }, fillStyle: { alpha: 1 } });

        // Create a more detailed gradient with multiple layers (HD quality)
        const gradientSteps = 40; // Doubled for HD quality
        const stepHeight = height / gradientSteps;

        for (let i = 0; i < gradientSteps; i++) {
            const progress = i / gradientSteps;
            // Smooth transition from deep blue at top to warm pink/orange at bottom
            // Use a single smooth interpolation across the entire gradient
            const currentColor = this.lerpColor(0x191970, 0xFFB6C1, progress); // Deep blue to pink

            bg.fillStyle(currentColor, 1);
            bg.fillRect(0, i * stepHeight, width, stepHeight + 1); // +1 to avoid gaps
        }

        // Mountains in background - layered silhouettes
        this.createMountains(width, height);

        // Forest between mountains and castle
        this.createForest(width, height);

        // Castle silhouette
        this.createCastleSilhouette(width, height);

        // Ground/foreground
        bg.fillStyle(0x2F4F2F, 1); // Dark olive green
        bg.fillRect(0, height - 100, width, 100);

        // Add some atmospheric particles/stars
        this.createAtmosphericEffects(width, height);
    }

    /**
     * Creates layered mountain silhouettes for depth
     */
    private createMountains(width: number, height: number): void {
        const mountains = this.add.graphics();

        // High-resolution back mountains with smooth curves
        mountains.fillStyle(0x6A5ACD, 0.7); // Slate blue
        mountains.beginPath();
        mountains.moveTo(0, height - 200);

        // Create smooth mountain silhouettes with HD detail points
        const backMountainPoints = [
            { x: 0, y: height - 200 },
            { x: 25, y: height - 220 },
            { x: 50, y: height - 240 },
            { x: 75, y: height - 260 },
            { x: 100, y: height - 290 },
            { x: 120, y: height - 320 },
            { x: 140, y: height - 335 },
            { x: 160, y: height - 345 },
            { x: 180, y: height - 350 },
            { x: 200, y: height - 350 },
            { x: 220, y: height - 345 },
            { x: 240, y: height - 340 },
            { x: 260, y: height - 335 },
            { x: 280, y: height - 330 },
            { x: 300, y: height - 325 },
            { x: 320, y: height - 320 },
            { x: 340, y: height - 315 },
            { x: 350, y: height - 310 },
            { x: 370, y: height - 308 },
            { x: 390, y: height - 305 },
            { x: 400, y: height - 300 },
            { x: 420, y: height - 310 },
            { x: 440, y: height - 320 },
            { x: 460, y: height - 340 },
            { x: 480, y: height - 360 },
            { x: 500, y: height - 375 },
            { x: 520, y: height - 385 },
            { x: 540, y: height - 390 },
            { x: 560, y: height - 390 },
            { x: 580, y: height - 395 },
            { x: 600, y: height - 400 },
            { x: 620, y: height - 395 },
            { x: 640, y: height - 390 },
            { x: 660, y: height - 385 },
            { x: 680, y: height - 380 },
            { x: 700, y: height - 370 },
            { x: 720, y: height - 360 },
            { x: 740, y: height - 350 },
            { x: 750, y: height - 340 },
            { x: 770, y: height - 335 },
            { x: 790, y: height - 330 },
            { x: 800, y: height - 320 },
            { x: 820, y: height - 315 },
            { x: 840, y: height - 310 },
            { x: 850, y: height - 300 },
            { x: 870, y: height - 295 },
            { x: 890, y: height - 290 },
            { x: 910, y: height - 285 },
            { x: 930, y: height - 280 },
            { x: width, y: height - 280 }
        ];

        // Draw smooth curves between points
        for (let i = 0; i < backMountainPoints.length; i++) {
            if (i === 0) {
                mountains.moveTo(backMountainPoints[i].x, backMountainPoints[i].y);
            } else {
                mountains.lineTo(backMountainPoints[i].x, backMountainPoints[i].y);
            }
        }

        mountains.lineTo(width, height - 100);
        mountains.lineTo(0, height - 100);
        mountains.closePath();
        mountains.fillPath();

        // High-resolution front mountains with enhanced detail
        mountains.fillStyle(0x483D8B, 0.8); // Dark slate blue
        mountains.beginPath();

        const frontMountainPoints = [
            { x: 0, y: height - 150 },
            { x: 20, y: height - 170 },
            { x: 40, y: height - 190 },
            { x: 60, y: height - 210 },
            { x: 80, y: height - 230 },
            { x: 100, y: height - 245 },
            { x: 120, y: height - 260 },
            { x: 135, y: height - 270 },
            { x: 150, y: height - 280 },
            { x: 170, y: height - 275 },
            { x: 190, y: height - 270 },
            { x: 200, y: height - 260 },
            { x: 220, y: height - 255 },
            { x: 240, y: height - 250 },
            { x: 250, y: height - 240 },
            { x: 270, y: height - 235 },
            { x: 290, y: height - 232 },
            { x: 300, y: height - 230 },
            { x: 320, y: height - 228 },
            { x: 340, y: height - 225 },
            { x: 350, y: height - 220 },
            { x: 370, y: height - 230 },
            { x: 390, y: height - 240 },
            { x: 410, y: height - 250 },
            { x: 420, y: height - 260 },
            { x: 440, y: height - 270 },
            { x: 460, y: height - 280 },
            { x: 480, y: height - 290 },
            { x: 500, y: height - 295 },
            { x: 520, y: height - 300 },
            { x: 535, y: height - 300 },
            { x: 550, y: height - 300 },
            { x: 570, y: height - 295 },
            { x: 590, y: height - 290 },
            { x: 600, y: height - 280 },
            { x: 620, y: height - 275 },
            { x: 640, y: height - 272 },
            { x: 650, y: height - 270 },
            { x: 670, y: height - 268 },
            { x: 690, y: height - 265 },
            { x: 700, y: height - 260 },
            { x: 720, y: height - 255 },
            { x: 740, y: height - 252 },
            { x: 750, y: height - 250 },
            { x: 770, y: height - 240 },
            { x: 790, y: height - 230 },
            { x: 800, y: height - 220 },
            { x: 820, y: height - 215 },
            { x: 840, y: height - 210 },
            { x: 860, y: height - 205 },
            { x: 880, y: height - 202 },
            { x: width, y: height - 200 }
        ];

        for (let i = 0; i < frontMountainPoints.length; i++) {
            if (i === 0) {
                mountains.moveTo(frontMountainPoints[i].x, frontMountainPoints[i].y);
            } else {
                mountains.lineTo(frontMountainPoints[i].x, frontMountainPoints[i].y);
            }
        }

        mountains.lineTo(width, height - 100);
        mountains.lineTo(0, height - 100);
        mountains.closePath();
        mountains.fillPath();
    }

    /**
     * Creates a forest silhouette between mountains and castle
     */
    private createForest(width: number, height: number): void {
        const forest = this.add.graphics();

        // Forest layer 1 (back trees) - darker, more distant
        forest.fillStyle(0x2D5016, 0.8); // Dark forest green
        this.drawTreeLayer(forest, width, height, height - 180, height - 120, 15, 25, 8);

        // Forest layer 2 (middle trees) - medium tone
        forest.fillStyle(0x3D6B1A, 0.9); // Medium forest green
        this.drawTreeLayer(forest, width, height, height - 160, height - 100, 20, 35, 12);

        // Forest layer 3 (front trees) - lighter, closer
        forest.fillStyle(0x4A7C1F, 1.0); // Light forest green
        this.drawTreeLayer(forest, width, height, height - 140, height - 80, 25, 45, 15);
    }

    /**
     * Helper method to draw a layer of trees
     */
    private drawTreeLayer(graphics: Phaser.GameObjects.Graphics, width: number, _height: number,
        startY: number, endY: number, minWidth: number, maxWidth: number,
        treeCount: number): void {
        for (let i = 0; i < treeCount; i++) {
            const x = (width / treeCount) * i + (Math.random() * (width / treeCount) * 0.6);
            const treeWidth = minWidth + Math.random() * (maxWidth - minWidth);
            const treeHeight = endY - startY + (Math.random() * 20 - 10);

            // Calculate trunk height and position to connect to canopy
            const trunkHeight = Math.min(20, treeHeight * 0.3); // Trunk is 30% of tree height, max 20px
            const trunkTopY = endY - trunkHeight;

            // Draw tree trunk (positioned to connect with canopy)
            graphics.fillStyle(0x4A2C17, 1); // Brown trunk
            graphics.fillRect(x - 2, trunkTopY, 4, trunkHeight);

            // Draw tree canopy (irregular shape) - positioned above trunk
            graphics.fillStyle(0x2D5016, 0.8); // Dark green
            graphics.beginPath();
            graphics.moveTo(x, trunkTopY);

            // Create irregular tree shape starting from trunk top
            const points = 8;
            for (let p = 0; p <= points; p++) {
                const angle = (p / points) * Math.PI;
                const radius = treeWidth / 2 + (Math.random() * 8 - 4);
                const treeX = x + Math.cos(angle) * radius;
                const treeY = trunkTopY - Math.sin(angle) * (treeHeight * 0.4) + (Math.random() * 8 - 4);

                if (p === 0) {
                    graphics.moveTo(treeX, treeY);
                } else {
                    graphics.lineTo(treeX, treeY);
                }
            }
            graphics.closePath();
            graphics.fillPath();
        }
    }

    /**
     * Creates a medieval castle silhouette with HD resolution and centered red tops
     */
    private createCastleSilhouette(width: number, height: number): void {
        const castle = this.add.graphics();
        castle.fillStyle(0x2F2F2F, 1); // Dark gray

        // Main castle keep (scaled for HD, moved down to touch ground)
        castle.fillRect(width - 360, height - 240, 96, 240);

        // Castle towers (scaled for HD, moved down to touch ground)
        castle.fillRect(width - 336, height - 300, 48, 60); // Left tower top
        castle.fillRect(width - 312, height - 216, 72, 216); // Right tower
        castle.fillRect(width - 288, height - 264, 36, 48); // Right tower top

        // Castle walls (scaled for HD, moved down to touch ground)
        castle.fillRect(width - 456, height - 144, 240, 144);

        // Castle gate/drawbridge (open arch at bottom of castle)
        castle.fillStyle(0x1a1a1a, 1); // Dark gate opening
        castle.fillRect(width - 380, height - 80, 80, 80); // Gate opening

        // Gate arch (rounded top)
        castle.fillStyle(0x2F2F2F, 1); // Same as castle walls
        castle.fillRect(width - 380, height - 80, 80, 20); // Top of gate arch

        // Gate chains/ropes (decorative)
        castle.fillStyle(0x8B4513, 1); // Brown rope color
        castle.fillRect(width - 375, height - 60, 3, 40); // Left chain
        castle.fillRect(width - 362, height - 60, 3, 40); // Right chain

        // Tower red tops (shifted more left and moved down)
        castle.fillStyle(0x8B0000, 1); // Dark red

        // Left tower red top (shifted more left)
        castle.fillTriangle(
            width - 324, height - 300,  // Left point (shifted more left)
            width - 312, height - 330,  // Top point (shifted more left)
            width - 300, height - 300   // Right point (shifted more left)
        );

        // Right tower red top (shifted more left)
        castle.fillTriangle(
            width - 282, height - 264,  // Left point (shifted more left)
            width - 270, height - 294,  // Top point (shifted more left)
            width - 258, height - 264   // Right point (shifted more left)
        );

        // Add castle windows and lights
        this.addCastleWindows(castle, width, height);
    }

    /**
     * Adds windows and lights to the castle
     */
    private addCastleWindows(castle: Phaser.GameObjects.Graphics, width: number, height: number): void {
        // Main keep windows (positioned lower on the keep walls)
        castle.fillStyle(0xFFD700, 0.9); // Golden light
        castle.fillRect(width - 350, height - 220, 3, 4); // Left window (on keep wall)
        castle.fillRect(width - 340, height - 220, 3, 4); // Right window (on keep wall)
        castle.fillRect(width - 350, height - 180, 3, 4); // Left window (lower on keep)
        castle.fillRect(width - 340, height - 180, 3, 4); // Right window (lower on keep)

        // Left tower windows (positioned lower on tower walls)
        castle.fillStyle(0xFFD700, 0.9); // Golden light
        castle.fillRect(width - 330, height - 250, 2, 3); // Small window (on tower)
        castle.fillRect(width - 325, height - 250, 2, 3); // Small window (on tower)

        // Right tower windows (positioned lower on tower walls)
        castle.fillStyle(0xFFD700, 0.9); // Golden light
        castle.fillRect(width - 300, height - 200, 2, 3); // Small window (on tower)
        castle.fillRect(width - 295, height - 200, 2, 3); // Small window (on tower)
        castle.fillRect(width - 300, height - 160, 2, 3); // Small window (lower on tower)
        castle.fillRect(width - 295, height - 160, 2, 3); // Small window (lower on tower)

        // Right tower top windows (positioned lower on tower top walls)
        castle.fillStyle(0xFFD700, 0.9); // Golden light
        castle.fillRect(width - 285, height - 240, 2, 3); // Small window (on tower top)
        castle.fillRect(width - 280, height - 240, 2, 3); // Small window (on tower top)

        // Castle wall windows (positioned lower on wall structure)
        castle.fillStyle(0xFFD700, 0.9); // Golden light
        castle.fillRect(width - 440, height - 120, 2, 3); // Wall window (on wall)
        castle.fillRect(width - 430, height - 120, 2, 3); // Wall window (on wall)
        castle.fillRect(width - 420, height - 120, 2, 3); // Wall window (on wall)
        castle.fillRect(width - 410, height - 120, 2, 3); // Wall window (on wall)
        castle.fillRect(width - 400, height - 120, 2, 3); // Wall window (on wall)

        // Add some flickering effect to the lights
        this.addFlickeringLights(castle, width, height);
    }

    /**
     * Adds flickering effect to castle lights
     */
    private addFlickeringLights(castle: Phaser.GameObjects.Graphics, width: number, height: number): void {
        // Create subtle flickering effect for some windows (lowered positions)
        const flickerWindows = [
            { x: width - 350, y: height - 220, width: 3, height: 4 }, // Main keep window
            { x: width - 300, y: height - 200, width: 2, height: 3 }, // Right tower window
            { x: width - 440, y: height - 120, width: 2, height: 3 }  // Wall window
        ];

        flickerWindows.forEach((window) => {
            // Add slight variation to light intensity
            const flickerIntensity = 0.7 + Math.random() * 0.3;
            castle.fillStyle(0xFFD700, flickerIntensity);
            castle.fillRect(window.x, window.y, window.width, window.height);
        });
    }

    /**
     * Adds atmospheric effects like stars or floating particles
     */
    private createAtmosphericEffects(width: number, height: number): void {
        // Add some twinkling stars
        for (let i = 0; i < 20; i++) {
            const star = this.add.graphics();
            star.fillStyle(0xFFFFFF, Math.random() * 0.8 + 0.2);
            const x = Math.random() * width;
            const y = Math.random() * (height / 2);
            star.fillCircle(x, y, 1);

            // Make stars twinkle
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
     * Creates the main title and a random subtitle from the remarks system
     */
    private createTitle(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;

        const title = this.add.bitmapText(centerX, centerY - 180, '8-bit', 'TIME WASTER', 72);
        title.setOrigin(0.5);

        // Get a random remark from the system
        const randomRemark = MenuRemarksSystem.getRandomRemark();
        const subtitle = this.add.bitmapText(centerX, centerY - 120, '8-bit', randomRemark, 20);
        subtitle.setOrigin(0.5);
    }

    /**
     * Creates all menu buttons with medieval theming
     */
    private createMenuButtons(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;

        // Continue button
        const continueBtn = this.createMedievalButton(centerX, centerY - 20, 'CONTINUE', () => {
            const hasSaveData = SaveSystem.hasSaveData();
            // console.log('Continue button clicked - checking for save data:', hasSaveData);

            if (hasSaveData) {
                // console.log('Save data found - loading saved game');
                this.fadeToGame(true);
            } else {
                // console.log('No save data available');
                this.showNoSaveMessage();
            }
        });

        // Update continue button appearance based on save data
        this.updateContinueButtonAppearance(continueBtn);

        // New Game button
        this.createMedievalButton(centerX, centerY + 50, 'NEW GAME', () => {
            // console.log('New Game button clicked');
            this.fadeToGame(false);
        });

        // Credits button  
        this.createMedievalButton(centerX, centerY + 120, 'CREDITS', () => {
            // console.log('Credits button clicked');
            this.scene.start('Credits');
        });

        // Freeplay button
        this.createMedievalButton(centerX, centerY + 190, 'FREEPLAY', () => {
            // console.log('Freeplay button clicked');
            this.fadeToGame(false);
        });
    }

    /**
     * Creates a medieval-themed button matching the pause menu style
     */
    private createMedievalButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const button = this.add.container(x, y);

        // Button background with medieval stone appearance
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0xD2B48C, 0.9); // Tan stone color
        buttonBg.fillRoundedRect(-90, -25, 180, 50, 10);

        // Stone texture effect with darker edges
        buttonBg.fillStyle(0xA0522D, 0.7); // Darker brown
        buttonBg.fillRoundedRect(-85, -20, 170, 40, 8);

        // Inner button area
        buttonBg.fillStyle(0xF5DEB3, 0.8); // Wheat color
        buttonBg.fillRoundedRect(-80, -18, 160, 36, 6);

        // Button border with medieval styling
        buttonBg.lineStyle(3, 0x8B4513, 0.9); // Saddle brown
        buttonBg.strokeRoundedRect(-80, -18, 160, 36, 6);

        // Decorative corner studs
        buttonBg.fillStyle(0x696969, 1); // Dim gray for metal studs
        buttonBg.fillCircle(-70, -8, 3);
        buttonBg.fillCircle(70, -8, 3);
        buttonBg.fillCircle(-70, 8, 3);
        buttonBg.fillCircle(70, 8, 3);

        // Button text
        const buttonText = this.add.bitmapText(0, 0, '8-bit', text, 18);
        buttonText.setOrigin(0.5);
        buttonText.setTint(0x654321); // Dark brown text

        button.add([buttonBg, buttonText]);

        // Make interactive with enhanced hover effects
        button.setSize(180, 50);
        button.setInteractive();

        // Hover effects with medieval flair
        button.on('pointerover', () => {
            button.setScale(1.05);
            buttonText.setTint(0x8B0000); // Dark red on hover
            // Add glow effect
            buttonBg.lineStyle(3, 0xFFD700, 0.8); // Gold glow
            buttonBg.strokeRoundedRect(-80, -18, 160, 36, 6);
        });

        button.on('pointerout', () => {
            button.setScale(1.0);
            buttonText.setTint(0x654321); // Back to brown
            // Restore normal border
            buttonBg.clear();
            this.redrawButtonBackground(buttonBg);
        });

        button.on('pointerdown', callback);

        return button;
    }

    /**
     * Redraws the button background (helper for hover effects)
     */
    private redrawButtonBackground(buttonBg: Phaser.GameObjects.Graphics): void {
        buttonBg.fillStyle(0xD2B48C, 0.9);
        buttonBg.fillRoundedRect(-90, -25, 180, 50, 10);
        buttonBg.fillStyle(0xA0522D, 0.7);
        buttonBg.fillRoundedRect(-85, -20, 170, 40, 8);
        buttonBg.fillStyle(0xF5DEB3, 0.8);
        buttonBg.fillRoundedRect(-80, -18, 160, 36, 6);
        buttonBg.lineStyle(3, 0x8B4513, 0.9);
        buttonBg.strokeRoundedRect(-80, -18, 160, 36, 6);
        buttonBg.fillStyle(0x696969, 1);
        buttonBg.fillCircle(-70, -8, 3);
        buttonBg.fillCircle(70, -8, 3);
        buttonBg.fillCircle(-70, 8, 3);
        buttonBg.fillCircle(70, 8, 3);
    }

    /**
     * Updates continue button appearance based on save data
     */
    private updateContinueButtonAppearance(continueBtn: Phaser.GameObjects.Container): void {
        const hasSaveData = SaveSystem.hasSaveData();
        continueBtn.setAlpha(hasSaveData ? 1.0 : 0.6);
        // console.log('Continue button updated - has save data:', hasSaveData);
    }

    /**
     * Shows a message when no save data is available
     */
    private showNoSaveMessage(): void {
        const message = this.add.bitmapText(
            (this.game.config.width as number) / 2,
            ((this.game.config.height as number) / 2) + 350,
            '8-bit',
            'No saved game found!',
            20
        );
        message.setOrigin(0.5);
        message.setTint(0xff0000); // Red color for error message

        // Remove message after 2 seconds
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
    }

    /**
     * Starts the main menu music with looping and fade in
     */
    private startMainMenuMusic(): void {
        try {
            // Check if sound system is available
            if (!this.sound) {
                // console.log('Menu: Sound system not available, retrying in 200ms...');
                // Retry after a short delay
                this.time.delayedCall(200, () => {
                    this.startMainMenuMusic();
                });
                return;
            }

            // Check if music is already playing to avoid duplicates
            const existingMusic = this.sound.get('main-menu-music');
            if (existingMusic && existingMusic.isPlaying) {
                // console.log('Menu: Main menu music already playing');
                return;
            }

            // Stop any existing main menu music first
            if (existingMusic) {
                existingMusic.destroy();
            }

            // console.log('Menu: Starting main menu music...');

            // Create and play the main menu music
            const music = this.sound.add('main-menu-music', {
                volume: 0, // Start at 0 volume for fade in
                loop: true   // Loop the music continuously
            });

            // Force volume to 0 immediately to prevent any loud initial notes
            music.setVolume(0);

            music.play();

            // Start fade in immediately to prevent any loud initial notes
            this.time.delayedCall(10, () => {
                this.tweens.add({
                    targets: music,
                    volume: 0.3, // Target volume
                    duration: 3000, // 3 second fade in (increased from 1.5s)
                    ease: 'Power2',
                    onComplete: () => {
                        // console.log('Main menu music faded in and looping');
                    }
                });
            });

        } catch (error) {
            console.error('Error starting main menu music:', error);
        }
    }

    /**
     * Called when the scene is shut down - fades out the music
     */
    shutdown(): void {
        try {
            this.fadeOutMusic();
        } catch (error) {
            console.error('Error in menu shutdown:', error);
        }
    }

    /**
     * Fades out the main menu music smoothly
     */
    private fadeOutMusic(): void {
        try {
            const music = this.sound.get('main-menu-music');
            if (music && music.isPlaying) {
                // Create a fade out tween
                this.tweens.add({
                    targets: music,
                    volume: 0,
                    duration: 1000, // 1 second fade
                    ease: 'Power2',
                    onComplete: () => {
                        music.stop();
                        // console.log('Main menu music faded out and stopped');
                    }
                });
            }
        } catch (error) {
            console.error('Error fading out main menu music:', error);
        }
    }

    /**
     * Handles the fade transition from menu to game
     */
    private fadeToGame(loadSaveData: boolean): void {
        try {
            // Start fading out the music
            this.fadeOutMusic();

            // Create a black overlay for the fade effect
            const fadeOverlay = this.add.rectangle(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                this.cameras.main.width,
                this.cameras.main.height,
                0x000000,
                0
            );
            fadeOverlay.setDepth(10000); // Above everything else

            // Fade to black
            this.tweens.add({
                targets: fadeOverlay,
                alpha: 1,
                duration: 1000, // 1 second fade
                ease: 'Power2',
                onComplete: () => {
                    // Start the game scene after fade completes
                    this.scene.start('worldScene', { loadSaveData });
                }
            });

            // console.log('Starting fade transition to game...');

        } catch (error) {
            console.error('Error in fade transition:', error);
            // Fallback to direct scene start if fade fails
            this.scene.start('worldScene', { loadSaveData });
        }
    }
}
