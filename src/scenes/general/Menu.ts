import Phaser from 'phaser';

interface MenuData {
    qobj?: any;
    inv?: any;
}

export class Menu extends Phaser.Scene {


    constructor() {
        super('menuScene');
    }

    create(data: MenuData): void {
        console.log('Menu scene create() called');
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

        // Continue button
        const continueBtn = this.add.image((this.game.config.width as number) / 2, ((this.game.config.height as number) / 2) + 50, 'continue-game-button')
            .setScale(2)
            .setInteractive({ useHandCursor: true });
        
        console.log('Continue button created:', continueBtn);
        console.log('Continue button interactive:', continueBtn.input);
        
        continueBtn.on('pointerdown', () => {
            console.log('Continue button clicked');
            this.scene.start('worldScene');
        });

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
                this.scene.start('creditsScene');
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
    }
}
