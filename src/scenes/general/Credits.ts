import Phaser from 'phaser';

export class Credits extends Phaser.Scene {


    constructor() {
        super('Credits');
    }

    create(): void {
        this.cameras.main.setBackgroundColor('0x000000');

        // Setup custom cursor
        this.input.setDefaultCursor('url(/img/cursor.png), pointer');

        // Credits text
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 - 100, '8-bit-white', 'Credits', 64).setOrigin(0.5);
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 - 50, '8-bit-white', 'Game created by C.J. Moshy', 32).setOrigin(0.5);
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2, '8-bit-white', 'for UCSC\'s CMPM 120', 32).setOrigin(0.5);
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 + 50, '8-bit-white', 'Audio assets from Pixabay', 24).setOrigin(0.5);
        this.add.bitmapText((this.game.config.width as number) / 2, (this.game.config.height as number) / 2 + 100, '8-bit-white', 'Build system converted to Vite + TypeScript', 24).setOrigin(0.5);

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
