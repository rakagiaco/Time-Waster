import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';

export class GameOver extends Phaser.Scene {

    constructor() {
        super('GameOver');
    }

    create(): void {
        // Create death screen background
        this.createDeathBackground();

        // Setup custom cursor
        this.input.setDefaultCursor('url(/img/cursor.png), pointer');

        // Create title with enhanced styling
        this.createTitle();

        // Create medieval-themed death screen buttons
        this.createDeathButtons();

        // Start fade in animation
        this.startFadeIn();
    }

    /**
     * Creates the death screen background using the deathscreen.png image
     */
    private createDeathBackground(): void {
        const { width, height } = this.game.config as { width: number; height: number };
        
        // Create the background image
        const background = this.add.image(0, 0, 'deathscreen');
        
        // Scale the image to fit the screen while maintaining aspect ratio
        const scaleX = width / background.width;
        const scaleY = height / background.height;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure it covers the entire screen
        
        background.setScale(scale);
        background.setOrigin(0, 0); // Position from top-left corner
        background.setDepth(-1000); // Behind everything else
        background.setAlpha(0); // Start invisible for fade in
    }

    /**
     * Creates the death screen title and subtitle
     */
    private createTitle(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;

        // Main title with dramatic styling
        const title = this.add.bitmapText(centerX, centerY - 180, '8-bit', 'DEFEATED', 72);
        title.setOrigin(0.5);
        title.setTint(0x8B0000); // Dark red color
        title.setAlpha(0); // Start invisible for fade in

        // Subtitle with medieval flair
        const subtitle = this.add.bitmapText(centerX, centerY - 120, '8-bit', 'Your journey has ended...', 20);
        subtitle.setOrigin(0.5);
        subtitle.setTint(0xDAA520); // Goldenrod color
        subtitle.setAlpha(0); // Start invisible for fade in
    }

    /**
     * Creates all death screen buttons with medieval theming
     */
    private createDeathButtons(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;

        // New Game button
        this.createMedievalButton(centerX, centerY - 20, 'NEW GAME', () => {
            // Clear ALL localStorage keys to prevent interference
            SaveSystem.clearAllGameData();
            this.sound.play('click', { volume: 0.5 });
            this.startFadeOut(() => this.fadeToGame(false));
        });

        // Continue button (if save data exists)
        const continueBtn = this.createMedievalButton(centerX, centerY + 50, 'CONTINUE', () => {
            const hasSaveData = SaveSystem.hasSaveData();
            if (hasSaveData) {
                this.startFadeOut(() => this.fadeToGame(true));
            } else {
                this.showNoSaveMessage();
            }
        });

        // Update continue button appearance based on save data
        this.updateContinueButtonAppearance(continueBtn);

        // Menu button
        this.createMedievalButton(centerX, centerY + 120, 'MAIN MENU', () => {
            this.sound.play('click', { volume: 0.5 });
            this.startFadeOut(() => this.scene.start('menuScene'));
        });

        // Freeplay button
        this.createMedievalButton(centerX, centerY + 190, 'FREEPLAY', () => {
            // Clear ALL localStorage keys to prevent interference with new game
            SaveSystem.clearAllGameData();
            this.sound.play('click', { volume: 0.5 });
            this.startFadeOut(() => this.fadeToGame(false));
        });
    }

    /**
     * Creates a medieval-themed button matching the main menu style
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
        button.setAlpha(0); // Start invisible for fade in

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
     * Updates continue button appearance based on save data availability
     */
    private updateContinueButtonAppearance(button: Phaser.GameObjects.Container): void {
        const hasSaveData = SaveSystem.hasSaveData();
        const buttonText = button.list[1] as Phaser.GameObjects.BitmapText;
        
        if (!hasSaveData) {
            button.setAlpha(0.5); // Dim the button
            buttonText.setTint(0x808080); // Gray text
            button.removeInteractive(); // Disable interaction
        }
    }

    /**
     * Shows a message when no save data is available
     */
    private showNoSaveMessage(): void {
        // Create a temporary message
        const message = this.add.bitmapText(
            (this.game.config.width as number) / 2, 
            (this.game.config.height as number) / 2 + 250, 
            '8-bit', 
            'No save data available', 
            16
        );
        message.setOrigin(0.5);
        message.setTint(0xFF6B6B); // Light red color
        
        // Fade out after 2 seconds
        this.tweens.add({
            targets: message,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                message.destroy();
            }
        });
    }

    /**
     * Fades to the game scene with optional save data loading
     */
    private fadeToGame(loadSaveData: boolean): void {
        // Create fade overlay
        const fadeOverlay = this.add.rectangle(
            (this.game.config.width as number) / 2,
            (this.game.config.height as number) / 2,
            this.game.config.width as number,
            this.game.config.height as number,
            0x000000
        );
        fadeOverlay.setDepth(1000);

        // Fade in
        this.tweens.add({
            targets: fadeOverlay,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // Start the game scene
                this.scene.start('worldScene', { 
                    inv: loadSaveData ? undefined : undefined, 
                    qobj: loadSaveData ? undefined : undefined,
                    loadSaveData: loadSaveData
                });
            }
        });
    }

    /**
     * Starts the fade in animation for all death screen elements
     */
    private startFadeIn(): void {
        // Get all game objects that need to fade in
        const background = this.children.list.find(child => (child as any).texture && (child as any).texture.key === 'deathscreen');
        const title = this.children.list.find(child => child instanceof Phaser.GameObjects.BitmapText && (child as any).text === 'DEFEATED');
        const subtitle = this.children.list.find(child => child instanceof Phaser.GameObjects.BitmapText && (child as any).text === 'Your journey has ended...');
        const buttons = this.children.list.filter(child => child instanceof Phaser.GameObjects.Container);

        // Fade in background first
        if (background) {
            this.tweens.add({
                targets: background,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
        }

        // Fade in title after a short delay
        if (title) {
            this.tweens.add({
                targets: title,
                alpha: 1,
                duration: 800,
                delay: 500,
                ease: 'Power2'
            });
        }

        // Fade in subtitle after title
        if (subtitle) {
            this.tweens.add({
                targets: subtitle,
                alpha: 1,
                duration: 600,
                delay: 800,
                ease: 'Power2'
            });
        }

        // Fade in buttons one by one
        buttons.forEach((button, index) => {
            this.tweens.add({
                targets: button,
                alpha: 1,
                duration: 400,
                delay: 1200 + (index * 150), // Staggered appearance
                ease: 'Power2'
            });
        });
    }

    /**
     * Starts the fade out animation before transitioning to another scene
     */
    private startFadeOut(callback: () => void): void {
        // Get all game objects that need to fade out
        const allObjects = this.children.list.filter(child => 
            child instanceof Phaser.GameObjects.Image || 
            child instanceof Phaser.GameObjects.BitmapText || 
            child instanceof Phaser.GameObjects.Container
        );

        // Fade out all objects
        this.tweens.add({
            targets: allObjects,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: callback
        });
    }
}
