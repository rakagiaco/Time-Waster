import Phaser from 'phaser';

export class Item extends Phaser.Physics.Arcade.Sprite {
    private itemType: string;
    private soundEffect?: { sound: string; volume: number };

    constructor(scene: Phaser.Scene, x: number, y: number, itemType: string, soundEffect?: { sound: string; volume: number }) {
        super(scene, x, y, itemType);
        
        this.itemType = itemType;
        this.soundEffect = soundEffect;
        
        console.log(`Creating Item: ${itemType} at (${x}, ${y})`);
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Debug: Check if texture exists
        if (!scene.textures.exists(itemType)) {
            console.error(`Item texture '${itemType}' does not exist!`);
        } else {
            console.log(`Item texture '${itemType}' exists and loaded`);
        }
        
        // Setup physics
        this.setCollideWorldBounds(false);
        this.setSize(16, 16);
        this.setOffset(8, 8);
        
        // Make interactive
        this.setInteractive();
    }

    public getItemType(): string {
        // Map texture names to quest item types
        if (this.itemType === 'bush-1') {
            return 'mysterious herb'; // bush-1 texture represents mysterious herb for quests
        }
        return this.itemType;
    }

    public getSoundEffect(): { sound: string; volume: number } | undefined {
        return this.soundEffect;
    }

    public collect(): void {
        // Play collect sound if available
        if (this.soundEffect) {
            this.scene.sound.play(this.soundEffect.sound, { volume: this.soundEffect.volume });
        }
        
        // Destroy the item
        this.destroy();
    }

    public update(): void {
        // Item update logic if needed
    }
}
