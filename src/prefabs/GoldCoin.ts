import Phaser from 'phaser';

/**
 * GoldCoin - A collectible gold coin item
 * Creates a pixel art gold coin sprite using graphics
 */
export class GoldCoin extends Phaser.GameObjects.Graphics {
    private value: number;
    private sparkleTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, value: number = 1) {
        super(scene);
        
        this.value = value;
        this.x = x;
        this.y = y;
        this.setDepth(10); // Above ground items
        
        this.createGoldCoinSprite();
        this.setupPhysics();
        
        scene.add.existing(this);
    }

    private createGoldCoinSprite(): void {
        this.clear();
        
        // Main coin body (gold)
        this.fillStyle(0xFFD700); // Gold color
        this.fillCircle(0, 0, 8); // 16x16 pixel coin
        
        // Inner circle (darker gold)
        this.fillStyle(0xFFA500); // Darker gold
        this.fillCircle(0, 0, 6);
        
        // Center highlight (bright gold)
        this.fillStyle(0xFFFF00); // Bright gold
        this.fillCircle(0, 0, 3);
        
        // Edge highlight
        this.lineStyle(1, 0xFFFF00, 0.8);
        this.strokeCircle(0, 0, 8);
        
        // Add coin details
        this.addCoinDetails();
    }

    private addCoinDetails(): void {
        // Add some texture/details to make it look more like a coin
        this.fillStyle(0xFFD700, 0.6);
        
        // Small dots around the edge
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const radius = 6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.fillCircle(x, y, 1);
        }
        
        // Center symbol (simple cross)
        this.fillStyle(0xFFA500);
        this.fillRect(-1, -3, 2, 6); // Vertical line
        this.fillRect(-3, -1, 6, 2); // Horizontal line
    }

    private setupPhysics(): void {
        this.scene.physics.add.existing(this);
        this.body!.setSize(16, 16);
        this.body!.setOffset(-8, -8);
        
        // Make it collectible
        this.setInteractive();
        this.on('pointerdown', () => {
            this.collect();
        });
    }

    private collect(): void {
        // Find the player
        const player = this.scene.children.list.find(child => 
            child.constructor.name === 'Player'
        ) as any;
        
        if (player && player.p1Inventory) {
            // Add gold to inventory
            player.p1Inventory.add('gold-coin', this.value);
            
            // Play collection sound
            this.scene.sound.play('collect-herb', { volume: 0.5 });
            
            // Update inventory UI
            const worldScene = this.scene as any;
            if (worldScene.inventoryUI) {
                worldScene.inventoryUI.updateInventoryDisplay();
            }
            
            console.log(`Collected ${this.value} gold coin(s)`);
            
            // Destroy the coin
            this.destroy();
        }
    }

    public update(delta: number): void {
        // Add subtle sparkle effect
        this.sparkleTimer += delta;
        if (this.sparkleTimer > 2000) { // Every 2 seconds
            this.sparkleTimer = 0;
            this.addSparkleEffect();
        }
    }

    private addSparkleEffect(): void {
        // Create temporary sparkle particles
        const sparkle = this.scene.add.graphics();
        sparkle.setDepth(15);
        sparkle.x = this.x + (Math.random() - 0.5) * 20;
        sparkle.y = this.y + (Math.random() - 0.5) * 20;
        
        sparkle.fillStyle(0xFFFF00, 0.8);
        sparkle.fillCircle(0, 0, 2);
        
        // Animate sparkle
        this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 500,
            onComplete: () => {
                sparkle.destroy();
            }
        });
    }

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }
}
