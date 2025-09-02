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
            console.log('Available textures:', this.textures.getTextureKeys());
            console.log('Available fonts:', this.cache.bitmapFont.entries.entries);
        
        // Check if button textures exist
        console.log('Button textures check:');
        console.log('continue-game-button exists:', this.textures.exists('continue-game-button'));
        console.log('new-game-button exists:', this.textures.exists('new-game-button'));
        console.log('credits-button exists:', this.textures.exists('credits-button'));
        console.log('freeplay-button exists:', this.textures.exists('freeplay-button'));
        
        //title
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.width as number) / 2 - 100, '8-bit', 'Time Waster', 96).setOrigin(0.5);

        this.cameras.main.setBackgroundColor('0xffffff');

        // Setup custom cursor
        this.input.setDefaultCursor('url(/img/cursor.png), pointer');

        // Continue button
        const hasSaveData = SaveSystem.hasSaveData();
        const continueBtn = this.add.image((this.game.config.width as number) / 2, ((this.game.config.height as number) / 2) + 50, 'continue-game-button')
            .setScale(2)
            .setInteractive({ useHandCursor: true })
            .setAlpha(hasSaveData ? 1.0 : 0.5);
        
        console.log('Continue button created:', continueBtn);
        console.log('Continue button interactive:', continueBtn.input);
        console.log('Has save data:', hasSaveData);
        
        if (hasSaveData) {
            continueBtn.on('pointerdown', () => {
                console.log('Continue button clicked - loading saved game');
                this.scene.start('worldScene', { loadSaveData: true });
            });
        } else {
            continueBtn.on('pointerdown', () => {
                console.log('Continue button clicked - no save data available');
                // Could show a message here
            });
        }

        // New Game button
        this.add.image((this.game.config.width as number) / 2, ((this.game.config.height as number) / 2) + 130, 'new-game-button')
            .setScale(2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                console.log('New Game button clicked');
                this.scene.start('worldScene');
            });

        // Credits button
        this.add.image((this.game.config.width as number) / 2, ((this.game.config.height as number) / 2) + 210, 'credits-button')
            .setScale(2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                console.log('Credits button clicked');
                this.scene.start('Credits');
            });

        // Freeplay button
        this.add.image((this.game.config.width as number) / 2, ((this.game.config.height as number) / 2) + 290, 'freeplay-button')
            .setScale(2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                console.log('Freeplay button clicked');
                this.scene.start('worldScene');
            });

        console.log('Menu scene setup complete');
        
        } catch (error) {
            console.error('=== CRITICAL ERROR IN MENU CREATE ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('=====================================');
        }
    }
}
