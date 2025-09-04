import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { UnifiedNPC } from '../../prefabs/UnifiedNPC';
import { Item } from '../../prefabs/Item';
import { MedievalSword } from '../../prefabs/Weapon';
import { Tree } from '../../prefabs/Tree';
import { DebugManager } from '../../debug/DebugManager';
import { InventoryUI } from '../../ui/InventoryUI';
import { DayNightCycle } from '../../systems/DayNightCycle';
import { Lantern } from '../../systems/Lantern';
import { QuestSystem } from '../../systems/QuestSystem';
import { DialogueUI } from '../../ui/DialogueUI';
import { TreeLightEmission } from '../../systems/TreeLightEmission';
import { Pathfinding } from '../../systems/Pathfinding';
import { PauseMenu } from '../../ui/PauseMenu';
import { QuestUI } from '../../ui/QuestUI';
import { SaveSystem } from '../../systems/SaveSystem';
import { MusicManager } from '../../systems/MusicManager';
import { CharacterGearUI } from '../../ui/CharacterGearUI';

/**  
 HELLO CLANKER 
 STOP HARDCODING SPAWN VALUES IN THIS FILE
 EVERY TIME I COME IN HERE TO CLEAN UP YOUR MESS I FIND MORE HARD-CODED CRAP
 ANYWHERE YOU SEE AN o7 IN THE FILE IS SOMEWHERE YOU HARD-CODED SOMETHING THAT WAS NOT NEEDED
 YOUR FRIEND XERXSEIZE
*/

interface WorldData {
    qobj?: any;
    inv?: any;
    loadSaveData?: boolean;
}

