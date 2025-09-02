import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { Ally } from '../../prefabs/Ally';
import { Item } from '../../prefabs/Item';


interface WorldData {
    qobj?: any;
    inv?: any;
}

export class World extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private allies: Ally[] = [];
    private items: Item[] = [];
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private tileset!: Phaser.Tilemaps.Tileset | null;
    private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
    private miniMapCamera!: Phaser.Cameras.Scene2D.Camera;

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

            //             // Create player
            //             console.log('Creating player...');
            //             this.player = new Player(this, 500, 400, data.inv, data.qobj);
            //             console.log('Player created successfully:', this.player);

            //             // Create enemies
            //             console.log('Creating enemies...');
            //             this.createEnemies();
            //             console.log('Enemies created successfully, count:', this.enemies.length);

            //             // Create allies
            //             console.log('Creating allies...');
            //             this.createAllies();
            //             console.log('Allies created successfully, count:', this.allies.length);

            //             // Create items
            //             console.log('Creating items...');
            //             this.createItems();
            //             console.log('Items created successfully, count:', this.items.length);

            //             // Setup camera
            //             console.log('Setting up camera...');
            //             this.cameras.main.startFollow(this.player);
            //             this.cameras.main.setZoom(1);
            //             console.log('Camera setup complete');

            //             // Setup minimap camera
            //             console.log('Setting up minimap...');
            //             this.setupMinimap();
            //             console.log('Minimap setup complete');

            //             // Setup input
            //             console.log('Setting up input...');
            //             this.setupInput();
            //             console.log('Input setup complete');

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

        // // Update enemies (with safety checks)
        // this.enemies.forEach(enemy => {
        //     try {
        //         enemy.update();
        //     } catch (error) {
        //         console.error('Error updating enemy:', error);
        //     }
        // });

        // // Update allies (with safety checks)
        // this.allies.forEach(ally => {
        //     try {
        //         ally.update();
        //     } catch (error) {
        //         console.error('Error updating ally:', error);
        //     }
        // });

        // // Update items (with safety checks)
        // this.items.forEach(item => {
        //     try {
        //         item.update();
        //     } catch (error) {
        //         console.error('Error updating item:', error);
        //     }
        // });
    }

    private createTilemap(): void {
        this.tilemap = this.make.tilemap({ key: 'tilemapJSON' });
        this.tileset = this.tilemap.addTilesetImage('base_tileset', 'base-tileset');

        if (this.tileset) {
            this.groundLayer = this.tilemap.createLayer('Background', this.tileset, 0, 0);

            // Note: No object layer exists in this tilemap, so we skip collision setup
            // The tilemap only has a "Background" layer and object layers for spawn points
        }
    }

    // private createEnemies(): void {
    //     try {
    //         console.log('Creating enemy 1...');
    //         this.enemies.push(new Enemy(this, 200, 200));
    //         console.log('Enemy 1 created successfully');

    //         console.log('Creating enemy 2...');
    //         this.enemies.push(new Enemy(this, 800, 600));
    //         console.log('Enemy 2 created successfully');

    //         console.log('Creating enemy 3...');
    //         this.enemies.push(new Enemy(this, 400, 800));
    //         console.log('Enemy 3 created successfully');
    //     } catch (error) {
    //         console.error('Error creating enemies:', error);
    //     }
    // }

    // private createAllies(): void {
    //     try {
    //         console.log('Creating ally...');
    //         this.allies.push(new Ally(this, 300, 300));
    //         console.log('Ally created successfully');
    //     } catch (error) {
    //         console.error('Error creating ally:', error);
    //     }
    // }

    // private createItems(): void {
    //     try {
    //         console.log('Creating item 1...');
    //         this.items.push(new Item(this, 150, 150, 'mysterious-herb'));
    //         console.log('Item 1 created successfully');

    //         console.log('Creating item 2...');
    //         this.items.push(new Item(this, 750, 550, 'fruit'));
    //         console.log('Item 2 created successfully');

    //         console.log('Creating item 3...');
    //         this.items.push(new Item(this, 350, 750, 'nepian-blood'));
    //         console.log('Item 3 created successfully');
    //     } catch (error) {
    //         console.error('Error creating items:', error);
    //     }
    // }

    // private setupMinimap(): void {
    //     // Create minimap camera
    //     this.miniMapCamera = this.cameras.add(10, 10, 200, 150);
    //     this.miniMapCamera.setZoom(0.3);
    //     this.miniMapCamera.setBackgroundColor(0x000000);
    //     this.miniMapCamera.setScroll(0, 0);
    // }

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
