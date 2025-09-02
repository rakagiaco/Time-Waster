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
    }

    create(data: WorldData): void {
        // Create tilemap
        this.createTilemap();
        
        // Wait a frame to ensure animations are fully loaded
        this.time.delayedCall(100, () => {
            // Create player
            this.player = new Player(this, 500, 400, data.inv, data.qobj);
            
            // Create enemies
            this.createEnemies();
            
            // Create allies
            this.createAllies();
            
            // Create items
            this.createItems();
            
            // Setup camera
            this.cameras.main.startFollow(this.player);
            this.cameras.main.setZoom(1);
            
            // Setup minimap camera
            this.setupMinimap();
            
            // Setup input
            this.setupInput();
        });
    }

    update(): void {
        // Update player (only if it exists)
        if (this.player) {
            this.player.update();
        }
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update());
        
        // Update allies
        this.allies.forEach(ally => ally.update());
        
        // Update items
        this.items.forEach(item => item.update());
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

    private createEnemies(): void {
        // Create enemy instances at specific positions
        this.enemies.push(new Enemy(this, 200, 200));
        this.enemies.push(new Enemy(this, 800, 600));
        this.enemies.push(new Enemy(this, 400, 800));
    }

    private createAllies(): void {
        // Create NPC ally
        this.allies.push(new Ally(this, 300, 300));
    }

    private createItems(): void {
        // Create collectible items
        this.items.push(new Item(this, 150, 150, 'mysterious-herb'));
        this.items.push(new Item(this, 750, 550, 'fruit'));
        this.items.push(new Item(this, 350, 750, 'nepian-blood'));
    }

    private setupMinimap(): void {
        // Create minimap camera
        this.miniMapCamera = this.cameras.add(10, 10, 200, 150);
        this.miniMapCamera.setZoom(0.3);
        this.miniMapCamera.setBackgroundColor(0x000000);
        this.miniMapCamera.setScroll(0, 0);
    }

    private setupInput(): void {
        // Input setup is handled in the Player class
    }

    // Getter methods for other classes to access
    getPlayer(): Player {
        return this.player;
    }

    getEnemies(): Enemy[] {
        return this.enemies;
    }

    getAllies(): Ally[] {
        return this.allies;
    }

    getItems(): Item[] {
        return this.items;
    }

    getTilemap(): Phaser.Tilemaps.Tilemap {
        return this.tilemap;
    }

    getGroundLayer(): Phaser.Tilemaps.TilemapLayer | null {
        return this.groundLayer;
    }



    getMiniMapCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.miniMapCamera;
    }
}
