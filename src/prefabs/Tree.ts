import Phaser from 'phaser';
import { Item } from './Item';
import { Player } from './Player';

export class Tree extends Phaser.Physics.Arcade.Sprite {
    private treeType: string;
    private fruitItems: Item[] = [];
    private hasFruit: boolean = true;
    private fruitRespawnTimer: number = 0;
    private fruitRespawnDelay: number = 300000; // 5 minutes
    public entity_text!: Phaser.GameObjects.BitmapText; // Name tag for special trees

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

        // Create 1-3 fruit items within the tree canopy
        const fruitCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < fruitCount; i++) {
            // Position fruit within the tree canopy area
            // Use the tree's visual bounds to place fruit in the upper portion
            const treeWidth = this.displayWidth;
            const treeHeight = this.displayHeight;
            
            // Position fruit in the upper 60% of the tree (canopy area)
            const fruitX = this.x + (Math.random() - 0.5) * treeWidth * 0.8; // Random X within 80% of tree width
            const fruitY = this.y - (Math.random() * treeHeight * 0.6) - treeHeight * 0.2; // Upper 60% of tree height

            // Determine fruit type based on tree type
            const fruitType = this.getFruitTypeForTree();

            const fruit = new Item(
                this.scene,
                fruitX,
                fruitY,
                fruitType,
                { sound: 'collect-herb', volume: 0.3 }
            );

            // Make fruit smaller and more tree-like
            fruit.setScale(0.6);

            // Set fruit depth to be between trees underlayer and overlayer
            // This ensures fruit appears within the tree layers
            fruit.setDepth(52); // Between trees underlayer (50) and trees overlayer (60)

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

        // All fruit collected - will respawn in 5 minutes
    }

    public update(): void {
        // Handle fruit respawn
        if (!this.hasFruit) {
            this.fruitRespawnTimer += this.scene.game.loop.delta;

            if (this.fruitRespawnTimer >= this.fruitRespawnDelay) {
                this.hasFruit = true;
                this.createFruit();
                // Fruit respawned after 5 minutes
            }
        }

        // Update fruit depth to match tree depth system
        this.updateFruitDepth();

        // Update name tag position
        this.updateNameTag();
    }

    /**
     * Update fruit depth based on tree position
     * Fruit follows the same dynamic depth system as AI entities
     */
    private updateFruitDepth(): void {
        if (this.fruitItems.length === 0) return;

        const treeY = this.y;
        
        // Fixed depth values for static objects (same as World.ts)
        const STATIC_DEPTHS = {
            ROCKS: 40,
            TREES_UNDER: 50,
            TREES_OVER: 60,
            BUILDING_WALLS: 90,
            BUILDING_PROPS_OVER: 130
        };
        
        // Define depth zones for fruit (same as AI entities)
        const FRUIT_DEPTH_ZONES = [
            {
                name: 'rocks',
                yMin: 200,
                yMax: 400,
                yThreshold: 300,
                aboveDepth: STATIC_DEPTHS.ROCKS + 5,  // Fruit above rocks
                belowDepth: STATIC_DEPTHS.ROCKS - 5   // Fruit below rocks
            },
            {
                name: 'trees',
                yMin: 100,
                yMax: 500,
                yThreshold: 300,
                aboveDepth: STATIC_DEPTHS.TREES_UNDER + 5,  // Fruit above trees underlayer
                belowDepth: STATIC_DEPTHS.TREES_OVER - 5    // Fruit below trees overlayer
            },
            {
                name: 'buildings',
                yMin: 300,
                yMax: 600,
                yThreshold: 450,
                aboveDepth: STATIC_DEPTHS.BUILDING_WALLS + 5,  // Fruit above building walls
                belowDepth: STATIC_DEPTHS.BUILDING_PROPS_OVER - 5  // Fruit below building props
            }
        ];

        // Determine fruit depth based on tree position
        let fruitDepth = 52; // Default depth between trees underlayer and overlayer

        for (const zone of FRUIT_DEPTH_ZONES) {
            if (treeY >= zone.yMin && treeY <= zone.yMax) {
                if (treeY < zone.yThreshold) {
                    fruitDepth = zone.aboveDepth;
                } else {
                    fruitDepth = zone.belowDepth;
                }
                break;
            }
        }

        // Apply depth to all fruit
        this.fruitItems.forEach(fruit => {
            fruit.setDepth(fruitDepth);
        });
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
            // Player too far from fruit to collect
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
            // All fruit collected - will respawn in 5 minutes
        }

        // Fruit collected from tree
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

    /**
     * Creates a name tag above the tree
     */
    public createNameTag(name: string): void {
        if (!this.entity_text) {
            // Position nametag at the top center of the tree's visual bounds
            // Adjust X position to account for tree's visual center
            const nametagX = this.x - (this.displayWidth * 0.2); // Move left more to center
            const nametagY = this.y - (this.displayHeight / 2) - 20;
            
            this.entity_text = this.scene.add.bitmapText(nametagX, nametagY, '8-bit', name, 20);
            this.entity_text.setOrigin(0.5, 1);
            this.entity_text.setScrollFactor(1);
            this.entity_text.setDepth(this.depth + 1);
            this.entity_text.setTint(0x00ff00); // Green color for Tree of Life
            
            // Tree of Life nametag created
        }
    }

    /**
     * Updates the name tag position to follow the tree
     */
    public updateNameTag(): void {
        if (this.entity_text) {
            // Position nametag at the top center of the tree's visual bounds
            // Adjust X position to account for tree's visual center
            const nametagX = this.x - (this.displayWidth * 0.2); // Move left more to center
            const nametagY = this.y - (this.displayHeight / 2) - 20;
            this.entity_text.setPosition(nametagX, nametagY);
        }
    }
}
