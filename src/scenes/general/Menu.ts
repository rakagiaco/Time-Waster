import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';

interface MenuData {
    qobj?: any;
    inv?: any;
}

export class Menu extends Phaser.Scene {


    constructor() {
        super('menuScene');
    }

    create(_data: MenuData): void {
        try {
            console.log('=== MENU SCENE CREATE ===');
            console.log('Scene key:', this.scene.key);

            // Create pixel art medieval background
            this.createMedievalBackground();
            
            // Create title with enhanced styling
            this.createTitle();

            // Setup custom cursor
            this.input.setDefaultCursor('url(/img/cursor.png), pointer');

            // Create medieval-themed menu buttons
            this.createMenuButtons();

        console.log('Menu scene setup complete');
        
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
        
        // Create a more detailed gradient with multiple layers
        const gradientSteps = 20;
        const stepHeight = height / gradientSteps;
        
        for (let i = 0; i < gradientSteps; i++) {
            const progress = i / gradientSteps;
            // Smooth transition from deep blue at top to warm pink/orange at bottom
            const topColor = this.lerpColor(0x191970, 0x4169E1, progress * 0.5); // Deep blue to royal blue
            const bottomColor = this.lerpColor(0x4169E1, 0xFFB6C1, Math.max(0, (progress - 0.5) * 2)); // Royal blue to pink
            const currentColor = progress < 0.5 ? topColor : bottomColor;
            
            bg.fillStyle(currentColor, 1);
            bg.fillRect(0, i * stepHeight, width, stepHeight + 1); // +1 to avoid gaps
        }
        
        // Mountains in background - layered silhouettes
        this.createMountains(width, height);
        
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
        
        // Create smooth mountain silhouettes with more detail points
        const backMountainPoints = [
            {x: 0, y: height - 200},
            {x: 50, y: height - 240},
            {x: 120, y: height - 320},
            {x: 200, y: height - 350},
            {x: 280, y: height - 330},
            {x: 350, y: height - 310},
            {x: 400, y: height - 300},
            {x: 480, y: height - 360},
            {x: 560, y: height - 390},
            {x: 600, y: height - 400},
            {x: 680, y: height - 380},
            {x: 750, y: height - 340},
            {x: 800, y: height - 320},
            {x: 850, y: height - 300},
            {x: width, y: height - 280}
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
            {x: 0, y: height - 150},
            {x: 40, y: height - 190},
            {x: 80, y: height - 230},
            {x: 120, y: height - 260},
            {x: 150, y: height - 280},
            {x: 200, y: height - 260},
            {x: 250, y: height - 240},
            {x: 300, y: height - 230},
            {x: 350, y: height - 220},
            {x: 420, y: height - 260},
            {x: 480, y: height - 290},
            {x: 520, y: height - 300},
            {x: 550, y: height - 300},
            {x: 600, y: height - 280},
            {x: 650, y: height - 270},
            {x: 700, y: height - 260},
            {x: 750, y: height - 250},
            {x: 800, y: height - 220},
            {x: width, y: height - 200}
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
     * Creates a medieval castle silhouette
     */
    private createCastleSilhouette(width: number, height: number): void {
        const castle = this.add.graphics();
        castle.fillStyle(0x2F2F2F, 1); // Dark gray
        
        // Main castle keep
        castle.fillRect(width - 300, height - 300, 80, 200);
        
        // Castle towers
        castle.fillRect(width - 280, height - 350, 40, 50); // Left tower top
        castle.fillRect(width - 260, height - 280, 60, 180); // Right tower
        castle.fillRect(width - 240, height - 320, 30, 40); // Right tower top
        
        // Castle walls
        castle.fillRect(width - 380, height - 220, 200, 120);
        
        // Tower flags (small triangles)
        castle.fillStyle(0x8B0000, 1); // Dark red
        castle.fillTriangle(
            width - 260, height - 350,
            width - 250, height - 370,
            width - 240, height - 350
        );
        castle.fillTriangle(
            width - 225, height - 320,
            width - 215, height - 340,
            width - 205, height - 320
        );
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
     * Creates an enhanced title with medieval styling
     */
    private createTitle(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;
        
        // Main title
        const title = this.add.bitmapText(centerX, centerY - 180, '8-bit', 'TIME WASTER', 72);
        title.setOrigin(0.5);
        title.setTint(0xFFD700); // Gold color
        
        // Title shadow for depth
        const titleShadow = this.add.bitmapText(centerX + 3, centerY - 177, '8-bit', 'TIME WASTER', 72);
        titleShadow.setOrigin(0.5);
        titleShadow.setTint(0x8B4513); // Brown shadow
        titleShadow.setDepth(-1);
        
        // Subtitle
        const subtitle = this.add.bitmapText(centerX, centerY - 120, '8-bit', 'A Medieval RPG Adventure', 20);
        subtitle.setOrigin(0.5);
        subtitle.setTint(0xF5DEB3); // Wheat color
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
            console.log('Continue button clicked - checking for save data:', hasSaveData);
            
            if (hasSaveData) {
                console.log('Save data found - loading saved game');
                this.scene.start('worldScene', { loadSaveData: true });
            } else {
                console.log('No save data available');
                this.showNoSaveMessage();
            }
        });
        
        // Update continue button appearance based on save data
        this.updateContinueButtonAppearance(continueBtn);
        
        // New Game button
        this.createMedievalButton(centerX, centerY + 50, 'NEW GAME', () => {
            console.log('New Game button clicked');
            this.scene.start('worldScene', { loadSaveData: false }); // Explicitly start fresh game
        });
        
        // Credits button  
        this.createMedievalButton(centerX, centerY + 120, 'CREDITS', () => {
            console.log('Credits button clicked');
            this.scene.start('Credits');
        });
        
        // Freeplay button
        this.createMedievalButton(centerX, centerY + 190, 'FREEPLAY', () => {
            console.log('Freeplay button clicked');
            this.scene.start('worldScene');
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
        button.setInteractive({ useHandCursor: true });
        
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
        console.log('Continue button updated - has save data:', hasSaveData);
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
}
