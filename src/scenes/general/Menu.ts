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

            // Load and create menu background image
            this.createMenuBackground();

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
    // private lerpColor(color1: number, color2: number, t: number): number {
    //     const r1 = (color1 >> 16) & 0xFF;
    //     const g1 = (color1 >> 8) & 0xFF;
    //     const b1 = color1 & 0xFF;

    //     const r2 = (color2 >> 16) & 0xFF;
    //     const g2 = (color2 >> 8) & 0xFF;
    //     const b2 = color2 & 0xFF;

    //     const r = Math.round(r1 + (r2 - r1) * t);
    //     const g = Math.round(g1 + (g2 - g1) * t);
    //     const b = Math.round(b1 + (b2 - b1) * t);

    //     return (r << 16) | (g << 8) | b;
    // }

    /**
     * Creates the menu background using the menubackground.png image
     */
    private createMenuBackground(): void {
        const { width, height } = this.game.config as { width: number; height: number };
        
        // Create the background image
        const background = this.add.image(0, 0, 'menubackground');
        
        // Scale the image to fit the screen while maintaining aspect ratio
        const scaleX = width / background.width;
        const scaleY = height / background.height;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure it covers the entire screen
        
        background.setScale(scale);
        background.setOrigin(0, 0); // Position from top-left corner
        background.setDepth(-1000); // Behind everything else
    }


    /**
     * Creates the main title and a random subtitle from the remarks system
     */
    private createTitle(): void {
        const centerX = (this.game.config.width as number) / 2;
        const centerY = (this.game.config.height as number) / 2;

        const title = this.add.bitmapText(centerX, centerY - 180, 'pixel-white', 'TIME WASTER', 72);
        title.setOrigin(0.5);

        // Get a random remark from the system
        const randomRemark = MenuRemarksSystem.getRandomRemark();
        const subtitle = this.add.bitmapText(centerX, centerY - 120, 'pixel-white', randomRemark, 20);
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
            // Clear ALL localStorage keys to prevent interference with new game
            SaveSystem.clearAllGameData();
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
            // Clear ALL localStorage keys to prevent interference with new game
            SaveSystem.clearAllGameData();
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
        const buttonText = this.add.bitmapText(0, 0, 'pixel-white', text, 18);
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
            'pixel-white',
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
                    // Stop the world scene first to ensure proper cleanup
                    this.scene.stop('worldScene');
                    // Start the game scene after fade completes
                    this.scene.start('worldScene', { loadSaveData });
                }
            });

            // console.log('Starting fade transition to game...');

        } catch (error) {
            console.error('Error in fade transition:', error);
            // Fallback to direct scene start if fade fails
            this.scene.stop('worldScene');
            this.scene.start('worldScene', { loadSaveData });
        }
    }
}
