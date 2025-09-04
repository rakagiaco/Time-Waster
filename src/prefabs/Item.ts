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
        
        // Check if texture exists, create fallback if not
        if (!scene.textures.exists(itemType)) {
            console.warn(`Item texture '${itemType}' does not exist, creating fallback texture`);
            this.createMissingTextureFallback(itemType);
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

    private createMissingTextureFallback(itemType: string): void {
        if (this.scene.textures.exists(itemType)) return; // Already exists
        
        const graphics = this.scene.add.graphics();
        
        // Create missing texture indicator - red and white checkerboard pattern
        graphics.fillStyle(0xff0000); // Red
        graphics.fillRect(0, 0, 8, 8);
        graphics.fillRect(8, 8, 8, 8);
        graphics.fillStyle(0xffffff); // White
        graphics.fillRect(8, 0, 8, 8);
        graphics.fillRect(0, 8, 8, 8);
        
        // Add border
        graphics.lineStyle(1, 0x000000);
        graphics.strokeRect(0, 0, 16, 16);
        
        // Add "?" in the center
        graphics.fillStyle(0x000000);
        graphics.fillRect(7, 4, 2, 8);
        graphics.fillRect(6, 5, 4, 2);
        graphics.fillRect(6, 9, 4, 2);
        graphics.fillRect(6, 11, 2, 1);
        
        graphics.generateTexture(itemType, 16, 16);
        graphics.destroy();
    }

}
