/**
 * Medieval Scroll-Style Pause Menu
 * 
 * Complete redesign using scroll aesthetics with custom graphics and proper
 * camera-relative positioning. Features hand-drawn scroll appearance with
 * medieval-themed buttons and typography.
 */

import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';

export class PauseMenu {
    private scene: Phaser.Scene;
    private isVisible: boolean = false;
    private menuContainer: Phaser.GameObjects.Container | null = null;

    private controlsDisplay: Phaser.GameObjects.Container | null = null;
    private showingControls: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInput();
    }

    private setupInput(): void {
        // Use a single key handler for P key only
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            // Only handle P key for pause menu toggle
            if (event.code === 'KeyP') {
                this.toggle();
                return;
            }

            // Handle ESC key to close controls if showing
            if (this.showingControls && event.code === 'Escape') {
                this.hideControls();
            }
        });
    }

    public toggle(): void {
        console.log('Toggle called, isVisible:', this.isVisible);
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public show(): void {
        if (this.isVisible) return;

        this.isVisible = true;
        this.createMenu();
        // Don't pause the scene, just slow down time
        this.scene.physics.world.timeScale = 0.1;
    }

    public hide(): void {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.destroyMenu();
        // Resume normal time
        this.scene.physics.world.timeScale = 1;
    }

    private createMenu(): void {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        // Create menu container with proper camera positioning
        this.menuContainer = this.scene.add.container(0, 0);
        this.menuContainer.setScrollFactor(0);
        this.menuContainer.setDepth(10001);
        this.menuContainer.setVisible(true);

        // Enhanced scroll background with medieval aesthetics
        const scrollBackground = this.createScrollBackground(centerX, centerY);
        this.menuContainer.add(scrollBackground);

        // Create title
        const title = this.scene.add.bitmapText(centerX, centerY - 200, '8-bit', 'PAUSE MENU', 32);
        title.setOrigin(0.5);
        title.setTint(0x8B0000);
        title.setScrollFactor(0);
        this.menuContainer.add(title);

        // Create custom scroll-themed buttons
        const buttonY = centerY - 120;
        const buttonSpacing = 70;

        // Continue button with custom scroll graphics
        const continueBtn = this.createScrollButton(centerX, buttonY, 'CONTINUE', () => {
            this.scene.sound.play('click', { volume: 0.5 });
            this.hide();
        });
        this.menuContainer.add(continueBtn);

        // Save Game button
        const saveBtn = this.createScrollButton(centerX, buttonY + buttonSpacing, 'SAVE GAME', () => {
            this.scene.sound.play('click', { volume: 0.5 });
            this.saveGame();
        });
        this.menuContainer.add(saveBtn);

        // Controls button
        const controlsBtn = this.createScrollButton(centerX, buttonY + (buttonSpacing * 2), 'CONTROLS', () => {
            this.scene.sound.play('click', { volume: 0.5 });
            this.showControls();
        });
        this.menuContainer.add(controlsBtn);

        // Main Menu button
        const exitBtn = this.createScrollButton(centerX, buttonY + (buttonSpacing * 3), 'MAIN MENU', () => {
            this.scene.sound.play('click', { volume: 0.5 });
            this.exitToMenu();
        });
        this.menuContainer.add(exitBtn);

        // Add save info if available
        this.addSaveInfo(centerX, centerY + 200);
    }

    /**
     * Creates an enhanced medieval scroll background with detailed graphics
     */
    private createScrollBackground(centerX: number, centerY: number): Phaser.GameObjects.Graphics {
        const scroll = this.scene.add.graphics();

        // Main parchment body with aged paper texture
        scroll.fillStyle(0xF5DEB3, 0.95); // Wheat/aged paper color
        scroll.fillRoundedRect(centerX - 220, centerY - 280, 440, 560, 15);

        // Add darker edges for depth and aging effect
        scroll.fillStyle(0xD2B48C, 0.8); // Tan color for edges
        scroll.fillRoundedRect(centerX - 215, centerY - 275, 430, 550, 12);

        // Inner scroll area
        scroll.fillStyle(0xFAF0E6, 0.9); // Linen color for main area
        scroll.fillRoundedRect(centerX - 200, centerY - 260, 400, 520, 10);

        // Scroll rod at top - wooden appearance
        scroll.fillStyle(0x8B4513, 1); // Saddle brown
        scroll.fillRoundedRect(centerX - 240, centerY - 300, 480, 20, 10);
        scroll.fillStyle(0xA0522D, 1); // Sienna highlight
        scroll.fillRoundedRect(centerX - 240, centerY - 298, 480, 8, 4);

        // Scroll rod at bottom
        scroll.fillStyle(0x8B4513, 1);
        scroll.fillRoundedRect(centerX - 240, centerY + 280, 480, 20, 10);
        scroll.fillStyle(0xA0522D, 1);
        scroll.fillRoundedRect(centerX - 240, centerY + 282, 480, 8, 4);

        // Decorative corner flourishes
        this.addScrollDecorations(scroll, centerX, centerY);

        // Border outline
        scroll.lineStyle(2, 0x8B4513, 0.8);
        scroll.strokeRoundedRect(centerX - 200, centerY - 260, 400, 520, 10);

        scroll.setScrollFactor(0);
        return scroll;
    }

    /**
     * Creates a custom scroll-themed button with hover effects
     */
    private createScrollButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const button = this.scene.add.container(x, y);
        button.setScrollFactor(0);

        // Button background - scroll fragment appearance
        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(0xF5DEB3, 0.9); // Matching scroll color
        buttonBg.fillRoundedRect(-80, -20, 160, 40, 8);

        // Button border
        buttonBg.lineStyle(2, 0x8B4513, 0.8);
        buttonBg.strokeRoundedRect(-80, -20, 160, 40, 8);

        // Decorative corner dots
        buttonBg.fillStyle(0x8B4513, 1);
        buttonBg.fillCircle(-70, -10, 2);
        buttonBg.fillCircle(70, -10, 2);
        buttonBg.fillCircle(-70, 10, 2);
        buttonBg.fillCircle(70, 10, 2);

        // Button text using game font
        const buttonText = this.scene.add.bitmapText(0, 0, '8-bit', text, 16);
        buttonText.setOrigin(0.5);
        buttonText.setTint(0x654321); // Dark brown text
        buttonText.setScrollFactor(0);

        button.add([buttonBg, buttonText]);

        // Make interactive with hover effects
        button.setSize(160, 40);
        button.setInteractive();

        // Hover effects
        button.on('pointerover', () => {
            button.setScale(1.05);
            buttonText.setTint(0x8B0000); // Dark red on hover
        });

        button.on('pointerout', () => {
            button.setScale(1.0);
            buttonText.setTint(0x654321); // Back to brown
        });

        button.on('pointerdown', callback);

        return button;
    }

    /**
     * Adds decorative flourishes to scroll corners
     */
    private addScrollDecorations(scroll: Phaser.GameObjects.Graphics, centerX: number, centerY: number): void {
        // Top corners - small decorative curves
        scroll.lineStyle(3, 0x8B4513, 0.6);
        scroll.beginPath();
        scroll.arc(centerX - 160, centerY - 220, 15, 0, Math.PI * 0.5);
        scroll.strokePath();

        scroll.beginPath();
        scroll.arc(centerX + 160, centerY - 220, 15, Math.PI * 0.5, Math.PI);
        scroll.strokePath();

        // Bottom corners
        scroll.beginPath();
        scroll.arc(centerX - 160, centerY + 220, 15, Math.PI * 1.5, Math.PI * 2);
        scroll.strokePath();

        scroll.beginPath();
        scroll.arc(centerX + 160, centerY + 220, 15, Math.PI, Math.PI * 1.5);
        scroll.strokePath();
    }

    private addSaveInfo(centerX: number, centerY: number): void {
        if (SaveSystem.hasSaveData()) {
            const saveInfo = this.scene.add.bitmapText(centerX, centerY, '8-bit', 'Save data available', 16);
            saveInfo.setOrigin(0.5);
            saveInfo.setTint(0x00ff00);
            saveInfo.setScrollFactor(0);
            this.menuContainer!.add(saveInfo);
        }
    }

    private saveGame(): void {
        try {
            const worldScene = this.scene as any;

            // Get all required game objects from the world scene
            const player = worldScene.player;
            const enemies = worldScene.enemies || [];
            const trees = worldScene.trees || [];
            const items = worldScene.items || [];

            // Gather comprehensive game state information
            const gameState = {
                // Day/Night cycle information
                timeOfDay: worldScene.dayNightCycle ?
                    (worldScene.dayNightCycle.isCurrentlyNight() ? 'night' : 'day') : 'day',
                currentTime: worldScene.dayNightCycle ?
                    worldScene.dayNightCycle.getCurrentTime() : 0.5,
                darknessIntensity: worldScene.dayNightCycle ?
                    worldScene.dayNightCycle.getDarknessIntensity() : 0,

                // Enemy enhancement tracking (night bonuses)
                enemiesEnhanced: worldScene.dayNightCycle ?
                    (worldScene.dayNightCycle.isCurrentlyNight() ? 1 : 0) : 0,

                // Flashlight state
                lanternActive: worldScene.lantern ?
                    worldScene.lantern.isLit() : false,

                // Tree light emission state
                treeLightActive: worldScene.treeLightEmission ?
                    worldScene.treeLightEmission.isLightActive() : false,

                // Player stamina and cooldowns
                playerStamina: player.sprintCooldown || false,
                attackLightCooldown: player.attackLightCooldown || false,
                attackHeavyCooldown: player.attackHeavyCooldown || false,

                // Camera position for restoration
                cameraX: worldScene.cameras.main.scrollX,
                cameraY: worldScene.cameras.main.scrollY
            };

            // Call SaveSystem with proper parameters
            const success = SaveSystem.saveGame(player, enemies, trees, items, gameState);

            if (!success) {
                console.error('Failed to save game');
                return;
            }

            // Show save feedback
            const saveFeedback = this.scene.add.bitmapText(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 250,
                '8-bit',
                'Game Saved!',
                20
            );
            saveFeedback.setOrigin(0.5);
            saveFeedback.setTint(0x00ff00);
            saveFeedback.setScrollFactor(0);
            this.menuContainer!.add(saveFeedback);

            // Remove feedback after 2 seconds
            this.scene.time.delayedCall(2000, () => {
                saveFeedback.destroy();
            });

            console.log('Game saved successfully');
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }

    private showControls(): void {
        this.showingControls = true;

        // Hide menu buttons (note: this will need updating after we fix the button storage)
        // For now, hide the entire menu container to avoid issues
        if (this.menuContainer) {
            this.menuContainer.setVisible(false);
        }

        // Create controls display
        this.controlsDisplay = this.scene.add.container(0, 0);
        this.controlsDisplay.setScrollFactor(0);
        this.controlsDisplay.setDepth(10002);

        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        // Enhanced controls scroll background
        const controlsBg = this.createControlsScrollBackground(centerX, centerY);
        this.controlsDisplay.add(controlsBg);

        // Controls title
        const controlsTitle = this.scene.add.bitmapText(centerX, centerY - 150, '8-bit', 'CONTROLS', 24);
        controlsTitle.setOrigin(0.5);
        controlsTitle.setTint(0x8B0000); // Dark red for better contrast on brown
        controlsTitle.setScrollFactor(0);
        this.controlsDisplay.add(controlsTitle);

        // Controls organized in two columns to fit better
        const leftControls = [
            'WASD - Move',
            'Shift - Sprint',
            'Space - Light Attack',
            'Ctrl - Heavy Attack',
            'E - Pickup Items',
            'F - Toggle Lantern',
            'I - Inventory'
        ];

        const rightControls = [
            'P - Pause Menu',
            'F1 - Debug Panel',
            'F2 - Collision Boxes',
            'F3 - Show Paths',
            'F4 - Peak Day',
            'F5 - Peak Night'
        ];

        // Left column
        leftControls.forEach((control, index) => {
            const controlText = this.scene.add.bitmapText(centerX - 120, centerY - 120 + (index * 22), '8-bit', control, 14);
            controlText.setOrigin(0, 0.5);
            controlText.setTint(0x000000);
            controlText.setScrollFactor(0);
            this.controlsDisplay?.add(controlText);
        });

        // Right column  
        rightControls.forEach((control, index) => {
            const controlText = this.scene.add.bitmapText(centerX + 20, centerY - 120 + (index * 22), '8-bit', control, 14);
            controlText.setOrigin(0, 0.5);
            controlText.setTint(0x000000);
            controlText.setScrollFactor(0);
            this.controlsDisplay?.add(controlText);
        });

        // Back button using scroll style
        const backBtn = this.createScrollButton(centerX, centerY + 180, 'BACK', () => {
            this.scene.sound.play('click', { volume: 0.5 });
            this.hideControls();
        });
        this.controlsDisplay.add(backBtn);
    }

    /**
     * Creates an enhanced scroll background specifically for the controls display
     */
    private createControlsScrollBackground(centerX: number, centerY: number): Phaser.GameObjects.Graphics {
        const scroll = this.scene.add.graphics();

        // Larger scroll for controls - main parchment body
        scroll.fillStyle(0xF5DEB3, 0.95); // Wheat/aged paper color
        scroll.fillRoundedRect(centerX - 280, centerY - 220, 560, 440, 15);

        // Add darker edges for depth
        scroll.fillStyle(0xD2B48C, 0.8); // Tan color for edges
        scroll.fillRoundedRect(centerX - 275, centerY - 215, 550, 430, 12);

        // Inner scroll area
        scroll.fillStyle(0xFAF0E6, 0.9); // Linen color for main area
        scroll.fillRoundedRect(centerX - 260, centerY - 200, 520, 400, 10);

        // Scroll rod at top - wooden appearance
        scroll.fillStyle(0x8B4513, 1); // Saddle brown
        scroll.fillRoundedRect(centerX - 300, centerY - 240, 600, 20, 10);
        scroll.fillStyle(0xA0522D, 1); // Sienna highlight
        scroll.fillRoundedRect(centerX - 300, centerY - 238, 600, 8, 4);

        // Scroll rod at bottom
        scroll.fillStyle(0x8B4513, 1);
        scroll.fillRoundedRect(centerX - 300, centerY + 220, 600, 20, 10);
        scroll.fillStyle(0xA0522D, 1);
        scroll.fillRoundedRect(centerX - 300, centerY + 222, 600, 8, 4);

        // Border outline
        scroll.lineStyle(2, 0x8B4513, 0.8);
        scroll.strokeRoundedRect(centerX - 260, centerY - 200, 520, 400, 10);

        scroll.setScrollFactor(0);
        return scroll;
    }

    private hideControls(): void {
        if (this.controlsDisplay) {
            this.controlsDisplay.destroy();
            this.controlsDisplay = null;
        }

        // Show menu container again
        if (this.menuContainer) {
            this.menuContainer.setVisible(true);
        }
        this.showingControls = false;
    }

    private exitToMenu(): void {
        this.hide();

        // Stop any playing music before transitioning to menu
        console.log('PauseMenu: Stopping all music before returning to main menu');
        this.scene.sound.stopAll();

        this.scene.scene.start('menuScene');
    }

    private destroyMenu(): void {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }
        this.showingControls = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        this.destroyMenu();
    }
}