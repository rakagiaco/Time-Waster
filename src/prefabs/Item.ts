import Phaser from 'phaser';

export class Item extends Phaser.Physics.Arcade.Sprite {
    private itemType: string;
    private soundEffect?: { sound: string; volume: number };

    constructor(scene: Phaser.Scene, x: number, y: number, itemType: string, soundEffect?: { sound: string; volume: number }) {
        super(scene, x, y, itemType);
        
        this.itemType = itemType;
        this.soundEffect = soundEffect;
        
        // Creating item
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Check if texture exists, create fallback if not
        if (!scene.textures.exists(itemType)) {
            console.warn(`Item texture '${itemType}' does not exist, creating fallback texture`);
            this.createMissingTextureFallback(itemType);
        } else {
            // Item texture exists and loaded
        }
        
        // Setup physics
        this.setCollideWorldBounds(false);
        this.setSize(16, 16);
        this.setOffset(0, 0); // No offset - let the size handle positioning
        
        // Make interactive
        this.setInteractive();
    }

    public getItemType(): string {
        // Map texture names to quest item types
        if (this.itemType === 'bush-1' || this.itemType === 'mysterious-herb') {
            return 'mysterious herb'; // Return quest item type for consistency
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
        
        // If item is respawnable, mark as collected instead of destroying
        if (this.getData('isRespawnable')) {
            this.setData('collectedTime', Date.now());
            this.setVisible(false);
            this.setActive(false);
        } else {
            // Destroy non-respawnable items
            this.destroy();
        }
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

    /**
     * Creates a soft bounce animation when item is dropped on the ground
     * Can be used for any item including weapons
     */
    public playDropBounceAnimation(): void {
        // Store original Y position
        const originalY = this.y;
        
        // Create bounce tween
        this.scene.tweens.add({
            targets: this,
            y: originalY - 8, // Bounce up 8 pixels
            duration: 200,
            ease: 'Power2',
            yoyo: true, // Bounce back down
            repeat: 2, // Bounce 3 times total
            onComplete: () => {
                // Ensure item returns to exact original position
                this.y = originalY;
            }
        });
        
        // Add slight rotation for more dynamic effect
        this.scene.tweens.add({
            targets: this,
            rotation: 0.1, // Slight rotation
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.rotation = 0; // Reset rotation
            }
        });
    }


}
