import Phaser from 'phaser';

export class TestScene extends Phaser.Scene {
    constructor() {
        super('TestScene');
    }

    create(): void {
        try {
            console.log('=== TEST SCENE CREATE ===');
            console.log('Scene key:', this.scene.key);
            console.log('Game config:', this.game.config);
            
            // Set background color
            this.cameras.main.setBackgroundColor(0x00ff00);
            
            // Add simple text
            const text = this.add.text(400, 300, 'PHASER IS WORKING!', {
                fontSize: '32px',
                color: '#000000'
            }).setOrigin(0.5);
            
            console.log('Test text created:', text);
            console.log('Test scene setup complete');
            
        } catch (error) {
            console.error('=== CRITICAL ERROR IN TEST SCENE ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('====================================');
        }
    }
}
