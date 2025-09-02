import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { Ally } from '../../prefabs/Ally';
import { Item } from '../../prefabs/Item';
import { Tree } from '../../prefabs/Tree';
import { DebugManager } from '../../debug/DebugManager';
import { InventoryUI } from '../../ui/InventoryUI';


interface WorldData {
    qobj?: any;
    inv?: any;
}

export class World extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private allies: Ally[] = [];
    private items: Item[] = [];
    private trees: Tree[] = [];
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private tileset!: Phaser.Tilemaps.Tileset | null;
    // private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
    private objlayer!: Phaser.Tilemaps.ObjectLayer | null

    private miniMapCamera!: Phaser.Cameras.Scene2D.Camera;
    private minimapMask!: Phaser.GameObjects.Graphics;
    private minimapPlayerDot!: Phaser.GameObjects.Graphics;
    private debugManager!: DebugManager;
    private inventoryUI!: InventoryUI;

    constructor() {
        super('worldScene');
        console.log('=== WORLD SCENE CONSTRUCTOR ===');
        console.log('Scene key:', 'worldScene');
        console.log('==============================');
    }

    create(data: WorldData): void {
        try {
            console.log('=== WORLD SCENE CREATE ===');
            console.log('Scene key:', this.scene.key);
            console.log('Data received:', data);

            // Create tilemap
            this.createTilemap();

            this.player = new Player(this, 500, 400, data.inv, data.qobj);

            //     // Wait a frame to ensure animations are fully loaded
            //     this.time.delayedCall(100, () => {
            //         try {
            //             console.log('=== CREATING GAME OBJECTS ===');

            // Create enemies
            console.log('Creating enemies...');
            this.createEnemies();
            console.log('Enemies created successfully, count:', this.enemies.length);

            // Create allies
            console.log('Creating allies...');
            this.createAllies();
            console.log('Allies created successfully, count:', this.allies.length);

            // Create items
            console.log('Creating items...');
            this.createItems();
            console.log('Items created successfully, count:', this.items.length);

            // Create trees
            console.log('Creating trees...');
            this.createTrees();
            console.log('Trees created successfully, count:', this.trees.length);

            //             // Setup camera
            console.log('Setting up camera...');
            this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.cameras.main.startFollow(this.player);
            this.cameras.main.setZoom(1.5);
            console.log('Camera setup complete');

            // Setup minimap camera
            console.log('Setting up minimap...');
            this.setupMinimap();
            console.log('Minimap setup complete');

            // Setup debug manager
            console.log('Setting up debug manager...');
            this.debugManager = new DebugManager(this);
            console.log('Debug manager setup complete');

            // Setup inventory UI
            console.log('Setting up inventory UI...');
            this.inventoryUI = new InventoryUI(this);
            this.inventoryUI.setPlayerInventory(this.player.p1Inventory);
            this.inventoryUI.setPlayer(this.player);
            console.log('Inventory UI setup complete');

            // Setup custom cursor
            console.log('Setting up custom cursor...');
            this.input.setDefaultCursor('url(/img/cursor.png), pointer');
            console.log('Custom cursor setup complete');

            //             console.log('=== WORLD SCENE SETUP COMPLETE ===');
            //         } catch (error) {
            //             console.error('=== CRITICAL ERROR CREATING GAME OBJECTS ===');
            //             console.error('Error:', error);
            //             console.error('Stack:', (error as any)?.stack);
            //             console.error('==========================================');
            //         }
            //     });
        } catch (error) {
            console.error('=== CRITICAL ERROR IN WORLD CREATE ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('=====================================');
        }
    }

    update(): void {
        // Update player (only if it exists)
        if (this.player) {
            try {
                this.player.update();
            } catch (error) {
                console.error('Error updating player:', error);
            }
        }

        // Update enemies (with safety checks)
        this.enemies.forEach(enemy => {
            try {
                enemy.update();
            } catch (error) {
                console.error('Error updating enemy:', error);
            }
        });

        // Update allies (with safety checks)
        this.allies.forEach(ally => {
            try {
                ally.update();
            } catch (error) {
                console.error('Error updating ally:', error);
            }
        });

        // Update trees (with safety checks)
        this.trees.forEach(tree => {
            try {
                tree.update();
            } catch (error) {
                console.error('Error updating tree:', error);
            }
        });

        // // Update items (with safety checks)
        // this.items.forEach(item => {
        //     try {
        //         item.update();
        //     } catch (error) {
        //         console.error('Error updating item:', error);
        //     }
        // });

        // Update minimap to follow player
        this.updateMinimap();

        // Update debug manager
        if (this.debugManager) {
            this.updateDebugInfo();
            this.debugManager.update();
        }

        // Update inventory UI
        if (this.inventoryUI) {
            this.inventoryUI.update();
        }
    }

    private createTilemap(): void {
        this.tilemap = this.make.tilemap({ key: 'tilemapJSON' });
        this.tileset = this.tilemap.addTilesetImage('base_tileset', 'base-tileset');

        if (this.tileset) {
            this.tilemap.createLayer('Background', this.tileset, 0, 0);
            this.objlayer = this.tilemap.getObjectLayer('Player/NPC')
            // Note: No object layer exists in this tilemap, so we skip collision setup
            // The tilemap only has a "Background" layer and object layers for spawn points
        }
    }

    private createEnemies(): void {
        // Create enemies from object layer spawn points
        if (this.objlayer) {
            this.objlayer.objects.forEach(element => {
                if (element.name === 'boss_spawn') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-1').setSize(12.5, 45).setOffset(9, 2.5).anims.play('boss-1-idle-anim') as Enemy)
                } else if (element.name === 'enemy_spawn') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-1-anim').setScale(1.25).anims.play('enemy-idle-anim') as Enemy)
                } else if (element.name === 'enemy_spawn_2') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-2-anim').setScale(1.25).anims.play('enemy2-idle-anim') as Enemy)
                }
            })
        }

        // Add enemies scattered across outer sectors and middle of the map
        console.log('Creating enemies across the map...');
        
        // Upper left sector
        this.createEnemyWithName(this, 800, 800, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 1000, 600, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 600, 1000, 'enemy-1-anim', 'Nepian Scout');
        
        // Upper right sector
        this.createEnemyWithName(this, 3000, 800, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 3200, 600, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2800, 1000, 'enemy-2-anim', 'Nepian Observer');
        
        // Lower left sector
        this.createEnemyWithName(this, 800, 2800, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 1000, 3000, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 600, 3200, 'enemy-1-anim', 'Nepian Scout');
        
        // Lower right quadrant - existing groups
        this.createEnemyWithName(this, 2000, 2500, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2200, 2500, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2400, 2500, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2000, 2800, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 2200, 2800, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 2400, 2800, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 2000, 3100, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2200, 3100, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2400, 3100, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2000, 3400, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 2200, 3400, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 2400, 3400, 'enemy-2-anim', 'Nepian Observer');
        
        // Middle area enemies
        this.createEnemyWithName(this, 1800, 1800, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2200, 2000, 'enemy-2-anim', 'Nepian Observer');
        this.createEnemyWithName(this, 1600, 2200, 'enemy-1-anim', 'Nepian Scout');
        this.createEnemyWithName(this, 2000, 1800, 'enemy-2-anim', 'Nepian Observer');
        
        console.log('Enemies created successfully, total count:', this.enemies.length);
    }

    private createEnemyWithName(scene: Phaser.Scene, x: number, y: number, texture: string, name: string): void {
        const enemy = new Enemy(scene, x, y, texture).setScale(1.25).anims.play(texture.replace('-anim', '-idle-anim')) as Enemy;
        enemy.entity_type = name;
        this.enemies.push(enemy);
    }

    private createAllies(): void {
        try {
            console.log('Creating quest giver Narvark near spawn...');
            // Create quest giver near spawn point (500, 400) with slight offset
            const questGiver = new Ally(this, 600, 500);
            questGiver.entity_type = 'Narvark'; // Name the quest giver
            
            // Update the name tag with the correct name
            if (questGiver.entity_text) {
                questGiver.entity_text.setText('Narvark');
            }
            
            questGiver.showQuestIcon(); // Show exclamation mark over head
            this.allies.push(questGiver);
            console.log('Quest giver Narvark created successfully');
        } catch (error) {
            console.error('Error creating ally:', error);
        }
    }

    private createItems(): void {
        try {
            console.log('Creating biome-specific items...');
            
            // Create mysterious herbs in each biome
            this.createOakForestHerbs();
            this.createPineGroveHerbs();
            this.createAncientGroveHerbs();
            this.createCherryBlossomGroveHerbs();
            
            console.log(`Items created successfully, total count: ${this.items.length}`);

        } catch (error) {
            console.error('Error creating items:', error);
        }
    }

    private createOakForestHerbs(): void {
        console.log('Creating herbs in Oak Forest...');
        // Oak Forest herbs - Northwest region
        const oakHerbs = [
            { x: 550, y: 550 },
            { x: 750, y: 650 },
            { x: 950, y: 750 },
            { x: 650, y: 850 },
            { x: 850, y: 950 }
        ];

        oakHerbs.forEach((pos) => {
            const herb = new Item(this, pos.x, pos.y, 'mysterious herb', { sound: 'collect-herb', volume: 0.5 });
            this.items.push(herb);
        });
        console.log(`Oak Forest herbs created: ${oakHerbs.length}`);
    }

    private createPineGroveHerbs(): void {
        console.log('Creating herbs in Pine Grove...');
        // Pine Grove herbs - Northeast region
        const pineHerbs = [
            { x: 3050, y: 550 },
            { x: 3250, y: 650 },
            { x: 3450, y: 750 },
            { x: 3150, y: 850 },
            { x: 3350, y: 950 }
        ];

        pineHerbs.forEach((pos) => {
            const herb = new Item(this, pos.x, pos.y, 'mysterious herb', { sound: 'collect-herb', volume: 0.5 });
            this.items.push(herb);
        });
        console.log(`Pine Grove herbs created: ${pineHerbs.length}`);
    }

    private createAncientGroveHerbs(): void {
        console.log('Creating herbs in Ancient Grove...');
        // Ancient Grove herbs - Central region (rare and valuable)
        const ancientHerbs = [
            { x: 1950, y: 1550 },
            { x: 2150, y: 1750 },
            { x: 2350, y: 1950 },
            { x: 2050, y: 2150 }
        ];

        ancientHerbs.forEach((pos) => {
            const herb = new Item(this, pos.x, pos.y, 'mysterious herb', { sound: 'collect-herb', volume: 0.5 });
            this.items.push(herb);
        });
        console.log(`Ancient Grove herbs created: ${ancientHerbs.length}`);
    }

    private createCherryBlossomGroveHerbs(): void {
        console.log('Creating herbs in Cherry Blossom Grove...');
        // Cherry Blossom Grove herbs - Southwest region
        const cherryHerbs = [
            { x: 550, y: 2950 },
            { x: 750, y: 3050 },
            { x: 950, y: 3150 },
            { x: 650, y: 3250 },
            { x: 850, y: 3350 }
        ];

        cherryHerbs.forEach((pos) => {
            const herb = new Item(this, pos.x, pos.y, 'mysterious herb', { sound: 'collect-herb', volume: 0.5 });
            this.items.push(herb);
        });
        console.log(`Cherry Blossom Grove herbs created: ${cherryHerbs.length}`);
    }

    private createTrees(): void {
        try {
            console.log('Creating biome regions with trees...');
            
            // BIOME 1: Oak Forest (tree-1) - Northwest region
            this.createOakForest();
            
            // BIOME 2: Pine Grove (tree-2) - Northeast region  
            this.createPineGrove();
            
            // BIOME 3: Ancient Grove (tree-2-second) - Central region
            this.createAncientGrove();
            
            // BIOME 4: Cherry Blossom Grove (tree-3) - Southwest region
            this.createCherryBlossomGrove();
            
            console.log(`Trees created successfully, total count: ${this.trees.length}`);

        } catch (error) {
            console.error('Error creating trees:', error);
        }
    }

    private createOakForest(): void {
        console.log('Creating Oak Forest biome (Northwest)...');
        // Oak Forest - Northwest region (x: 400-1200, y: 400-1200)
        const oakPositions = [
            { x: 500, y: 500, type: 'tree-1' },
            { x: 600, y: 600, type: 'tree-1' },
            { x: 700, y: 500, type: 'tree-1' },
            { x: 800, y: 600, type: 'tree-1' },
            { x: 900, y: 500, type: 'tree-1' },
            { x: 1000, y: 600, type: 'tree-1' },
            { x: 500, y: 700, type: 'tree-1' },
            { x: 600, y: 800, type: 'tree-1' },
            { x: 700, y: 700, type: 'tree-1' },
            { x: 800, y: 800, type: 'tree-1' },
            { x: 900, y: 700, type: 'tree-1' },
            { x: 1000, y: 800, type: 'tree-1' },
            { x: 500, y: 900, type: 'tree-1' },
            { x: 600, y: 1000, type: 'tree-1' },
            { x: 700, y: 900, type: 'tree-1' },
            { x: 800, y: 1000, type: 'tree-1' },
            { x: 900, y: 900, type: 'tree-1' },
            { x: 1000, y: 1000, type: 'tree-1' }
        ];

        oakPositions.forEach((pos) => {
            const tree = new Tree(this, pos.x, pos.y, pos.type);
            this.trees.push(tree);
        });
        console.log(`Oak Forest created with ${oakPositions.length} trees`);
    }

    private createPineGrove(): void {
        console.log('Creating Pine Grove biome (Northeast)...');
        // Pine Grove - Northeast region (x: 2800-4000, y: 400-1200)
        const pinePositions = [
            { x: 3000, y: 500, type: 'tree-2' },
            { x: 3100, y: 600, type: 'tree-2' },
            { x: 3200, y: 500, type: 'tree-2' },
            { x: 3300, y: 600, type: 'tree-2' },
            { x: 3400, y: 500, type: 'tree-2' },
            { x: 3500, y: 600, type: 'tree-2' },
            { x: 3000, y: 700, type: 'tree-2' },
            { x: 3100, y: 800, type: 'tree-2' },
            { x: 3200, y: 700, type: 'tree-2' },
            { x: 3300, y: 800, type: 'tree-2' },
            { x: 3400, y: 700, type: 'tree-2' },
            { x: 3500, y: 800, type: 'tree-2' },
            { x: 3000, y: 900, type: 'tree-2' },
            { x: 3100, y: 1000, type: 'tree-2' },
            { x: 3200, y: 900, type: 'tree-2' },
            { x: 3300, y: 1000, type: 'tree-2' },
            { x: 3400, y: 900, type: 'tree-2' },
            { x: 3500, y: 1000, type: 'tree-2' }
        ];

        pinePositions.forEach((pos) => {
            const tree = new Tree(this, pos.x, pos.y, pos.type);
            this.trees.push(tree);
        });
        console.log(`Pine Grove created with ${pinePositions.length} trees`);
    }

    private createAncientGrove(): void {
        console.log('Creating Ancient Grove biome (Central)...');
        // Ancient Grove - Central region (x: 1800-2600, y: 1400-2200)
        const ancientPositions = [
            { x: 1900, y: 1500, type: 'tree-2-second' },
            { x: 2100, y: 1600, type: 'tree-2-second' },
            { x: 2300, y: 1500, type: 'tree-2-second' },
            { x: 1900, y: 1800, type: 'tree-2-second' },
            { x: 2100, y: 1900, type: 'tree-2-second' },
            { x: 2300, y: 1800, type: 'tree-2-second' },
            { x: 1900, y: 2100, type: 'tree-2-second' },
            { x: 2100, y: 2200, type: 'tree-2-second' },
            { x: 2300, y: 2100, type: 'tree-2-second' }
        ];

        ancientPositions.forEach((pos) => {
            const tree = new Tree(this, pos.x, pos.y, pos.type);
            this.trees.push(tree);
        });
        console.log(`Ancient Grove created with ${ancientPositions.length} trees`);
    }

    private createCherryBlossomGrove(): void {
        console.log('Creating Cherry Blossom Grove biome (Southwest)...');
        // Cherry Blossom Grove - Southwest region (x: 400-1200, y: 2800-3600)
        const cherryPositions = [
            { x: 500, y: 2900, type: 'tree-3' },
            { x: 600, y: 3000, type: 'tree-3' },
            { x: 700, y: 2900, type: 'tree-3' },
            { x: 800, y: 3000, type: 'tree-3' },
            { x: 900, y: 2900, type: 'tree-3' },
            { x: 1000, y: 3000, type: 'tree-3' },
            { x: 500, y: 3100, type: 'tree-3' },
            { x: 600, y: 3200, type: 'tree-3' },
            { x: 700, y: 3100, type: 'tree-3' },
            { x: 800, y: 3200, type: 'tree-3' },
            { x: 900, y: 3100, type: 'tree-3' },
            { x: 1000, y: 3200, type: 'tree-3' },
            { x: 500, y: 3300, type: 'tree-3' },
            { x: 600, y: 3400, type: 'tree-3' },
            { x: 700, y: 3300, type: 'tree-3' },
            { x: 800, y: 3400, type: 'tree-3' },
            { x: 900, y: 3300, type: 'tree-3' },
            { x: 1000, y: 3400, type: 'tree-3' }
        ];

        cherryPositions.forEach((pos) => {
            const tree = new Tree(this, pos.x, pos.y, pos.type);
            this.trees.push(tree);
        });
        console.log(`Cherry Blossom Grove created with ${cherryPositions.length} trees`);
    }

    private setupMinimap(): void {
        const minimapSize = 150;
        const minimapX = 20;
        const minimapY = 20;

        // Create circular minimap camera
        this.miniMapCamera = this.cameras.add(minimapX, minimapY, minimapSize, minimapSize);
        this.miniMapCamera.setZoom(0.25);
        this.miniMapCamera.setBackgroundColor(0x2a2a2a);
        
        // Create circular mask for the minimap
        this.minimapMask = this.add.graphics();
        this.minimapMask.fillStyle(0xffffff, 0); // Transparent mask
        this.minimapMask.fillCircle(minimapX + minimapSize / 2, minimapY + minimapSize / 2, minimapSize / 2);
        this.minimapMask.setScrollFactor(0);
        this.minimapMask.setDepth(1000);
        
        // Apply mask to minimap camera to make it circular
        this.miniMapCamera.setMask(this.minimapMask.createGeometryMask());
        
        // Create player dot for minimap
        this.minimapPlayerDot = this.add.graphics();
        this.minimapPlayerDot.fillStyle(0xff0000, 1);
        this.minimapPlayerDot.fillCircle(0, 0, 4);
        this.minimapPlayerDot.setScrollFactor(0);
        this.minimapPlayerDot.setDepth(1001);
        
        // Set initial position to center on player
        this.centerMinimapOnPlayer();
    }

    private centerMinimapOnPlayer(): void {
        if (!this.miniMapCamera || !this.player) return;

        // Center the minimap on the player
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // Calculate the scroll position to center the player in the minimap
        const scrollX = playerX - (this.miniMapCamera.width / 2) / this.miniMapCamera.zoom;
        const scrollY = playerY - (this.miniMapCamera.height / 2) / this.miniMapCamera.zoom;
        
        // Clamp the scroll position to stay within world bounds
        const clampedX = Math.max(0, Math.min(scrollX, this.tilemap.widthInPixels - (this.miniMapCamera.width / this.miniMapCamera.zoom)));
        const clampedY = Math.max(0, Math.min(scrollY, this.tilemap.heightInPixels - (this.miniMapCamera.height / this.miniMapCamera.zoom)));
        
        this.miniMapCamera.setScroll(clampedX, clampedY);
    }

    private updateMinimap(): void {
        // Always center the minimap on the player
        this.centerMinimapOnPlayer();
        
        // Update player dot position (always centered in the minimap)
        if (this.minimapPlayerDot) {
            const minimapSize = 150;
            const minimapX = 20;
            const minimapY = 20;
            this.minimapPlayerDot.setPosition(minimapX + minimapSize / 2, minimapY + minimapSize / 2);
        }
    }

    private updateDebugInfo(): void {
        if (!this.debugManager || !this.debugManager.isDebugEnabled()) return;

        // Collect debug information
        const debugInfo = {
            entities: this.enemies.length + this.allies.length + this.items.length + this.trees.length + (this.player ? 1 : 0),
            enemies: this.enemies.length,
            allies: this.allies.length,
            items: this.items.length,
            playerPosition: this.player ? { x: this.player.x, y: this.player.y } : { x: 0, y: 0 },
            playerHealth: this.player ? { current: this.player.getHealth(), max: this.player.getMaxHealth() } : { current: 0, max: 0 },
            playerVelocity: this.player ? { x: this.player.body?.velocity.x || 0, y: this.player.body?.velocity.y || 0 } : { x: 0, y: 0 },
            cameraPosition: { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
            cameraZoom: this.cameras.main.zoom,
            worldBounds: { width: this.tilemap.widthInPixels, height: this.tilemap.heightInPixels },
            activeAnimations: this.getActiveAnimations(),
            inputKeys: this.getInputKeyStates()
        };

        this.debugManager.updateDebugInfo(debugInfo);

        // Draw debug visuals
        this.drawDebugVisuals();
    }

    private getActiveAnimations(): string[] {
        const animations: string[] = [];
        
        if (this.player && this.player.anims.currentAnim) {
            animations.push(`Player: ${this.player.anims.currentAnim.key}`);
        }

        this.enemies.forEach((enemy, index) => {
            if (enemy.anims.currentAnim) {
                animations.push(`Enemy${index}: ${enemy.anims.currentAnim.key}`);
            }
        });

        this.allies.forEach((ally, index) => {
            if (ally.anims.currentAnim) {
                animations.push(`Ally${index}: ${ally.anims.currentAnim.key}`);
            }
        });

        return animations;
    }

    private getInputKeyStates(): { [key: string]: boolean } {
        const keyStates: { [key: string]: boolean } = {};
        
        // Check global input keys (as used in Player class)
        const keyboard = this.input.keyboard;
        if (keyboard) {
            keyStates['W/Up'] = keyboard.checkDown(keyboard.addKey('W'), 0);
            keyStates['S/Down'] = keyboard.checkDown(keyboard.addKey('S'), 0);
            keyStates['A/Left'] = keyboard.checkDown(keyboard.addKey('A'), 0);
            keyStates['D/Right'] = keyboard.checkDown(keyboard.addKey('D'), 0);
            keyStates['Space'] = keyboard.checkDown(keyboard.addKey('SPACE'), 0);
            keyStates['Shift'] = keyboard.checkDown(keyboard.addKey('SHIFT'), 0);
        }

        return keyStates;
    }

    private drawDebugVisuals(): void {
        if (!this.debugManager || !this.debugManager.isDebugEnabled()) return;

        // Draw collision boxes for all entities
        if (this.player) {
            this.debugManager.drawCollisionBox(this.player, 0x00ff00); // Green for player
        }

        this.enemies.forEach(enemy => {
            this.debugManager.drawCollisionBox(enemy, 0xff0000); // Red for enemies
        });

        this.allies.forEach(ally => {
            this.debugManager.drawCollisionBox(ally, 0x0000ff); // Blue for allies
        });

        this.trees.forEach(tree => {
            this.debugManager.drawCollisionBox(tree, 0x8B4513); // Brown for trees
        });

        // Draw enemy patrol paths (if available)
        // Note: Enemy class doesn't currently have patrolPoints property
        // this.enemies.forEach(enemy => {
        //     if (enemy.patrolPoints && enemy.patrolPoints.length > 1) {
        //         this.debugManager.drawPath(enemy.patrolPoints, 0xff8800); // Orange for patrol paths
        //     }
        // });

        // Add info text for entities
        this.enemies.forEach((enemy, index) => {
            const name = enemy.entity_type && enemy.entity_type !== 'Entity' ? enemy.entity_type : `Enemy ${index + 1}`;
            this.debugManager.addInfoText(
                enemy.x, 
                enemy.y - 50, 
                `${name}\nHP: ${enemy.getHealth()}/${enemy.getMaxHealth()}`,
                0xff0000
            );
        });

        this.allies.forEach((ally, index) => {
            const name = ally.entity_type && ally.entity_type !== 'Entity' ? ally.entity_type : `Ally ${index + 1}`;
            this.debugManager.addInfoText(
                ally.x, 
                ally.y - 50, 
                `${name}\nHP: ${ally.getHealth()}/${ally.getMaxHealth()}`,
                0x0000ff
            );
        });

        this.trees.forEach((tree, index) => {
            const fruitStatus = tree.hasFruitAvailable() ? 'Has Fruit' : 'No Fruit';
            this.debugManager.addInfoText(
                tree.x, 
                tree.y - 50, 
                `Tree ${index + 1}\n${tree.getTreeType()}\n${fruitStatus}`,
                0x8B4513
            );
        });
    }

    // private setupInput(): void {
    //     // Input setup is handled in the Player class
    // }

    // // Getter methods for other classes to access
    // getPlayer(): Player {
    //     return this.player;
    // }

    // getEnemies(): Enemy[] {
    //     return this.enemies;
    // }

    // getAllies(): Ally[] {
    //     return this.allies;
    // }

    // getItems(): Item[] {
    //     return this.items;
    // }

    // getTilemap(): Phaser.Tilemaps.Tilemap {
    //     return this.tilemap;
    // }

    // getGroundLayer(): Phaser.Tilemaps.TilemapLayer | null {
    //     return this.groundLayer;
    // }



    // getMiniMapCamera(): Phaser.Cameras.Scene2D.Camera {
    //     return this.miniMapCamera;
    // }
}
