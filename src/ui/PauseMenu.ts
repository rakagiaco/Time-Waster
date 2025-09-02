import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';

export class PauseMenu {
    private scene: Phaser.Scene;
    private isVisible: boolean = false;
    private menuContainer: Phaser.GameObjects.Container | null = null;
    private menuButtons: Phaser.GameObjects.Image[] = [];
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

        // Create menu container
        this.menuContainer = this.scene.add.container(0, 0);
        this.menuContainer.setScrollFactor(0);
        this.menuContainer.setDepth(10001);
        this.menuContainer.setVisible(true);

        // Create scroll-like background
        const scrollBackground = this.scene.add.graphics();
        scrollBackground.fillStyle(0x8B4513, 0.95); // Brown parchment color
        scrollBackground.fillRoundedRect(centerX - 200, centerY - 250, 400, 500, 20);
        
        // Add scroll texture effect
        scrollBackground.lineStyle(3, 0x654321, 1);
        scrollBackground.strokeRoundedRect(centerX - 200, centerY - 250, 400, 500, 20);
        
        // Add scroll roll effect at top and bottom
        scrollBackground.fillStyle(0x654321, 1);
        scrollBackground.fillRoundedRect(centerX - 220, centerY - 270, 440, 40, 20);
        scrollBackground.fillRoundedRect(centerX - 220, centerY + 210, 440, 40, 20);

        scrollBackground.setScrollFactor(0);
        this.menuContainer.add(scrollBackground);

        // Create title
        const title = this.scene.add.bitmapText(centerX, centerY - 200, '8-bit', 'PAUSE MENU', 32);
        title.setOrigin(0.5);
        title.setTint(0x8B0000);
        title.setScrollFactor(0);
        this.menuContainer.add(title);

        // Create menu buttons using the same approach as main menu
        const buttonY = centerY - 100;
        const buttonSpacing = 60;

        // Continue button
        const continueBtn = this.scene.add.image(centerX, buttonY, 'continue-game-button')
            .setOrigin(0.5)
            .setScale(1.2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sound.play('click', { volume: 0.5 });
                this.hide();
            });
        this.menuContainer.add(continueBtn);
        this.menuButtons.push(continueBtn);

        // Save Game button (using new-game-button but with different text)
        const saveBtn = this.scene.add.image(centerX, buttonY + buttonSpacing, 'new-game-button')
            .setOrigin(0.5)
            .setScale(1.2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sound.play('click', { volume: 0.5 });
                this.saveGame();
            });
        this.menuContainer.add(saveBtn);
        this.menuButtons.push(saveBtn);

        // Controls button
        const controlsBtn = this.scene.add.image(centerX, buttonY + (buttonSpacing * 2), 'credits-button')
            .setOrigin(0.5)
            .setScale(1.2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sound.play('click', { volume: 0.5 });
                this.showControls();
            });
        this.menuContainer.add(controlsBtn);
        this.menuButtons.push(controlsBtn);

        // Exit to Menu button
        const exitBtn = this.scene.add.image(centerX, buttonY + (buttonSpacing * 3), 'menu-button')
            .setOrigin(0.5)
            .setScale(1.2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sound.play('click', { volume: 0.5 });
                this.exitToMenu();
            });
        this.menuContainer.add(exitBtn);
        this.menuButtons.push(exitBtn);

        // Add save info if available
        this.addSaveInfo(centerX, centerY + 200);
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
            SaveSystem.saveGame(worldScene);
            
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
        
        // Hide menu buttons
        this.menuButtons.forEach(btn => btn.setVisible(false));
        
        // Create controls display
        this.controlsDisplay = this.scene.add.container(0, 0);
        this.controlsDisplay.setScrollFactor(0);
        this.controlsDisplay.setDepth(10002);
        
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Controls background - use scroll-like background instead of black
        const controlsBg = this.scene.add.graphics();
        controlsBg.fillStyle(0x8B4513, 0.95); // Brown parchment color
        controlsBg.fillRoundedRect(centerX - 300, centerY - 200, 600, 400, 20);
        
        // Add scroll texture effect
        controlsBg.lineStyle(3, 0x654321, 1);
        controlsBg.strokeRoundedRect(centerX - 300, centerY - 200, 600, 400, 20);
        
        controlsBg.setScrollFactor(0);
        this.controlsDisplay.add(controlsBg);
        
        // Controls title
        const controlsTitle = this.scene.add.bitmapText(centerX, centerY - 150, '8-bit', 'CONTROLS', 24);
        controlsTitle.setOrigin(0.5);
        controlsTitle.setTint(0x8B0000); // Dark red for better contrast on brown
        controlsTitle.setScrollFactor(0);
        this.controlsDisplay.add(controlsTitle);
        
        // Controls list
        const controls = [
            'WASD - Move',
            'Shift - Sprint',
            'Space - Light Attack',
            'Ctrl - Heavy Attack',
            'E - Pickup Items',
            'F - Toggle Flashlight',
            'I - Inventory',
            'P - Pause Menu',
            'F1 - Debug Panel',
            'F2 - Collision Boxes',
            'F3 - Show Paths',
            'F4 - Peak Day',
            'F5 - Peak Night'
        ];
        
        controls.forEach((control, index) => {
            const controlText = this.scene.add.bitmapText(centerX, centerY - 100 + (index * 25), '8-bit', control, 16);
            controlText.setOrigin(0.5);
            controlText.setTint(0x000000); // Black text for better contrast on brown background
            controlText.setScrollFactor(0);
            this.controlsDisplay.add(controlText);
        });
        
        // Back button
        const backBtn = this.scene.add.image(centerX, centerY + 150, 'menu-button')
            .setOrigin(0.5)
            .setScale(1.2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sound.play('click', { volume: 0.5 });
                this.hideControls();
            });
        this.controlsDisplay.add(backBtn);
        
        this.menuContainer!.add(this.controlsDisplay);
    }

    private hideControls(): void {
        if (this.controlsDisplay) {
            this.controlsDisplay.destroy();
            this.controlsDisplay = null;
        }
        
        // Show menu buttons again
        this.menuButtons.forEach(btn => btn.setVisible(true));
        this.showingControls = false;
    }

    private exitToMenu(): void {
        this.hide();
        this.scene.scene.start('menuScene');
    }

    private destroyMenu(): void {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }
        this.menuButtons = [];
        this.showingControls = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        this.destroyMenu();
    }
}