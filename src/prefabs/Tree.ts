import Phaser from 'phaser';
import { Item } from './Item';
import { Player } from './Player';

export class Tree extends Phaser.Physics.Arcade.Sprite {
    private treeType: string;
    private fruitItems: Item[] = [];
    private hasFruit: boolean = true;
    private fruitRespawnTimer: number = 0;
    private fruitRespawnDelay: number = 30000; // 30 seconds

    constructor(scene: Phaser.Scene, x: number, y: number, treeType: string) {
        super(scene, x, y, treeType);

        this.treeType = treeType;

        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Setup physics with collision at base of trunk
        this.setCollideWorldBounds(false);
        this.setSize(32, 24); // Smaller height for trunk collision
        this.setOffset(16, 40); // Offset down to base of trunk

        // Enable collision detection
        this.setImmovable(true);
        this.setCollideWorldBounds(false);

        // Set scale based on tree type
        if (treeType === 'tree-2-second') {
            this.setScale(3);
        } else {
            this.setScale(2);
        }

        // Create initial fruit
        this.createFruit();

        // Start tree animation
        this.startTreeAnimation();
    }

    private startTreeAnimation(): void {
        // Determine animation based on tree type and position
        const animVariants = this.getTreeAnimationVariants();
        const randomAnim = animVariants[Math.floor(Math.random() * animVariants.length)];

        if (this.scene.anims.exists(randomAnim)) {
            this.anims.play(randomAnim);
        }
    }

    private getTreeAnimationVariants(): string[] {
        switch (this.treeType) {
            case 'tree-1':
                return ['tree-1-anim0', 'tree-1-anim1', 'tree-1-anim2', 'tree-1-anim3', 'tree-1-anim4', 'tree-1-anim5'];
            case 'tree-2':
                return ['tree-2-anim0', 'tree-2-anim1', 'tree-2-anim2', 'tree-2-anim3'];
            case 'tree-2-second':
                return ['tree-2-anim4', 'tree-2-anim5', 'tree-2-anim6', 'tree-2-anim7'];
            case 'tree-3':
                return ['tree-3-anim'];
            default:
                return ['tree-1-anim0'];
        }
    }
    public clearFruit(): void {
        // Clear existing fruit
        this.fruitItems.forEach(fruit => fruit.destroy());
        this.fruitItems = [];
    }
    private createFruit(): void {
        if (!this.hasFruit) return;

        this.clearFruit()

        // Create 1-3 fruit items around the tree
        const fruitCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < fruitCount; i++) {
            // Position fruit around the tree base
            const angle = (i / fruitCount) * Math.PI * 2;
            const distance = 20 + Math.random() * 15; // 20-35 pixels from tree center
            const fruitX = this.x + Math.cos(angle) * distance;
            const fruitY = this.y + Math.sin(angle) * distance;

            // Determine fruit type based on tree type
            const fruitType = this.getFruitTypeForTree();

            const fruit = new Item(
                this.scene,
                fruitX,
                fruitY,
                fruitType,
                { sound: 'collect-herb', volume: 0.3 }
            );

            // Make fruit smaller
            fruit.setScale(0.8);

            // Make fruit interactive for collection
            fruit.setInteractive();
            fruit.on('pointerdown', () => {
                this.collectFruitFromTree(fruit);
            });

            this.fruitItems.push(fruit);
        }
    }

    public collectFruit(): void {
        if (!this.hasFruit) return;

        // Remove all fruit
        this.fruitItems.forEach(fruit => fruit.destroy());
        this.fruitItems = [];

        this.hasFruit = false;
        this.fruitRespawnTimer = 0;

        console.log(`Fruit collected from ${this.treeType} tree`);
    }

    public update(): void {
        // Handle fruit respawn
        if (!this.hasFruit) {
            this.fruitRespawnTimer += this.scene.game.loop.delta;

            if (this.fruitRespawnTimer >= this.fruitRespawnDelay) {
                this.hasFruit = true;
                this.createFruit();
                console.log(`Fruit respawned on ${this.treeType} tree`);
            }
        }
    }

    public getTreeType(): string {
        return this.treeType;
    }

    public hasFruitAvailable(): boolean {
        return this.hasFruit && this.fruitItems.length > 0;
    }

    public getFruitItems(): Item[] {
        return this.fruitItems;
    }

    private getFruitTypeForTree(): string {
        switch (this.treeType) {
            case 'tree-1': // Oak trees
                return 'apple';
            case 'tree-2': // Pine trees
                return 'pinecone';
            case 'tree-2-second': // Ancient trees
                // Check if this is the Tree of Life (positioned at 200, 200)
                if (this.x === 200 && this.y === 200) {
                    return 'tree-of-life-fruit'; // Special fruit for Tree of Life
                }
                return 'ancient-fruit';
            case 'tree-3': // Cherry blossom trees
                return 'cherry';
            default:
                return 'fruit';
        }
    }

    private collectFruitFromTree(fruit: Item): void {
        // Find the player in the scene
        const player = this.scene.children.list.find(child => child instanceof Player) as Player;

        if (!player) {
            console.error('Player not found for fruit collection');
            return;
        }

        // Check if player is close enough to collect (within 50 pixels)
        const distance = Phaser.Math.Distance.Between(player.x, player.y, fruit.x, fruit.y);
        if (distance > 50) {
            console.log('Player too far from fruit to collect');
            return;
        }

        // Add fruit to player's inventory
        const fruitType = fruit.getItemType();
        player.p1Inventory.add(fruitType, 1);

        // Play collection sound
        if (fruit.getSoundEffect()) {
            this.scene.sound.play(fruit.getSoundEffect()!.sound, {
                volume: fruit.getSoundEffect()!.volume
            });
        }

        // Remove the specific fruit from the tree
        const fruitIndex = this.fruitItems.indexOf(fruit);
        if (fruitIndex > -1) {
            this.fruitItems.splice(fruitIndex, 1);
            fruit.destroy();
        }

        // Update inventory UI if it exists
        const worldScene = this.scene as any;
        if (worldScene.inventoryUI) {
            worldScene.inventoryUI.updateInventoryDisplay();
        }

        // Check if all fruit has been collected
        if (this.fruitItems.length === 0) {
            this.hasFruit = false;
            this.fruitRespawnTimer = 0;
            console.log(`All fruit collected from ${this.treeType} tree`);
        }

        console.log(`Collected ${fruitType} from ${this.treeType} tree`);
    }

    public getCollisionBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    public getCollisionRadius(): number {
        // Return a slightly larger radius for pathfinding to ensure enemies don't get too close
        return Math.max(this.width, this.height) / 2 + 20;
    }
}
