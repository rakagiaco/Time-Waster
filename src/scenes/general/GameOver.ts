import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';

export class GameOver extends Phaser.Scene {


    constructor() {
        super('GameOver');
    }

    create(): void {
        this.cameras.main.setBackgroundColor('0x000000');

        // Setup custom cursor
        this.input.setDefaultCursor('url(/img/cursor.png), pointer');

        // Game Over text
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 - 100, 'pixel-red', 'GAME OVER', 64).setOrigin(0.5);
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 - 50, '8-bit-white', 'You have been defeated!', 32).setOrigin(0.5);

        // New Game button
        this.add.image((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 + 50, 'new-game-button')
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Clear ALL localStorage keys to prevent interference
                SaveSystem.clearAllGameData();
                this.sound.play('click', { volume: 0.5 });
                this.scene.start('worldScene', { inv: undefined, qobj: undefined });
            });

        // Menu button
        this.add.image((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 + 150, 'menu-button')
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.sound.play('click', { volume: 0.5 });
                this.scene.start('menuScene');
            });
    }
}