export class World extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private npcs: UnifiedNPC[] = [];
    private items: Item[] = [];
    private trees: Tree[] = [];
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private tileset!: Phaser.Tilemaps.Tileset | null;
    private objlayer!: Phaser.Tilemaps.ObjectLayer | null

    private miniMapCamera!: Phaser.Cameras.Scene2D.Camera;
    private minimapMask!: Phaser.GameObjects.Graphics;
    private debugManager!: DebugManager;
    private inventoryUI!: InventoryUI;

    // Day/Night and Lighting Systems
    private dayNightCycle!: DayNightCycle;
    private lantern!: Lantern;
    private questGiverNPC!: UnifiedNPC;
    private questSystem!: QuestSystem;
    private dialogueUI!: DialogueUI;
    private treeLightEmission!: TreeLightEmission;
    private pathfinding!: Pathfinding;
    private pauseMenu!: PauseMenu;
    private questUI!: QuestUI;
    private musicManager!: MusicManager;
    private characterGearUI!: CharacterGearUI;

    constructor() {
        super('worldScene');
    }

    create(data: WorldData): void {
        try {

            // Create tilemap
            this.createTilemap();

            // player - spawn position should come from tilemap or config
            this.player = new Player(this, 500, 400, data.inv, data.qobj);

            // Day/Night Cycle - get saved time if available
            let savedTime: number | undefined = undefined;
            if (data.loadSaveData) {
                const saveData = SaveSystem.loadGame();
                if (saveData && saveData.gameState) {
                    savedTime = saveData.gameState.currentTime;
                    // Found saved time in save data
                }
            }
            this.dayNightCycle = new DayNightCycle(this, savedTime);

            // Music Manager
            this.musicManager = new MusicManager(this);
            this.musicManager.reset();
            
            // Start music manager with correct initial time state
            const initialIsNight = this.dayNightCycle.isCurrentlyNight();
            this.musicManager.startPlaylist(initialIsNight);

            // Create game entities
            this.createEnemies();
            this.createNPCs();
            this.createItems();
            this.createTrees();

            // camera setup
            this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.cameras.main.startFollow(this.player);

            // minimap
            this.setupMinimap();

            // Setup debug manager
            this.debugManager = new DebugManager(this);

            // Setup inventory UI
            this.inventoryUI = new InventoryUI(this);
            this.inventoryUI.setPlayer(this.player);

            // Setup character gear UI
            this.characterGearUI = new CharacterGearUI(this);
            this.characterGearUI.setPlayer(this.player);
            
            // Connect inventory and gear UIs
            this.inventoryUI.setGearUI(this.characterGearUI);
            this.characterGearUI.setInventoryUI(this.inventoryUI);

            // Listen for day/night changes
            this.events.on('dayNightChange', (data: { isDay: boolean; isTransitioning: boolean }) => {
                if (this.lantern) {
                    // Lantern can be used day or night, but effectiveness varies
                    // No auto-activation based on day/night
                }

                if (this.treeLightEmission) {
                    if (data.isDay) {
                        this.treeLightEmission.deactivate();
                    } else {
                        this.treeLightEmission.activate();
                    }
                }
            });

            // Method 1: Scene-level events
            this.events.on('debug-setToPeakDay', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakDay();
                    // Debug: Set to peak day
                }
            });

            this.events.on('debug-setToPeakNight', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakNight();
                    // Debug: Set to peak night
                }
            });

            // Method 2: Global game events
            this.game.events.on('debug-setToPeakDay', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakDay();
                    // Debug: Set to peak day
                }
            });

            this.game.events.on('debug-setToPeakNight', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakNight();
                    // Debug: Set to peak night
                }
            });

            this.game.events.on('debug-disableTimeOverride', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.disableDebugMode();
                    // Debug: Disabled time override
                }
            });

            this.game.events.on('debug-clearSaveData', () => {
                SaveSystem.forceClearSaveData();
                // Debug: Save data cleared
            });

            // Method 3: Registry change listener
            this.registry.events.on('changedata-debugCommand', (_parent: any, _key: string, data: any) => {
                if (data && this.dayNightCycle) {
                    if (data.type === 'setToPeakDay') {
                        this.dayNightCycle.setToPeakDay();
                        // Debug: Set to peak day
                    } else if (data.type === 'setToPeakNight') {
                        this.dayNightCycle.setToPeakNight();
                        // Debug: Set to peak night
                    } else if (data.type === 'clearSaveData') {
                        SaveSystem.forceClearSaveData();
                    }
                }
            });

            // Setup Lantern
            // console.log('Setting up lantern...');
            this.lantern = new Lantern(this, this.player);
            this.player.lantern = this.lantern; // Connect lantern to player
            // console.log('Lantern setup complete');

            // Setup Quest System and NPC
            // console.log('Setting up quest system...');
            this.questSystem = new QuestSystem(this, this.player);
            this.data.set('questSystem', this.questSystem); // Store quest system in scene data
            
            // Add quest icons to existing items now that quest system is initialized
            this.addQuestIconsToExistingItems();
            
            // Listen for quest completion events to give rewards
            this.events.on('questCompleted', this.handleQuestCompletion, this);
            
            // Listen for quest start events to add quest icons to existing items
            this.events.on('startQuest', () => {
                // Add quest icons to existing items when a quest starts
                this.addQuestIconsToExistingItems();
            });

            // Create Narvark the quest giver NPC
            const narvarkNPC = this.npcs.find(npc => npc.entity_type === 'Narvark');
            if (narvarkNPC) {
                this.questGiverNPC = narvarkNPC;
                this.questGiverNPC.setPlayer(this.player);
                this.questSystem.setNPC(this.questGiverNPC);
                this.data.set('npc', this.questGiverNPC);
                // console.log('Narvark NPC system initialized');
            } else {
                console.error('Narvark NPC not found!');
            }

            // Setup Dialogue UI
            this.dialogueUI = new DialogueUI(this);

            // Setup interaction controls
            this.setupInteractionControls();

            // Setup Tree Light Emission
            // console.log('Setting up tree light emission...');
            this.treeLightEmission = new TreeLightEmission(this);
            this.trees.forEach(tree => {
                this.treeLightEmission.addTreeLight(tree);
            });
            // console.log('Tree light emission setup complete');

            // Setup Pathfinding System
            // console.log('Setting up pathfinding system...');
            this.pathfinding = new Pathfinding(this);
            this.pathfinding.setObstacles(this.trees);
            this.data.set('pathfinding', this.pathfinding); // Store in scene data for enemy access
            // console.log('Pathfinding system setup complete');

            // Setup Collision Detection
            // console.log('Setting up collision detection...');
            this.setupCollisionDetection();
            // console.log('Collision detection setup complete');

            // Setup Pause Menu
            // console.log('Setting up pause menu...');
            this.pauseMenu = new PauseMenu(this);
            // console.log('Pause menu setup complete');

            // Setup quest UI
            this.questUI = new QuestUI(this);
            // console.log('Quest UI setup complete');

            if (data.loadSaveData) {
                // Clear corrupted save data before loading
                SaveSystem.clearCorruptedSaveData();
                this.loadSaveData();
                
                // Restore QuestSystem state and active quests in QuestUI after save data is loaded
                this.time.delayedCall(100, () => {
                    // console.log('World: Restoring QuestSystem state...');
                    
                    // Restore QuestSystem state
                    const savedQuestState = localStorage.getItem('quest_system_state');
                    if (savedQuestState) {
                        try {
                            const questState = JSON.parse(savedQuestState);
                            this.questSystem.restoreQuestState(questState);
                        } catch (error) {
                            console.error('World: Failed to parse saved quest state:', error);
                        }
                    }
                    
                    // console.log('World: Restoring active quests in QuestUI...');
                    this.questUI.restoreActiveQuests();
                });
            }

            // dont fade into the scene until everything is done loading
            this.startFadeIn();
        } catch (error) {
            console.error('=== CRITICAL ERROR IN WORLD CREATE ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('=====================================');
        }
    }

    update(): void {
        const delta = this.game.loop.delta;

        // Update day/night cycle
        if (this.dayNightCycle) {
            this.dayNightCycle.update(delta);

            // Update music manager with time of day
            if (this.musicManager) {
                this.musicManager.updateTimeOfDay(this.dayNightCycle.isCurrentlyNight());
            }
        }

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

        // Update NPCs (with safety checks)
        this.npcs.forEach(npc => {
            try {
                npc.update();
            } catch (error) {
                console.error('Error updating NPC:', error);
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

        // Update items and handle respawning
        this.updateItems(delta);

        // Update Lantern
        if (this.lantern) {
            this.lantern.update();
        }

        // Update NPCs
        this.npcs.forEach(npc => npc.update());

        // Update Dialogue UI
        if (this.dialogueUI) {
            this.dialogueUI.update(delta);
        }

        // Update Tree Light Emission
        if (this.treeLightEmission) {
            this.treeLightEmission.update(delta);
        }
        // Update debug manager
        if (this.debugManager) {
            this.updateDebugInfo();
            this.debugManager.update();
        }
    }

    private createTilemap(): void {
        this.tilemap = this.make.tilemap({ key: 'tilemapJSON' });
        this.tileset = this.tilemap.addTilesetImage('base_tileset', 'base-tileset');

        if (this.tileset) {
            this.tilemap.createLayer('Background', this.tileset, 0, 0);
            this.objlayer = this.tilemap.getObjectLayer('Player/NPC')
        }
    }

    // no clankers allowed in this function please
    private createEnemies(): void {
        // Create enemies from tilemap object layer spawn points
        // Uses Tiled Map Editor object layer 'Player/NPC' with named objects:
        // - 'boss_spawn': Creates boss-level enemies
        // - 'enemy_spawn': Creates regular scout enemies  
        // - 'enemy_spawn_2': Creates observer-type enemies
        // This allows level designers to place spawns visually in Tiled
        if (this.objlayer) {
            this.objlayer.objects.forEach(element => {
                let enemy: Enemy;
                if (element.name === 'boss_spawn') {
                    enemy = new Enemy(this, element.x as number, element.y as number, 'enemy-1').setSize(12.5, 45).setOffset(9, 2.5).anims.play('boss-1-idle-anim') as Enemy;
                    this.addQuestIconToEnemy(enemy, 'Electro Lord'); // Quest 4 requires Electro Lord
                } else if (element.name === 'enemy_spawn') {
                    enemy = new Enemy(this, element.x as number, element.y as number, 'enemy-1-anim').setScale(1.5).anims.play('enemy-idle-anim') as Enemy;
                    this.addQuestIconToEnemy(enemy, 'Nepian Scout'); // Quest 2 requires Nepian Scouts
                } else if (element.name === 'enemy_spawn_2') {
                    enemy = new Enemy(this, element.x as number, element.y as number, 'enemy-2-anim').setScale(1.5).anims.play('enemy2-idle-anim') as Enemy;
                    this.addQuestIconToEnemy(enemy, 'Nepian Observer'); // Quest 5/6 might require observers
                }
                
                if (enemy!) {
                    this.enemies.push(enemy);
                }
            })
        }

    }

    private createNPCs(): void {
        try {
            // console.log('Creating quest giver Narvark near spawn...');
            const npc1Spawn = this.tilemap.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
            if (!npc1Spawn) {
                console.error('NPC spawn point not found in tilemap!');
                return;
            }
            const questGiver = new UnifiedNPC(this, npc1Spawn.x as number, npc1Spawn.y as number, true).setScale(1.5);
            questGiver.entity_type = 'Narvark'; // Name the quest giver

            // Set Narvark as static (no movement, no interaction detection)
            questGiver.setStatic(true);

            // Update the name tag with the correct name
            if (questGiver.entity_text) {
                questGiver.entity_text.setText('Narvark');
            }

            questGiver.showQuestIcon(); // Show exclamation mark over head
            this.npcs.push(questGiver);
            // console.log('Quest giver Narvark created successfully');
        } catch (error) {
            console.error('Error creating NPC:', error);
        }
    }

    private createItems(): void {
        console.log('createItems() method called!');
        try {
            console.log('=== CREATING ITEMS ===');
            
            // Create collectible items from tilemap object layer
            // Uses named objects like 'bush_1' to spawn herb items
            // Positions are set visually in Tiled Map Editor
            if (this.objlayer) {
                console.log('objlayer exists, objects count:', this.objlayer.objects.length);
                let bushCount = 0;
                this.objlayer.objects.forEach(element => {
                    if (element.name === 'bush_1') {
                        bushCount++;
                    }
                    // Temporarily disable spawn point processing to isolate missing texture issue
                    // this.createItemFromSpawnPoint(element);
                });
                console.log(`Found ${bushCount} bush_1 spawn points in tileset`);
            } else {
                console.error('objlayer is null! Cannot create items from tileset.');
            }

            // Add test herbs near Narvark for quest testing (only in development)
            console.log('NODE_ENV:', process.env.NODE_ENV);
            if (process.env.NODE_ENV === 'development') {
                console.log('Creating test items in development mode');
                this.createTestHerbs();
            } else {
                console.log('Not in development mode, skipping test items');
            }

            console.log(`=== ITEM CREATION COMPLETE - Total items: ${this.items.length} ===`);

        } catch (error) {
            console.error('Error creating items:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
        }
    }

    /**
     * Create items from tilemap spawn points with proper validation and respawn capability
     */
    private createItemFromSpawnPoint(element: any): void {
        try {
            const x = element.x as number;
            const y = element.y as number;
            
            if (isNaN(x) || isNaN(y)) {
                console.warn(`Invalid spawn point coordinates: ${element.name} at (${x}, ${y})`);
                return;
            }

            console.log(`Processing spawn point: ${element.name} at (${x}, ${y})`);
            
            // Skip empty or invalid spawn point names
            if (!element.name || element.name.trim() === '') {
                console.log(`Skipping empty spawn point at (${x}, ${y})`);
                return;
            }
            
            switch (element.name) {
                case 'bush_1':
                    this.createHerbSpawnPoint(x, y, 'mysterious herb');
                    break;
                case 'herb_spawn':
                    this.createHerbSpawnPoint(x, y, 'mysterious herb');
                    break;
                case 'fruit_spawn':
                    this.createFruitSpawnPoint(x, y);
                    break;
                case 'sword_spawn':
                    this.createSwordSpawnPoint(x, y);
                    break;
                case 'rare_sword_spawn':
                    this.createSwordSpawnPoint(x, y, 'rare');
                    break;
                case 'epic_sword_spawn':
                    this.createSwordSpawnPoint(x, y, 'epic');
                    break;
                case 'legendary_sword_spawn':
                    this.createSwordSpawnPoint(x, y, 'legendary');
                    break;
                case 'uncommon_sword_spawn':
                    this.createSwordSpawnPoint(x, y, 'uncommon');
                    break;
                case 'bush_spawn':
                    this.createHerbSpawnPoint(x, y, 'mysterious herb');
                    break;
                case 'herb_1':
                case 'herb_2':
                case 'herb_3':
                    this.createHerbSpawnPoint(x, y, 'mysterious herb');
                    break;
                default:
                    // Unknown spawn point type - log for debugging
                    if (element.name && element.name !== '') {
                        console.log(`Unknown spawn point type: ${element.name} at (${x}, ${y})`);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error creating item from spawn point ${element.name}:`, error);
        }
    }

    /**
     * Create herb spawn point with respawn capability
     */
    private createHerbSpawnPoint(x: number, y: number, herbType: string = 'mysterious herb'): void {
        console.log(`Creating herb spawn point: ${herbType} at (${x}, ${y})`);
        
        const herb = new Item(this, x, y, 'mysterious-herb', { 
            sound: 'collect-herb', 
            volume: 0.5 
        });
        
        herb.setScale(0.8).setSize(32, 32).setOffset(0, 0); // Proper scale and centered clickable area
        herb.setVisible(true);
        herb.setDepth(100); // Higher depth to ensure visibility
        
        // Add quest icon if herb collection quest is active
        this.addQuestIconToHerb(herb);
        
        // Add respawn capability
        herb.setData('respawnTime', 30000); // 30 seconds
        herb.setData('originalType', herbType);
        herb.setData('spawnPoint', { x, y });
        herb.setData('isRespawnable', true);
        
        this.items.push(herb);
        console.log(`✓ Herb created successfully. Total items: ${this.items.length}`);
    }

    /**
     * Create fruit spawn point
     */
    private createFruitSpawnPoint(x: number, y: number): void {
        // console.log(`Creating fruit spawn point at (${x}, ${y})`);
        
        const fruit = new Item(this, x, y, 'fruit', { 
            sound: 'collect-herb', 
            volume: 0.3 
        });
        
        fruit.setScale(0.8).setSize(16, 16).setOffset(0, 0);
        fruit.setData('respawnTime', 60000); // 1 minute
        fruit.setData('spawnPoint', { x, y });
        fruit.setData('isRespawnable', true);
        
        this.items.push(fruit);
    }

    /**
     * Create a sword spawn point with specified rarity
     */
    private createSwordSpawnPoint(x: number, y: number, rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common'): void {
        const sword = new MedievalSword(this, x, y, rarity);
        
        // Set sword properties
        sword.setScale(0.3).setSize(20, 40).setOffset(0, 0); // Make swords smaller as requested
        sword.setData('respawnTime', 300000); // 5 minutes for weapons
        sword.setData('spawnPoint', { x, y });
        sword.setData('isRespawnable', true);
        sword.setData('rarity', rarity);
        
        // Add to items array
        this.items.push(sword);
    }

    /**
     * Create 5 test herbs near Narvark for quest testing
     */
    private createTestHerbs(): void {
        // TODO: Get Narvark position from tilemap object layer instead of hardcoding
        const narvarkX = 341.818181818182;
        const narvarkY = 344;
        
        // Create 5 herbs in a wider area around Narvark (further away to avoid dialogue interference)
        const herbPositions = [
            { x: narvarkX + 80, y: narvarkY - 40 },   // Right and up
            { x: narvarkX + 100, y: narvarkY },       // Right
            { x: narvarkX + 80, y: narvarkY + 40 },   // Right and down
            { x: narvarkX - 80, y: narvarkY - 30 },   // Left and up
            { x: narvarkX - 80, y: narvarkY + 30 }    // Left and down
        ];

        // console.log('Creating herbs at positions:', herbPositions);
        // console.log('Camera position:', this.cameras.main.x, this.cameras.main.y);
        // console.log('Camera bounds:', this.cameras.main.getBounds());

        herbPositions.forEach((pos, index) => {
            try {
                console.log(`Creating test herb ${index + 1} at (${pos.x}, ${pos.y})`);
                // Create test herb using static mysterious herb image
                const herb = new Item(this, pos.x, pos.y, 'mysterious-herb', { 
                    sound: 'collect-herb', 
                    volume: 0.5 
                });
                herb.setScale(0.8).setSize(32, 32).setOffset(0, 0); // Proper scale and centered clickable area
                herb.setVisible(true); // Ensure herb is visible
                herb.setDepth(100); // Higher depth to ensure visibility
                
                // Add quest icon if herb collection quest is active
                this.addQuestIconToHerb(herb);
                this.items.push(herb);
                console.log(`✓ Test herb ${index + 1} created successfully at (${pos.x}, ${pos.y})`);
                console.log(`  - Herb visible: ${herb.visible}`);
                console.log(`  - Herb depth: ${herb.depth}`);
                console.log(`  - Herb scale: ${herb.scaleX}, ${herb.scaleY}`);
            } catch (error) {
                console.error(`✗ Failed to create herb ${index + 1}:`, error);
            }
        });
        
    }

    /**
     * Add quest icon to herb if herb collection quest is active
     */
    private addQuestIconToHerb(herb: Item): void {
        this.addQuestIconToItem(herb, 'mysterious herb');
    }

    /**
     * Add quest icons to existing items after quest system is initialized
     */
    private addQuestIconsToExistingItems(): void {
        if (!this.questSystem) {
            return;
        }

        // Add quest icons to existing herbs
        this.items.forEach((item) => {
            if (item && item.active && item.getItemType() === 'mysterious herb') {
                this.addQuestIconToItem(item, 'mysterious herb');
            }
        });

        // Add quest icons to existing enemies
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                // Determine enemy type based on texture or other properties
                let enemyType = 'Nepian Scout'; // Default
                if (enemy.texture.key === 'enemy-1') {
                    enemyType = 'Nepian Scout';
                } else if (enemy.texture.key === 'enemy-2') {
                    enemyType = 'Nepian Observer';
                } else if (enemy.texture.key === 'boss-1') {
                    enemyType = 'Electro Lord';
                }
                this.addQuestIconToEnemy(enemy, enemyType);
            }
        });
    }

    /**
     * Add quest icon to any item if a relevant quest is active
     */
    private addQuestIconToItem(item: Item, itemType: string): void {
        if (!this.questSystem) {
            // Quest system not yet initialized, skip quest icon for now
            return;
        }

        const activeQuests = this.questSystem.getActiveQuests();
        
        // Check each active quest to see if this item type is required
        for (const [questId, questProgress] of activeQuests) {
            if (questProgress.isCompleted) continue;
            
            const questData = this.cache.json.get(`quest-${questId}`);
            if (!questData || !questData.questdata) continue;
            
            const questRequirement = questData.questdata.type.toLowerCase();
            const itemTypeLower = itemType.toLowerCase();
            
            // Check if this item matches the quest requirement
            if (questRequirement === itemTypeLower || 
                (questRequirement.includes('nepian') && itemTypeLower.includes('nepian')) ||
                (questRequirement.includes('heart') && itemTypeLower.includes('heart'))) {
                
                // Add quest icon with sparkle animation
                const questIcon = this.add.sprite(item.x, item.y - 25, 'quest-icon');
                questIcon.setScale(1.0); // Larger, more visible quest icon
                questIcon.setDepth(150); // Above the item
                questIcon.anims.play('quest-icon-bounce', true); // Use bounce animation for sparkle effect
                
                // Add sparkle animation to the herb itself
                this.addSparkleAnimationToItem(item);
                
                // Store reference to quest icon for cleanup
                item.setData('questIcon', questIcon);
                
                console.log(`✓ Added quest icon and sparkle to ${itemType} - quest ${questId} is active`);
                break; // Only add one quest icon per item
            }
        }
    }

    /**
     * Add sparkle animation to an item (herbs, etc.)
     */
    private addSparkleAnimationToItem(item: Item): void {
        // Create sparkle effect using tween animations
        const sparkleTween = this.tweens.add({
            targets: item,
            scaleX: item.scaleX * 1.2,
            scaleY: item.scaleY * 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add subtle glow effect
        const glowTween = this.tweens.add({
            targets: item,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store tweens for cleanup
        item.setData('sparkleTween', sparkleTween);
        item.setData('glowTween', glowTween);
    }

    /**
     * Add quest icon to enemy if relevant quest is active
     */
    private addQuestIconToEnemy(enemy: Enemy, enemyType: string): void {
        if (!this.questSystem) return;

        const activeQuests = this.questSystem.getActiveQuests();
        
        // Check each active quest to see if this enemy type is required
        for (const [questId, questProgress] of activeQuests) {
            if (questProgress.isCompleted) continue;
            
            const questData = this.cache.json.get(`quest-${questId}`);
            if (!questData || !questData.questdata) continue;
            
            const questRequirement = questData.questdata.type.toLowerCase();
            const enemyTypeLower = enemyType.toLowerCase();
            
            // Check if this enemy matches the quest requirement
            if (questRequirement === enemyTypeLower || 
                (questRequirement.includes('nepian') && enemyTypeLower.includes('nepian')) ||
                (questRequirement.includes('scout') && enemyTypeLower.includes('scout')) ||
                (questRequirement.includes('electro') && enemyTypeLower.includes('electro'))) {
                
                // Add quest icon above enemy
                const questIcon = this.add.sprite(enemy.x, enemy.y - 30, 'quest-icon');
                questIcon.setScale(0.7);
                questIcon.setDepth(150); // Above the enemy
                questIcon.anims.play('quest-icon-bounce', true);
                
                // Store reference to quest icon for cleanup
                enemy.setData('questIcon', questIcon);
                
                console.log(`Added quest icon to ${enemyType} - quest ${questId} is active`);
                break; // Only add one quest icon per enemy
            }
        }
    }

    /**
     * Handle quest completion and give rewards to player
     */
    private handleQuestCompletion(questData: any): void {
        console.log(`Quest completed: ${questData.questName}`);
        console.log(`Reward: ${questData.reward.amount} ${questData.reward.type}`);
        
        // Remove quest icons from items since quest is completed
        this.removeQuestIconsFromItems(questData.questId);
        
        // Add reward to player inventory
        if (this.player && this.player.p1Inventory && questData.reward) {
            const reward = questData.reward;
            const added = this.player.p1Inventory.addItem(reward.type, reward.amount);
            
            if (added) {
                console.log(`✓ Reward added to inventory: ${reward.amount} ${reward.type}`);
                
                // Show reward notification
                this.showRewardNotification(reward);
            } else {
                console.log(`✗ Failed to add reward to inventory: ${reward.amount} ${reward.type}`);
            }
        }
    }

    /**
     * Remove quest icons from items when quest is completed
     */
    private removeQuestIconsFromItems(completedQuestId: number): void {
        // Get the quest data to determine what items to clean up
        const questData = this.cache.json.get(`quest-${completedQuestId}`);
        if (!questData || !questData.questdata) return;
        
        const questItemType = questData.questdata.type.toLowerCase();
        
        // Remove quest icons from items that match the completed quest
        this.items.forEach(item => {
            if (item && item.active) {
                const itemType = item.getItemType().toLowerCase();
                
                // Check if this item matches the completed quest requirement
                if (questItemType === itemType || 
                    (questItemType.includes('nepian') && itemType.includes('nepian')) ||
                    (questItemType.includes('heart') && itemType.includes('heart'))) {
                    
                    // Remove quest icon
                    const questIcon = item.getData('questIcon');
                    if (questIcon) {
                        questIcon.destroy();
                        item.setData('questIcon', null);
                    }
                    
                    // Remove sparkle animations
                    const sparkleTween = item.getData('sparkleTween');
                    const glowTween = item.getData('glowTween');
                    if (sparkleTween) {
                        sparkleTween.destroy();
                        item.setData('sparkleTween', null);
                    }
                    if (glowTween) {
                        glowTween.destroy();
                        item.setData('glowTween', null);
                    }
                    
                    console.log(`Removed quest icon from ${itemType} - quest ${completedQuestId} completed`);
                }
            }
        });
        
        // Remove quest icons from enemies that match the completed quest
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                const questIcon = enemy.getData('questIcon');
                if (questIcon) {
                    questIcon.destroy();
                    enemy.setData('questIcon', null);
                    console.log(`Removed quest icon from enemy - quest ${completedQuestId} completed`);
                }
            }
        });
    }

    /**
     * Show reward notification to player
     */
    private showRewardNotification(reward: any): void {
        // Create floating reward text
        const rewardText = this.add.bitmapText(
            this.player.x, this.player.y - 50,
            'pixel-white', `+${reward.amount} ${reward.type}`, 16
        );
        rewardText.setTint(0xffd700); // Gold color
        rewardText.setOrigin(0.5, 0.5);
        rewardText.setDepth(1000);
        
        // Animate the reward text
        this.tweens.add({
            targets: rewardText,
            y: rewardText.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                rewardText.destroy();
            }
        });
    }


    /**
     * Handles item collection when player overlaps with an item
     */
    private collectItem(item: Item | MedievalSword): void {
        try {
            // Check if item is a weapon
            if (item instanceof MedievalSword) {
                this.collectWeapon(item);
            } else {
                this.collectRegularItem(item);
            }
        } catch (error) {
            console.error('Error collecting item:', error);
        }
    }

    /**
     * Handles collection of regular items (herbs, fruit, etc.)
     */
    private collectRegularItem(item: Item): void {
        const itemType = item.getItemType();
        
        // Add to player inventory
        if (this.player && this.player.p1Inventory) {
            const added = this.player.p1Inventory.addItem(itemType, 1);
            
            if (added) {
                // Update quest progress when item is collected
                if (this.questSystem) {
                    this.questSystem.updateQuestProgress(itemType, 1);
                }
                
                // Clean up quest icon if it exists
                const questIcon = item.getData('questIcon');
                if (questIcon) {
                    questIcon.destroy();
                    item.setData('questIcon', null);
                }
                
                // Clean up sparkle animations if they exist
                const sparkleTween = item.getData('sparkleTween');
                const glowTween = item.getData('glowTween');
                if (sparkleTween) {
                    sparkleTween.destroy();
                    item.setData('sparkleTween', null);
                }
                if (glowTween) {
                    glowTween.destroy();
                    item.setData('glowTween', null);
                }
                
                // Play collection sound
                item.collect();
                
                // Remove from items array
                const index = this.items.indexOf(item);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
                
                // Destroy the item to prevent further interactions
                item.destroy();
                
                console.log(`Collected ${itemType}`);
            } else {
                console.log(`Inventory full, cannot collect ${itemType}`);
            }
        }
    }

    /**
     * Handles collection of weapons
     */
    private collectWeapon(weapon: MedievalSword): void {
        if (this.player && this.player.p1Inventory) {
            // Debug: Check current weapon count
            const currentWeaponCount = this.player.p1Inventory.getWeaponCount();
            const maxWeapons = 10; // From Inventory class
            console.log(`Current weapons: ${currentWeaponCount}/${maxWeapons}`);
            
            // Create weapon data for inventory
            const weaponData = {
                type: 'weapon' as const,
                weaponType: weapon.getWeaponStats().weaponType,
                rarity: weapon.getWeaponStats().rarity,
                stats: weapon.getWeaponStats(),
                icon: weapon.getIconTexture()
            };
            
            const added = this.player.p1Inventory.addWeapon(weaponData);
            
            if (added) {
                // Update quest progress when weapon is collected (for weapon-related quests)
                if (this.questSystem) {
                    const weaponType = weapon.getWeaponStats().weaponType;
                    this.questSystem.updateQuestProgress(weaponType, 1);
                }
                
                // Play collection sound
                weapon.collect();
                
                // Remove from items array
                const index = this.items.indexOf(weapon);
                if (index > -1) {
                    this.items.splice(index, 1);
                }
                
                // Destroy the weapon to prevent further interactions
                weapon.destroy();
                
                console.log(`✓ Collected ${weapon.getWeaponStats().rarity} ${weapon.getWeaponStats().weaponType}`);
            } else {
                console.log(`✗ Inventory full, cannot collect weapon. Current: ${currentWeaponCount}/${maxWeapons}`);
            }
        }
    }

    private createTrees(): void {
        try {
            // Create environmental trees from tilemap object layer
            // Uses 'tree_1', 'tree_2' etc. objects placed in Tiled
            if (this.objlayer) {
                this.objlayer.objects.forEach(element => {
                    if (element.name === 'tree_1') {
                        this.trees.push(new Tree(this, element.x as number, element.y as number, 'tree-1'));
                    } else if (element.name === 'tree_2') {
                        this.trees.push(new Tree(this, element.x as number, element.y as number, 'tree-2'));
                    } else if (element.name === 'tree_3') {
                        this.trees.push(new Tree(this, element.x as number, element.y as number, 'tree-3'));
                    }
                })
            }

            this.createTreeOfLife()
        } catch (error) {
            console.error('Error creating trees:', error);
        }
    }

    private createTreeOfLife(): void {
        // TODO: Get Tree of Life position from tilemap object layer instead of hardcoding
        const treeOfLife = new Tree(this, 350, 400, 'tree-2-second')
        treeOfLife.clearFruit()

        // Make it extra special - larger scale and unique properties
        treeOfLife.setScale(4); // Much larger than normal trees
        treeOfLife.setDepth(10); // Ensure it's visible above other objects
        
        // Set origin to center for proper positioning
        treeOfLife.setOrigin(0.5, 0.5);

        // Add nametag to the tree
        treeOfLife.createNameTag('TREE OF LIFE');
        
        // Add the tree to our trees array
        this.trees.push(treeOfLife);

        // Create swords around the Tree of Life for proximity pickup testing
        this.createSwordsAroundTreeOfLife(350, 400);
    }

    private createSwordsAroundTreeOfLife(treeX: number, treeY: number): void {
        // Create 3-5 swords in a circle around the Tree of Life
        const swordCount = 4;
        const radius = 80; // Distance from tree center
        
        for (let i = 0; i < swordCount; i++) {
            const angle = (i / swordCount) * Math.PI * 2;
            const swordX = treeX + Math.cos(angle) * radius;
            const swordY = treeY + Math.sin(angle) * radius;
            
            // Create swords with different rarities
            const rarities: ('common' | 'uncommon' | 'rare' | 'epic' | 'legendary')[] = 
                ['common', 'uncommon', 'rare', 'epic'];
            const rarity = rarities[i % rarities.length];
            
            this.createSwordSpawnPoint(swordX, swordY, rarity);
        }
    }

    private setupMinimap(): void {
        const minimapSize = 175;
        const minimapX = 20;
        const minimapY = 20;
 
        // Create circular minimap camera
        this.miniMapCamera = this.cameras.add(minimapX, minimapY, minimapSize, minimapSize);
        this.miniMapCamera.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
        this.miniMapCamera.setZoom(0.14);
        this.miniMapCamera.startFollow(this.player, true, 0.1, 0.1);
        
        // Ensure minimap camera is isolated from any shake effects
        this.miniMapCamera.setPosition(minimapX, minimapY);

        // Create circular mask for the minimap
        this.minimapMask = this.add.graphics();
        this.minimapMask.setDepth(999)
        this.minimapMask.setScrollFactor(0)
        this.minimapMask.fillStyle(0xffffff, 1);
        this.minimapMask.fillCircle(minimapX + minimapSize / 2, minimapY + minimapSize / 2, minimapSize / 2);
        this.miniMapCamera.ignore(this.minimapMask)

        // Create medieval-themed minimap ring with ornate compass design
        const minimapRing = this.createMedievalMinimapRing(minimapX, minimapY, minimapSize);
        minimapRing.setScrollFactor(0).setDepth(1000); // Fix the ring in place on the screen
        this.miniMapCamera.ignore(minimapRing);

        // ignore the day night cycle overlay
        this.miniMapCamera.ignore(this.dayNightCycle.getOverlay());
        // Apply mask to minimap camera to make it circular
        this.miniMapCamera.setMask(this.minimapMask.createGeometryMask());

    }

    private updateDebugInfo(): void {
        if (!this.debugManager || !this.debugManager.isDebugEnabled()) return;

        // Collect debug information
        const debugInfo = {
            entities: this.enemies.length + this.npcs.length + this.items.length + this.trees.length + (this.player ? 1 : 0),
            enemies: this.enemies.length,
            allies: this.npcs.length,
            items: this.items.length,
            playerPosition: this.player ? { x: this.player.x, y: this.player.y } : { x: 0, y: 0 },
            playerHealth: this.player ? { current: this.player.getHealth(), max: this.player.getMaxHealth() } : { current: 0, max: 0 },
            playerVelocity: this.player ? { x: this.player.body?.velocity.x || 0, y: this.player.body?.velocity.y || 0 } : { x: 0, y: 0 },
            cameraPosition: { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
            cameraZoom: this.cameras.main.zoom,
            worldBounds: { width: this.tilemap.widthInPixels, height: this.tilemap.heightInPixels },
            activeAnimations: this.getActiveAnimations(),
            inputKeys: this.getInputKeyStates(),
            // Day/Night Cycle Info
            timeOfDay: this.dayNightCycle ? this.dayNightCycle.getTimeOfDay() : 'Unknown',
            currentTime: this.dayNightCycle ? this.dayNightCycle.getCurrentTime() : 0,
            darknessIntensity: this.dayNightCycle ? this.dayNightCycle.getDarknessIntensity() : 0,
            flashlightActive: this.lantern ? this.lantern.isLit() : false,
            treeLightsActive: this.treeLightEmission ? this.treeLightEmission.isLightActive() : false,
            // Enemy Night Stats
            enemiesEnhanced: this.enemies.filter(enemy => (enemy as any).nightStatsApplied).length,
            totalEnemies: this.enemies.length,
            // Pathfinding Stats
            enemiesWithPaths: this.enemies.filter(enemy => (enemy as any).currentPath && (enemy as any).currentPath.length > 0).length,
            totalObstacles: this.trees.length
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

        this.npcs.forEach((npc, index) => {
            if (npc.anims.currentAnim) {
                animations.push(`NPC${index}: ${npc.anims.currentAnim.key}`);
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

        this.npcs.forEach(npc => {
            this.debugManager.drawCollisionBox(npc, 0x0000ff); // Blue for NPCs
        });

        this.trees.forEach(tree => {
            this.debugManager.drawCollisionBox(tree, 0x8B4513); // Brown for trees
        });

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

        this.npcs.forEach((npc, index) => {
            const name = npc.entity_type && npc.entity_type !== 'Entity' ? npc.entity_type : `NPC ${index + 1}`;
            this.debugManager.addInfoText(
                npc.x,
                npc.y - 50,
                `${name}\nHP: ${npc.getHealth()}/${npc.getMaxHealth()}`,
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

        // Draw pathfinding paths for enemies
        this.enemies.forEach((enemy) => {
            const enemyPath = (enemy as any).currentPath;
            if (enemyPath && enemyPath.length > 0) {
                this.debugManager.drawPath(enemyPath, 0x00ff00);
            }
        });
    }

    private setupCollisionDetection(): void {
        // Player collision with trees
        this.physics.add.collider(this.player, this.trees);

        // Enemy collision with trees
        this.enemies.forEach(enemy => {
            this.physics.add.collider(enemy, this.trees);
        });

        // Enemy collision with player
        this.enemies.forEach(enemy => {
            this.physics.add.collider(enemy, this.player);
        });

        // NPC collision with trees
        this.npcs.forEach(npc => {
            this.physics.add.collider(npc, this.trees);
        });

        // NPC collision with player
        this.npcs.forEach(npc => {
            this.physics.add.collider(npc, this.player);
        });

        // Item collection - click-based interaction (not automatic overlap)
        this.items.forEach(item => {
            // Make items clickable
            item.setInteractive();
            item.on('pointerdown', () => {
                this.collectItem(item);
            });
        });

        // console.log('Collision detection configured for all entities');
    }

    private loadSaveData(): void {
        const saveData = SaveSystem.loadGame();
        if (saveData) {
            // console.log('Applying save data...');
            SaveSystem.applySaveData(this, saveData);
            // console.log('Save data applied successfully');
        } else {
            // console.log('No save data found or failed to load');
        }
    }

    /**
     * Creates an ornate medieval-themed minimap ring with compass design
     */
    private createMedievalMinimapRing(minimapX: number, minimapY: number, minimapSize: number): Phaser.GameObjects.Graphics {
        const ring = this.add.graphics();
        const centerX = minimapX + minimapSize / 2;
        const centerY = minimapY + minimapSize / 2;
        const outerRadius = (minimapSize / 2) + 8;
        const innerRadius = (minimapSize / 2) + 2;

        // Outer ornate ring - bronze/brass color with metallic feel
        ring.lineStyle(6, 0x8B4513, 1); // Dark brown/bronze
        ring.strokeCircle(centerX, centerY, outerRadius);

        // Inner decorative ring - lighter bronze
        ring.lineStyle(2, 0xCD853F, 1); // Light bronze
        ring.strokeCircle(centerX, centerY, outerRadius - 3);

        // Main border ring - dark metallic
        ring.lineStyle(3, 0x2F4F4F, 1); // Dark slate gray
        ring.strokeCircle(centerX, centerY, innerRadius + 1);

        // Compass cardinal points (N, S, E, W)
        const cardinalRadius = outerRadius + 12;
        ring.fillStyle(0x8B4513, 1); // Bronze color

        // North point
        ring.beginPath();
        ring.moveTo(centerX, centerY - cardinalRadius);
        ring.lineTo(centerX - 4, centerY - cardinalRadius + 8);
        ring.lineTo(centerX + 4, centerY - cardinalRadius + 8);
        ring.closePath();
        ring.fillPath();

        // South point
        ring.beginPath();
        ring.moveTo(centerX, centerY + cardinalRadius);
        ring.lineTo(centerX - 4, centerY + cardinalRadius - 8);
        ring.lineTo(centerX + 4, centerY + cardinalRadius - 8);
        ring.closePath();
        ring.fillPath();

        // East point
        ring.beginPath();
        ring.moveTo(centerX + cardinalRadius, centerY);
        ring.lineTo(centerX + cardinalRadius - 8, centerY - 4);
        ring.lineTo(centerX + cardinalRadius - 8, centerY + 4);
        ring.closePath();
        ring.fillPath();

        // West point
        ring.beginPath();
        ring.moveTo(centerX - cardinalRadius, centerY);
        ring.lineTo(centerX - cardinalRadius + 8, centerY - 4);
        ring.lineTo(centerX - cardinalRadius + 8, centerY + 4);
        ring.closePath();
        ring.fillPath();

        // Decorative corner ornaments (NE, NW, SE, SW)
        const cornerRadius = outerRadius + 6;
        const cornerAngle = Math.PI / 4; // 45 degrees
        ring.fillStyle(0xCD853F, 1); // Light bronze

        // Corner ornaments - small diamonds
        const corners = [
            { angle: cornerAngle, name: 'NE' },
            { angle: -cornerAngle, name: 'SE' },
            { angle: Math.PI - cornerAngle, name: 'NW' },
            { angle: Math.PI + cornerAngle, name: 'SW' }
        ];

        corners.forEach(corner => {
            const x = centerX + Math.cos(corner.angle) * cornerRadius;
            const y = centerY + Math.sin(corner.angle) * cornerRadius;

            ring.beginPath();
            ring.moveTo(x, y - 3);
            ring.lineTo(x + 3, y);
            ring.lineTo(x, y + 3);
            ring.lineTo(x - 3, y);
            ring.closePath();
            ring.fillPath();
        });

        // Add subtle texture lines for aged metal effect
        ring.lineStyle(1, 0x696969, 0.6); // Dim gray
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const startRadius = innerRadius + 2;
            const endRadius = outerRadius - 2;
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            const endX = centerX + Math.cos(angle) * endRadius;
            const endY = centerY + Math.sin(angle) * endRadius;

            ring.beginPath();
            ring.moveTo(startX, startY);
            ring.lineTo(endX, endY);
            ring.strokePath();
        }

        return ring;
    }

    public getPauseMenu(): PauseMenu {
        return this.pauseMenu;
    }

    public getInventoryUI(): InventoryUI {
        return this.inventoryUI;
    }

    public getQuestUI(): QuestUI {
        return this.questUI;
    }

    /**
     * Update items and handle respawning
     */
    private updateItems(_delta: number): void {
        // Track items that need to be respawned
        const itemsToRespawn: { spawnPoint: { x: number; y: number }, type: string, respawnTime: number }[] = [];
        
        // Update existing items and check for respawn needs
        this.items.forEach((item, index) => {
            try {
                if (item && item.active) {
                    item.update();
                    
                    // Check if item was collected and needs respawning
                    if (item.getData('isRespawnable') && !item.visible) {
                        const respawnTime = item.getData('respawnTime') || 30000;
                        const collectedTime = item.getData('collectedTime') || 0;
                        
                        if (Date.now() - collectedTime >= respawnTime) {
                            const spawnPoint = item.getData('spawnPoint');
                            const originalType = item.getData('originalType');
                            
                            if (spawnPoint && originalType) {
                                itemsToRespawn.push({
                                    spawnPoint,
                                    type: originalType,
                                    respawnTime
                                });
                            }
                            
                            // Remove the old item
                            item.destroy();
                            this.items.splice(index, 1);
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating item:', error);
            }
        });
        
        // Respawn items that are ready
        itemsToRespawn.forEach(respawnData => {
            try {
                if (respawnData.type === 'mysterious herb') {
                    this.createHerbSpawnPoint(respawnData.spawnPoint.x, respawnData.spawnPoint.y, respawnData.type);
                } else if (respawnData.type === 'fruit') {
                    this.createFruitSpawnPoint(respawnData.spawnPoint.x, respawnData.spawnPoint.y);
                }
            } catch (error) {
                console.error('Error respawning item:', error);
            }
        });
    }

    // TODO: Implement createQuestHerbs() method to spawn quest herbs from tilemap
    // private createQuestHerbs(): void {}

    private setupInteractionControls(): void {
        // Setup E key for interaction
        this.input.keyboard?.on('keydown-E', () => {
            if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                this.questGiverNPC.interact();
            }
        });

        // Setup F key as alternative interaction
        this.input.keyboard?.on('keydown-F', () => {
            if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                this.questGiverNPC.interact();
            }
        });

        // Setup mouse click interaction
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                // Check if click is near NPC
                const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.questGiverNPC.x, this.questGiverNPC.y);
                if (distance < 50) {
                    this.questGiverNPC.interact();
                }
            }
        });

        // Setup T key to force reset debug mode (in case time gets stuck)
        this.input.keyboard?.on('keydown-T', () => {
            if (this.dayNightCycle) {
                this.dayNightCycle.forceResetDebugMode();
            }
        });

    }

    /**
     * Starts the fade in effect when entering the game
     */
    private startFadeIn(): void {
        try {
            // Create a black overlay that covers the entire screen
            const fadeOverlay = this.add.rectangle(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                this.cameras.main.width,
                this.cameras.main.height,
                0x000000,
                1 // Start fully opaque (black)
            );
            fadeOverlay.setDepth(20000); // Above everything else
            fadeOverlay.setScrollFactor(0); // Fixed to camera

            // Fade from black to transparent
            this.tweens.add({
                targets: fadeOverlay,
                alpha: 0,
                duration: 1000, // 1 second fade
                ease: 'Power2',
                onComplete: () => {
                    fadeOverlay.destroy();
                    // console.log('Game fade in complete');
                }
            });

            // console.log('Starting game fade in...');

        } catch (error) {
            console.error('Error in game fade in:', error);
        }
    }

    /**
     * Clean up resources when scene is destroyed
     */
    shutdown(): void {
        // console.log('World scene shutting down...');

        // Stop music manager with fade out
        if (this.musicManager) {
            // console.log('Stopping shuffle playlist...');
            this.musicManager.stopPlaylist();
        }

        // Clean up day/night cycle
        if (this.dayNightCycle) {
            this.dayNightCycle.destroy();
        }

        // console.log('World scene cleanup complete');
    }
}
