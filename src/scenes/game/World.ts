import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { UnifiedNPC } from '../../prefabs/UnifiedNPC';
import { Item } from '../../prefabs/Item';
import { LongSword } from '../../prefabs/Weapon';
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
// import { LoreManager } from '../../systems/LoreManager'; // TODO: Implement lore system
import GameConfig from '../../config/GameConfig';

/**
 * World Scene - Main game world implementation
 * 
 * Handles tilemap rendering, collision detection, entity management,
 * and all game systems including quests, inventory, day/night cycle, etc.
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
    private objlayer!: Phaser.Tilemaps.ObjectLayer | null;
    private processedQuestCompletions?: Set<string>;

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
    // private loreManager!: LoreManager; // TODO: Implement lore system

    constructor() {
        super('worldScene');
        // Initialize pause menu as undefined to ensure clean state
        this.pauseMenu = undefined as any;
    }

    init(data: WorldData): void {
        console.log('=== WORLD SCENE INIT ===');
        console.log('Data received:', data);
        console.log('loadSaveData flag:', data.loadSaveData);
        
        // Reset all arrays and state for new game
        this.enemies = [];
        this.npcs = [];
        this.items = [];
        this.trees = [];
        
        // Reset quest system state only for new game, not for save game load
        if (this.questSystem && !data.loadSaveData) {
            console.log('Resetting existing quest system for new game');
            this.questSystem.reset();
        }
        
        // Reset QuestUI if it exists
        if (this.questUI && !data.loadSaveData) {
            console.log('Resetting existing QuestUI for new game');
            this.questUI.reset();
        }
        // Don't reset quest system to undefined - let it persist or be recreated in create()
        this.questGiverNPC = undefined as any;
        
        console.log('World scene arrays reset');
        console.log('=== END WORLD SCENE INIT ===');
    }

    create(data: WorldData): void {
        try {
            console.log('=== WORLD SCENE CREATE ===');
            console.log('Data received in create:', data);
            console.log('loadSaveData flag in create:', data.loadSaveData);

            // Create tilemap
            this.createTilemap();

            // Create player at spawn position from tilemap
            const playerSpawn = this.tilemap.findObject('NPC/Player Spawn', obj => obj.name === 'p_spawn');
            let playerSpawnX = GameConfig.SPAWN.PLAYER_X; // Fallback
            let playerSpawnY = GameConfig.SPAWN.PLAYER_Y; // Fallback
            
            if (playerSpawn) {
                playerSpawnX = playerSpawn.x as number;
                playerSpawnY = playerSpawn.y as number;
                console.log(`✓ Player spawn position from tilemap: (${playerSpawnX}, ${playerSpawnY})`);
            } else {
                console.warn('⚠️ p_spawn object not found in tilemap, using config fallback');
            }
            
            this.player = new Player(this, playerSpawnX, playerSpawnY, data.inv, data.qobj);
            // Set player depth between trees underlayer (50) and trees overlayer (60)
            // This ensures player appears behind trees overlayer but in front of trees underlayer
            this.player.setDepth(55);
            
            // Collision detection is now handled in setupCollisionDetection()

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

            // Music Manager - ensure clean state
            if (this.musicManager) {
                this.musicManager.stopPlaylist();
                this.musicManager.reset();
            }
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

            // Entity collision is now handled in setupCollisionDetection()

            // camera setup - with safety checks
            if (this.tilemap && this.tilemap.widthInPixels && this.tilemap.heightInPixels) {
                this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
                this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
            this.cameras.main.startFollow(this.player);
                console.log(`✓ Camera bounds set: ${this.tilemap.widthInPixels}x${this.tilemap.heightInPixels}`);
                console.log(`✓ Map dimensions: ${this.tilemap.width}x${this.tilemap.height} tiles`);
            } else {
                console.error('❌ Tilemap dimensions not available for camera setup');
                // Fallback to default bounds
                this.cameras.main.setBounds(0, 0, 1600, 1200);
                this.physics.world.setBounds(0, 0, 1600, 1200);
                this.cameras.main.startFollow(this.player);
            }

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

            // Setup lore manager (TODO: Implement lore system)
            // this.loreManager = new LoreManager(this);

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

            // Collision toggle event
            this.events.on('debug-toggleCollisionBoxes', (visible: boolean) => {
                if (this.debugManager) {
                    this.debugManager.setCollisionBoxVisibility(visible);
                }
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
            this.lantern = new Lantern(this, this.player);
            this.player.lantern = this.lantern; // Connect lantern to player

            // Setup Quest System and NPC
            this.questSystem = new QuestSystem(this, this.player);
            this.data.set('questSystem', this.questSystem); // Store quest system in scene data
            
            // Now that quest system is initialized, add quest icons to existing items
            // Use a small delay to ensure everything is properly set up
            this.time.delayedCall(100, () => {
                this.addQuestIconsToExistingItems();
            });
            
            // Listen for quest completion events to give rewards
            this.events.on('questCompleted', this.handleQuestCompletion, this);
            
            // Listen for quest start events to add quest icons to existing items
            this.events.on('startQuest', (questId: number) => {
                try {
                    console.log(`Quest ${questId} started, adding quest icons to relevant items`);
                    // Add quest icons to existing items when a quest starts
                    this.addQuestIconsToExistingItems();
                } catch (error) {
                    console.error('Error adding quest icons on quest start:', error);
                }
            });

            // Create Narvark the quest giver NPC
            const narvarkNPC = this.npcs.find(npc => npc.entity_type === 'Narvark');
            if (narvarkNPC) {
                this.questGiverNPC = narvarkNPC;
                this.questGiverNPC.setPlayer(this.player);
                this.questSystem.setNPC(this.questGiverNPC);
                this.data.set('npc', this.questGiverNPC);
            } else {
                console.error('Narvark NPC not found!');
            }

            // Setup Dialogue UI - clean up existing instance first
            if (this.dialogueUI) {
                try {
                    this.dialogueUI.destroy();
                } catch (error) {
                    console.error('Error destroying existing dialogue UI:', error);
                }
            }
            this.dialogueUI = new DialogueUI(this);

        // Setup interaction controls
        this.setupInteractionControls();

        // Setup camera zoom controls for testing
        this.setupCameraZoomControls();

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

            // Setup Pause Menu with a delay to ensure scene is fully ready
            this.time.delayedCall(100, () => {
                try {
                    // console.log('Setting up pause menu...');
                    // Clean up any existing pause menu first
                    if (this.pauseMenu) {
                        this.pauseMenu.destroy();
                    }
                    // Always create a fresh pause menu instance
                    this.pauseMenu = new PauseMenu(this);
                    console.log('Pause menu created successfully');
                } catch (error) {
                    console.error('Error creating pause menu:', error);
                }
            });

            // Setup quest UI - clean up existing instance first
            if (this.questUI) {
                try {
                    (this.questUI as any).destroy();
                } catch (error) {
                    console.error('Error destroying existing quest UI:', error);
                }
            }
            this.questUI = new QuestUI(this);
            // console.log('Quest UI setup complete');

            if (data.loadSaveData) {
                // Clear corrupted save data before loading
                SaveSystem.clearCorruptedSaveData();
                this.loadSaveData();
                
                // Restore QuestSystem state and active quests in QuestUI after save data is loaded
                this.time.delayedCall(500, () => {
                    try {
                        console.log('World: Restoring QuestSystem state...');
                        
                        // Restore QuestSystem state
                        const savedQuestState = localStorage.getItem('quest_system_state');
                        if (savedQuestState) {
                            try {
                                const questState = JSON.parse(savedQuestState);
                                this.questSystem.restoreQuestState(questState);
                                console.log('World: QuestSystem state restored from localStorage');
                            } catch (error) {
                                console.error('World: Failed to parse saved quest state:', error);
                            }
                        } else {
                            console.log('World: No saved quest state found');
                        }
                        
                        console.log('World: Restoring active quests in QuestUI...');
                        if (this.questUI) {
                            this.questUI.restoreActiveQuests();
                        }
                        
                        // Add quest icons to existing items after quest system is restored
                        console.log('World: Adding quest icons to existing items after quest system restoration...');
                        this.addQuestIconsToExistingItems();
                        
                        // Restore NPC state from quest system
                        this.npcs.forEach(npc => {
                            if (npc.isQuestGiver && npc.restoreStateFromQuestSystem) {
                                npc.restoreStateFromQuestSystem();
                            }
                        });
                    } catch (error) {
                        console.error('Error restoring quest system state:', error);
                    }
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

        // Update player (only if it exists and is active)
        if (this.player && this.player.active) {
            try {
                this.player.update();
            } catch (error) {
                console.error('Error updating player:', error);
            }
        }

        // Update enemies (with safety checks for physics body and active state)
        this.enemies.forEach(enemy => {
            try {
                if (enemy && enemy.active && enemy.body) {
                    enemy.update();
                }
            } catch (error) {
                console.error('Error updating enemy:', error);
            }
        });

        // Update NPCs (with safety checks)
        this.npcs.forEach(npc => {
            try {
                if (npc && npc.active) {
                    npc.update();
                }
            } catch (error) {
                console.error('Error updating NPC:', error);
            }
        });

        // Update trees (with safety checks for game property and active state)
        this.trees.forEach(tree => {
            try {
                if (tree && tree.active && tree.scene && tree.scene.game) {
                    tree.update();
                }
            } catch (error) {
                console.error('Error updating tree:', error);
            }
        });

        // Update items and handle respawning
        this.updateItems(delta);
        
        // Debug: Check for unexpected sword creation (only log if more than 1 sword)
        const currentSwords = this.children.list.filter(child => child instanceof LongSword);
        if (currentSwords.length > 1) {
            console.log(`DEBUG: Found ${currentSwords.length} swords in scene during update`);
        }

        // Update Lantern
        if (this.lantern) {
            this.lantern.update();
        }

        // Update Dialogue UI
        if (this.dialogueUI) {
            this.dialogueUI.update(delta);
        }

        // Update Tree Light Emission
        if (this.treeLightEmission) {
            this.treeLightEmission.update(delta);
        }

        // Update entity depths based on position
        this.updatePlayerDepth();

        this.updateNPCsDepth();
        this.updateEnemiesDepth();
        // Update debug manager
        if (this.debugManager) {
            this.updateDebugInfo();
            this.debugManager.update();
            
            // Draw debug visuals if debug mode is enabled
            if (this.debugManager.isDebugEnabled()) {
                this.drawDebugVisuals();
            }
        }
    }

    private setupCollisionObjects(): void {
        if (!this.tilemap) return;
        
        // Get the collision object layer
        const collisionLayer = this.tilemap.getObjectLayer('Collision');
        if (!collisionLayer) {
            console.log('No Collision object layer found');
            return;
        }
        
        console.log(`Found ${collisionLayer.objects.length} collision objects`);
        
        // Create a single static group for all collision objects
        const collisionGroup = this.physics.add.staticGroup();
        
        // Create physics bodies for each collision object
        collisionLayer.objects.forEach((obj: any, index: number) => {
            try {
                let collisionBody;
                
                if (obj.ellipse) {
                // Handle ellipse/circle collision objects
                const radius = Math.min(obj.width, obj.height) / 2;
                const centerX = obj.x + obj.width / 2;
                const centerY = obj.y + obj.height / 2;
                
                // Create a circle physics body
                collisionBody = collisionGroup.create(centerX, centerY, undefined);
                collisionBody.body.setCircle(radius);
                collisionBody.setVisible(false); // Make it invisible
                
                console.log(`✓ Created circle collision ${index} at (${centerX}, ${centerY}) with radius ${radius}`);
            } else if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                // Handle rectangle collision objects
                const centerX = obj.x + obj.width / 2;
                const centerY = obj.y + obj.height / 2;
                
                collisionBody = collisionGroup.create(centerX, centerY, undefined);
                collisionBody.body.setSize(obj.width, obj.height);
                collisionBody.setVisible(false); // Make it invisible
                
                console.log(`✓ Created rectangle collision ${index} at (${centerX}, ${centerY}) size ${obj.width}x${obj.height}`);
            } else {
                console.warn(`⚠️ Skipping collision object ${index} - invalid geometry`);
                console.warn(`  Object data:`, obj);
                return;
            }
            
                // Mark as collision object for debug visualization
                if (collisionBody) {
                    collisionBody.setData('collisionObject', true);
                    collisionBody.setData('isCircle', !!obj.ellipse);
                    collisionBody.setData('isRectangle', !obj.ellipse);
                    collisionBody.setData('radius', obj.ellipse ? Math.min(obj.width, obj.height) / 2 : null);
                    collisionBody.setData('objectIndex', index);
                    // Store original object data for accurate debug drawing
                    collisionBody.setData('originalX', obj.x);
                    collisionBody.setData('originalY', obj.y);
                    collisionBody.setData('originalWidth', obj.width);
                    collisionBody.setData('originalHeight', obj.height);
                }
            } catch (error) {
                console.error(`❌ Error creating collision object ${index}:`, error);
                console.error(`  Object data:`, obj);
            }
        });
        
        console.log(`✓ Created collision group with ${collisionGroup.children.size} objects`);
        
        // Log collision object statistics
        const ellipseCount = collisionLayer.objects.filter(obj => obj.ellipse).length;
        const rectangleCount = collisionLayer.objects.filter(obj => !obj.ellipse && obj.width && obj.height).length;
        const skippedCount = collisionLayer.objects.length - ellipseCount - rectangleCount;
        console.log(`  - Ellipse objects: ${ellipseCount}`);
        console.log(`  - Rectangle objects: ${rectangleCount}`);
        if (skippedCount > 0) {
            console.log(`  - Skipped objects: ${skippedCount}`);
        }
    }



    /**
     * Helper function to create a layer with error handling and logging
     */
    private createLayerWithErrorHandling(layerName: string, tilesets: any[]): Phaser.Tilemaps.TilemapLayer | null {
        const layer = this.tilemap.createLayer(layerName, tilesets);
        if (!layer) {
            console.warn(`⚠️ Layer '${layerName}' not found in tilemap`);
        } else {
            console.log(`✓ Layer '${layerName}' created successfully`);
        }
        return layer;
    }

    /**
     * Advanced perspective depth system for AI entities
     * Uses both Y-coordinate and X-coordinate for true perspective depth
     * Static objects (trees, buildings, rocks) keep their fixed depths
     */
    private updateEntityDepth(entity: any): void {
        if (!entity || !entity.y || !entity.setDepth) return;

        const entityY = entity.y;
        const entityX = entity.x;

        // Calculate perspective depth based on Y and X position
        let entityDepth = this.calculatePerspectiveDepth(entityY, entityX);

        // Apply the calculated depth to AI entity
        entity.setDepth(entityDepth);
    }

    /**
     * Calculate perspective depth based on Y and X coordinates
     * This creates a more realistic depth system
     */
    private calculatePerspectiveDepth(y: number, x: number): number {
        // =====================================================================
        // PERSPECTIVE DEPTH CONFIGURATION
        // Adjust these values to match your map layout and visual preferences
        // =====================================================================
        
        // Map dimensions - UPDATE THESE TO MATCH YOUR ACTUAL MAP SIZE
        const MAP_HEIGHT = 2400; // Your map height in pixels
        const MAP_WIDTH = 2400;  // Your map width in pixels
        
        // Depth range - how much depth variation across the map
        const MIN_DEPTH = 35;    // Minimum depth (front of map)
        const MAX_DEPTH = 135;   // Maximum depth (back of map)
        const DEPTH_RANGE = MAX_DEPTH - MIN_DEPTH; // 100 depth units
        
        // X-axis depth variation - how much left/right affects depth
        const X_DEPTH_VARIATION = 10; // -5 to +5 depth variation
        
        // Static object depths - these should match your layer depths
        const STATIC_DEPTHS = {
            ROCKS: 40,
            TREES_UNDER: 50,
            TREES_OVER: 60,
            BUILDING_WALLS: 90,
            BUILDING_PROPS_OVER: 130
        };
        
        // Depth zones - UPDATE THESE COORDINATES TO MATCH YOUR MAP LAYOUT
        const DEPTH_ZONES = [
            {
                name: 'rocks',
                yMin: 200, yMax: 400, yThreshold: 300,
                aboveDepth: STATIC_DEPTHS.ROCKS + 5,
                belowDepth: STATIC_DEPTHS.ROCKS - 5
            },
            {
                name: 'trees',
                yMin: 100, yMax: 500, yThreshold: 300,
                aboveDepth: STATIC_DEPTHS.TREES_UNDER + 5,
                belowDepth: STATIC_DEPTHS.TREES_OVER - 5
            },
            {
                name: 'buildings',
                yMin: 300, yMax: 600, yThreshold: 450,
                aboveDepth: STATIC_DEPTHS.BUILDING_WALLS + 5,
                belowDepth: STATIC_DEPTHS.BUILDING_PROPS_OVER - 5
            }
        ];
        
        // =====================================================================
        // CALCULATION LOGIC (usually no need to change this)
        // =====================================================================
        
        // Normalize coordinates (0-1 range)
        const normalizedY = Math.max(0, Math.min(1, y / MAP_HEIGHT));
        const normalizedX = Math.max(0, Math.min(1, x / MAP_WIDTH));
        
        // Calculate base depth from Y position (primary perspective factor)
        // Higher Y = further back = higher depth value
        let baseDepth = MIN_DEPTH + (normalizedY * DEPTH_RANGE);
        
        // Add X-based depth variation for more realistic perspective
        const xVariation = (normalizedX - 0.5) * X_DEPTH_VARIATION;
        baseDepth += xVariation;
        
        // Apply depth zones for specific areas
        for (const zone of DEPTH_ZONES) {
            if (y >= zone.yMin && y <= zone.yMax) {
                if (y < zone.yThreshold) {
                    baseDepth = zone.aboveDepth;
                } else {
                    baseDepth = zone.belowDepth;
                }
                break; // Use the first matching zone
            }
        }
        
        // Ensure depth stays within reasonable bounds
        return Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, Math.round(baseDepth)));
    }

    /**
     * Update player depth (wrapper for backward compatibility)
     */
    private updatePlayerDepth(): void {
        if (this.player) {
            this.updateEntityDepth(this.player);
        }
    }

    /**
     * Update all NPCs depth
     */
    private updateNPCsDepth(): void {
        if (this.npcs && this.npcs.length > 0) {
            this.npcs.forEach((npc: any) => {
                if (npc && npc.active) {
                    this.updateEntityDepth(npc);
                }
            });
        }
    }

    /**
     * Update all enemies depth
     */
    private updateEnemiesDepth(): void {
        if (this.enemies && this.enemies.length > 0) {
            this.enemies.forEach((enemy: any) => {
                if (enemy && enemy.active) {
                    this.updateEntityDepth(enemy);
                    
                    // Quest icons are now only added to new items, not updated on existing ones
                }
            });
        }
    }

    private createTilemap(): void {
        this.tilemap = this.make.tilemap({ key: 'tilemapJSON' });
        
        // The new tilemap has embedded tilesets, so we can create layers directly
        // Create visible layers in the correct order (bottom to top) with proper tilesets
        // Start with minimal layers to isolate the problem
        
        // Set up collision objects from the Collision layer FIRST
        this.setupCollisionObjects();
        
        // =====================================================================
        // COMPREHENSIVE TILESET BINDING FOR AETHERON.TMJ
        // =====================================================================
        // Bind all tilesets referenced in the tilemap using addTilesetImage
        // First argument: tileset name from Tiled (must match exactly)
        // Second argument: image key from preload
        
        // Core environment tilesets
        const tsWater = this.tilemap.addTilesetImage('Water_tiles', 'Water_tiles');
        const tsFloors = this.tilemap.addTilesetImage('Floors_Tiles', 'Floors_Tiles');
        const tsDungeon = this.tilemap.addTilesetImage('Dungeon_Tiles', 'Dungeon_Tiles');
        const tsWallTiles = this.tilemap.addTilesetImage('Wall_Tiles', 'Wall_Tiles');
        const tsWallVariations = this.tilemap.addTilesetImage('Wall_Variations', 'Wall_Variations');
        
        // Props and environment objects
        const tsDungeonProps = this.tilemap.addTilesetImage('Dungeon_Props', 'Dungeon_Props');
        const tsFarm = this.tilemap.addTilesetImage('Farm', 'Farm');
        const tsResources = this.tilemap.addTilesetImage('Resources', 'Resources');
        const tsRocks = this.tilemap.addTilesetImage('Rocks', 'Rocks');
        const tsShadows = this.tilemap.addTilesetImage('Shadows', 'Shadows');
        const tsVegetation = this.tilemap.addTilesetImage('Vegetation', 'Vegetation');
        
        // Tree models (all sizes) - using correct tileset names from tilemap
        const tsSize02 = this.tilemap.addTilesetImage('Size_02', 'Tree_Model_01_Size_02');
        const tsSize02Type02 = this.tilemap.addTilesetImage('Size_02_type02', 'Tree_Model_02_Size_02');
        const tsSize02Type3 = this.tilemap.addTilesetImage('Size_02_type3', 'Tree_Model_03_Size_02');
        const tsSize03 = this.tilemap.addTilesetImage('Size_03', 'Tree_Model_01_Size_03');
        const tsSize03Type02 = this.tilemap.addTilesetImage('Size_03_type02', 'Tree_Model_02_Size_03');
        const tsSize03Type03 = this.tilemap.addTilesetImage('Size_03_type03', 'Tree_Model_03_Size_03');
        const tsSize04 = this.tilemap.addTilesetImage('Size_04', 'Tree_Model_01_Size_04');
        const tsSize04Type02 = this.tilemap.addTilesetImage('Size_04_type02', 'Tree_Model_02_Size_04');
        const tsSize04Type03 = this.tilemap.addTilesetImage('Size_04_type03', 'Tree_Model_03_Size_04');
        const tsSize05 = this.tilemap.addTilesetImage('Size_05', 'Tree_Model_01_Size_05');
        const tsSize05Type02 = this.tilemap.addTilesetImage('Size_05_type02', 'Tree_Model_02_Size_05');
        const tsSize05Type03 = this.tilemap.addTilesetImage('Size_05_type03', 'Tree_Model_03_Size_05');
        
        // Building structures
        const tsShadowsBuildings = this.tilemap.addTilesetImage('Shadows_Buildings', 'Shadows_Buildings');
        const tsWallsBuildings = this.tilemap.addTilesetImage('Walls_Buildings', 'Walls_Buildings');
        const tsRoofsBuildings = this.tilemap.addTilesetImage('Roofs_Buildings', 'Roofs_Buildings');
        const tsPropsBuildings = this.tilemap.addTilesetImage('Props_Buildings', 'Props_Buildings');
        const tsFloorsBuildings = this.tilemap.addTilesetImage('Floors_Buildings', 'Floors_Buildings');
        
        // Stations and special objects
        const tsBonfire = this.tilemap.addTilesetImage('Bonfire', 'Bonfire');
        const tsWorkbench = this.tilemap.addTilesetImage('Workbench', 'Workbench');
        const tsAlchemy = this.tilemap.addTilesetImage('Alchemy_Table_01-Sheet', 'Alchemy_Table_01');
        
        // Fairy Forest assets
        const tsFairyProps = this.tilemap.addTilesetImage('fairyforest_Props', 'fairyforest_Props');
        const tsFairyShadows = this.tilemap.addTilesetImage('fairy_Shadown', 'fairy_Shadown');
        const tsFairyTiles = this.tilemap.addTilesetImage('fairyforest_Tiles', 'fairyforest_Tiles');
        const tsFairyTree = this.tilemap.addTilesetImage('fairyforest_Tree', 'fairyforest_Tree');
        const tsFairyLight = this.tilemap.addTilesetImage('Light_fairy', 'Light_fairy');
        
        // Desert assets
        const tsDesertProps = this.tilemap.addTilesetImage('dessert_Props', 'dessert_Props');
        const tsDesertGround = this.tilemap.addTilesetImage('dessert_Ground', 'dessert_Ground');
        const tsSand = this.tilemap.addTilesetImage('Sand', 'Sand');
        
        // Additional tree tileset
        const tsTree = this.tilemap.addTilesetImage('Tree', 'fairyforest_Tree');
        
        // Create array of all tilesets for layers that might use multiple tilesets
        // Filter out null values in case some tilesets fail to load
        const allTilesets = [
            // Core environment
            tsWater, tsFloors, tsDungeon, tsWallTiles, tsWallVariations,
            // Props and objects
            tsDungeonProps, tsFarm, tsResources, tsRocks, tsShadows, tsVegetation,
            // Tree models
            tsSize02, tsSize02Type02, tsSize02Type3, tsSize03, tsSize03Type02, tsSize03Type03,
            tsSize04, tsSize04Type02, tsSize04Type03, tsSize05, tsSize05Type02, tsSize05Type03,
            // Building structures
            tsShadowsBuildings, tsWallsBuildings, tsRoofsBuildings, tsPropsBuildings, tsFloorsBuildings,
            // Stations
            tsBonfire, tsWorkbench, tsAlchemy,
            // Fairy Forest
            tsFairyProps, tsFairyShadows, tsFairyTiles, tsFairyTree, tsFairyLight,
            // Desert
            tsDesertProps, tsDesertGround, tsSand,
            // Additional tree
            tsTree
        ].filter(ts => ts !== null);
        
        // Log tileset loading results
        console.log('=== TILESET LOADING ANALYSIS ===');
        const tilesetNames = [
            'Water_tiles', 'Floors_Tiles', 'Dungeon_Tiles', 'Wall_Tiles', 'Wall_Variations',
            'Dungeon_Props', 'Farm', 'Resources', 'Rocks', 'Shadows', 'Vegetation',
            'Size_02', 'Size_02_type02', 'Size_02_type3', 'Size_03', 'Size_03_type02', 'Size_03_type03',
            'Size_04', 'Size_04_type02', 'Size_04_type03', 'Size_05', 'Size_05_type02', 'Size_05_type03',
            'Shadows_Buildings', 'Walls_Buildings', 'Roofs_Buildings', 'Props_Buildings', 'Floors_Buildings',
            'Bonfire', 'Workbench', 'Alchemy_Table_01-Sheet',
            'fairyforest_Props', 'fairy_Shadown', 'fairyforest_Tiles', 'fairyforest_Tree', 'Light_fairy',
            'dessert_Props', 'dessert_Ground', 'Sand',
            'Tree'
        ];
        const tilesetValues = [
            tsWater, tsFloors, tsDungeon, tsWallTiles, tsWallVariations,
            tsDungeonProps, tsFarm, tsResources, tsRocks, tsShadows, tsVegetation,
            tsSize02, tsSize02Type02, tsSize02Type3, tsSize03, tsSize03Type02, tsSize03Type03,
            tsSize04, tsSize04Type02, tsSize04Type03, tsSize05, tsSize05Type02, tsSize05Type03,
            tsShadowsBuildings, tsWallsBuildings, tsRoofsBuildings, tsPropsBuildings, tsFloorsBuildings,
            tsBonfire, tsWorkbench, tsAlchemy,
            tsFairyProps, tsFairyShadows, tsFairyTiles, tsFairyTree, tsFairyLight,
            tsDesertProps, tsDesertGround, tsSand,
            tsTree
        ];
        
        tilesetNames.forEach((name, index) => {
            const tileset = tilesetValues[index];
            if (tileset) {
                console.log(`✓ Tileset loaded: ${name}`);
            } else {
                console.warn(`❌ Tileset failed to load: ${name}`);
            }
        });
        console.log(`✓ Total tilesets loaded: ${allTilesets.length}/${tilesetNames.length}`);
        console.log('=== TILESET LOADING ANALYSIS COMPLETE ===');
        
        // Create visible layers in the correct order (bottom to top)
        // Order based on JSON structure: Ground -> Paths -> Shadows -> Walls -> Rocks -> Trees underlayer -> Trees overlayer -> Bushes underlayer -> Roofs -> Building walls -> Props/Details -> Building walls -> Building roofs -> Building props -> Mines -> Bushes overlayer
        
        // Base layers (bottom) - with error handling
        const groundLayer = this.createLayerWithErrorHandling('Ground', allTilesets);
        const pathsLayer = this.createLayerWithErrorHandling('Paths', allTilesets);
        const shadowsLayer = this.createLayerWithErrorHandling('Shadows', allTilesets);
        const wallsLayer = this.createLayerWithErrorHandling('Walls', allTilesets);
        const rocksLayer = this.createLayerWithErrorHandling('Rocks', allTilesets);
        
        // Tree layers (under and over) - with error handling
        const treesUnderlayer = this.createLayerWithErrorHandling('Trees underlayer', allTilesets);
        const treesOverlayer = this.createLayerWithErrorHandling('Trees overlayer', allTilesets);
        
        // Bush layers (under and over) - with error handling
        const bushesUnderlayer = this.createLayerWithErrorHandling('Bushes underlayer', allTilesets);
        
        // Roofs layer - with error handling
        const roofsLayer = this.createLayerWithErrorHandling('Roofs', allTilesets);
        
        // Building layers (first instance) - with error handling
        const buildingWallsLayer1 = this.createLayerWithErrorHandling('Building walls', allTilesets);
        const propsDetailsLayer = this.createLayerWithErrorHandling('Props/Details', allTilesets);
        
        // Building layers (second instance - handle duplicate name by getting by ID)
        // Note: We'll skip the second Building walls layer for now as it has the same name
        // const buildingWallsLayer2 = null; // Skip duplicate layer name
        
        const buildingRoofsLayer = this.createLayerWithErrorHandling('Building roofs', allTilesets);
        
        // Fix: Handle the correct layer names from TMJ file - with error handling
        const buildingPropsUnderlayer = this.createLayerWithErrorHandling('Building props underlayer', allTilesets);
        const buildingPropsOverlayer = this.createLayerWithErrorHandling('Building props overlayer', allTilesets);
        
        // Mine layers - with error handling
        const minesLayer = this.createLayerWithErrorHandling('Mines', allTilesets);
        const mineRoofLayer = this.createLayerWithErrorHandling('Mine Roof', allTilesets);
        
        // Bush overlayer (top) - with error handling
        const bushesOverlayer = this.createLayerWithErrorHandling('Bushes overlayer', allTilesets);
        
        // Collision layer is an object layer, not a tile layer
        // We'll handle collision objects separately in setupCollisionDetection()
        
        // Layer order matches JSON structure: Ground -> Paths -> Shadows -> Walls -> Rocks -> Trees underlayer -> Trees overlayer -> Bushes underlayer -> Roofs -> Building walls -> Props/Details -> Building props underlayer -> Building roofs -> Building props overlayer -> Mines -> Mine Roof -> Bushes overlayer
        const allLayers = [
            groundLayer, pathsLayer, shadowsLayer, wallsLayer, rocksLayer,
            treesUnderlayer, treesOverlayer, bushesUnderlayer, roofsLayer,
            buildingWallsLayer1, propsDetailsLayer, buildingPropsUnderlayer, buildingRoofsLayer, buildingPropsOverlayer,
            minesLayer, mineRoofLayer, bushesOverlayer
        ];
        const layerNames = [
            'Ground', 'Paths', 'Shadows', 'Walls', 'Rocks',
            'Trees underlayer', 'Trees overlayer', 'Bushes underlayer', 'Roofs',
            'Building walls', 'Props/Details', 'Building props underlayer', 'Building roofs', 'Building props overlayer',
            'Mines', 'Mine Roof', 'Bushes overlayer'
        ];
        
        // Set proper depth ordering for correct rendering (lower depth = behind)
        // Order matches JSON structure: Ground -> Paths -> Shadows -> Walls -> Rocks -> Trees underlayer -> Player (55) -> Trees overlayer -> Bushes underlayer -> Roofs -> Building walls -> Props/Details -> Building props underlayer -> Building roofs -> Building props overlayer -> Mines -> Mine Roof -> Bushes overlayer
        // Player depth: 55 (between trees underlayer 50 and trees overlayer 60)
        const depthOrder = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
        
        allLayers.forEach((layer, index) => {
            if (layer) {
                // Set layer visibility and depth
                layer.setVisible(true);
                layer.setDepth(depthOrder[index]);
                console.log(`✓ ${layerNames[index]} layer created successfully (depth: ${depthOrder[index]})`);
            } else {
                console.warn(`❌ ${layerNames[index]} layer failed to create`);
            }
        });
        
        console.log('✓ Tilemap layers created successfully');
        
        // Get object layers and log their contents
        this.objlayer = this.tilemap.getObjectLayer('Item Spawn');
        
        // Log all object layers
        console.log('=== OBJECT LAYERS ANALYSIS ===');
        const allObjectLayers = this.tilemap.layers.filter((layer: any) => layer.type === 'objectgroup');
        allObjectLayers.forEach((layer: any) => {
            console.log(`✓ Object Layer: ${layer.name} (ID: ${layer.id})`);
            if (layer.objects) {
                console.log(`  - Objects count: ${layer.objects.length}`);
                
                // Group objects by name for better analysis
                const objectGroups = layer.objects.reduce((groups: any, obj: any) => {
                    const name = obj.name || 'unnamed';
                    groups[name] = (groups[name] || 0) + 1;
                    return groups;
                }, {});
                
                Object.entries(objectGroups).forEach(([name, count]) => {
                    console.log(`    - ${name}: ${count}`);
                });
            }
        });
        console.log('=== OBJECT LAYERS ANALYSIS COMPLETE ===');
    }


    // no clankers allowed in this function please
    private createEnemies(): void {
        // Create enemies from tilemap object layer spawn points
        // Uses Tiled Map Editor object layer 'NPC/Player Spawn' with named objects:
        // - 'boss_spawn': Creates boss-level enemies
        // - 'enemy_spawn': Creates regular scout enemies  
        // - 'enemy_spawn_2': Creates observer-type enemies
        // This allows level designers to place spawns visually in Tiled
        const enemyObjLayer = this.tilemap.getObjectLayer('NPC/Player Spawn');
        if (enemyObjLayer) {
            enemyObjLayer.objects.forEach(element => {
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
                    // Set enemy depth above paths (10) and roads (20) but below player (200)
                    enemy.setDepth(150);
                    this.enemies.push(enemy);
                }
            })
        }

    }

    private createNPCs(): void {
        try {
            const npc1Spawn = this.tilemap.findObject('NPC/Player Spawn', obj => obj.name === 'npc_spawn')
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
        } catch (error) {
            console.error('Error creating NPC:', error);
        }
    }

    private createItems(): void {
        try {
            // Create collectible items from tilemap object layers
            // Uses named objects like 'bush_1' to spawn herb items
            // Positions are set visually in Tiled Map Editor
            
            // Check Item Spawn layer
            if (this.objlayer) {
                this.objlayer.objects.forEach(element => {
                    this.createItemFromSpawnPoint(element);
                });
            } else {
                console.error('Item Spawn layer not found!');
            }
            
            // Check NPC/Player Spawn layer for bush_1 objects
            const npcSpawnLayer = this.tilemap.getObjectLayer('NPC/Player Spawn');
            if (npcSpawnLayer) {
                let bushCount = 0;
                npcSpawnLayer.objects.forEach(element => {
                    if (element.name === 'bush_1') {
                        bushCount++;
                        this.createItemFromSpawnPoint(element);
                    }
                });
                console.log(`✓ Created ${bushCount} herb spawn points from tilemap`);
            } else {
                console.error('NPC/Player Spawn layer not found!');
            }

            console.log(`✓ Item creation complete - Total items: ${this.items.length}`);

        } catch (error) {
            console.error('Error creating items:', error);
        }
    }


    /**
     * Create herb spawn point with respawn capability
     */
    private createHerbSpawnPoint(x: number, y: number, herbType: string = 'dimensional herb'): void {
        console.log(`Creating herb spawn point: ${herbType} at (${x}, ${y})`);
        
        const herb = new Item(this, x, y, 'dimensional-herb', { 
            sound: 'collect-herb', 
            volume: 0.5 
        });
        
        herb.setScale(0.8).setSize(32, 32).setOffset(0, 0); // Proper scale and centered clickable area
        herb.setVisible(true);
        herb.setDepth(100); // Higher depth to ensure visibility
        
        // Add respawn capability
        herb.setData('respawnTime', 30000); // 30 seconds
        herb.setData('originalType', herbType);
        herb.setData('spawnPoint', { x, y });
        herb.setData('isRespawnable', true);
        
        this.items.push(herb);
        
        // Add quest icon if quest 1 is active (dimensional herb quest)
        this.addQuestIconToNewItem(herb, herbType);
        
        console.log(`✓ Herb created successfully. Total items: ${this.items.length}`);
    }





    /**
     * Add quest icon to a newly created item if a relevant quest is active
     */
    private addQuestIconToNewItem(item: Item, itemType: string): void {
        try {
            if (!this.questSystem) {
                console.log(`Quest system not yet initialized, skipping quest icon for ${itemType}`);
                return;
            }

            const activeQuests = this.questSystem.getActiveQuests();
            console.log(`Checking quest icons for ${itemType}, active quests:`, Array.from(activeQuests.keys()));
            const itemTypeLower = itemType.toLowerCase();

            // Check if any active quest requires this item type
            for (const [questId, questProgress] of activeQuests) {
                if (questProgress.isCompleted) continue;

                const questData = this.cache.json.get(`quest-${questId}`);
                if (!questData) continue;

                const questRequirement = questData.questdata.type.toLowerCase();

                // Check if this item matches the quest requirement
                if (questRequirement === itemTypeLower || 
                    (questRequirement.includes('nepian') && itemTypeLower.includes('nepian')) ||
                    (questRequirement.includes('heart') && itemTypeLower.includes('heart'))) {
                    
                    // Check if quest icon already exists
                    if (item.getData('questIcon')) {
                        console.log(`Quest icon already exists for ${itemType}, skipping quest ${questId}`);
                        break;
                    }
                    
                    console.log(`Adding quest icon for new ${itemType} - quest ${questId} is active`);
                    
                    // Add quest icon with sparkle animation
                    const questIcon = this.add.sprite(item.x, item.y - 25, 'quest-icon');
                    questIcon.setScale(1.0); // Larger, more visible quest icon
                    questIcon.setDepth(150); // Above the item
                    
                    // Check if animation exists before playing
                    if (questIcon.anims.exists('quest-icon-bounce')) {
                        questIcon.anims.play('quest-icon-bounce', true); // Use bounce animation for sparkle effect
                    }
                    
                    // Add sparkle animation to the herb itself
                    this.addSparkleAnimationToItem(item);
                    
                    // Store reference to quest icon for cleanup
                    item.setData('questIcon', questIcon);
                    
                    console.log(`✓ Added quest icon and sparkle to new ${itemType} - quest ${questId} is active`);
                    break; // Only add one quest icon per item
                }
            }
        } catch (error) {
            console.error('Error adding quest icon to new item:', error);
        }
    }

    /**
     * Add quest icons to existing items after quest system is initialized
     */
    private addQuestIconsToExistingItems(): void {
        try {
            if (!this.questSystem) {
                console.warn('Quest system not available for adding quest icons');
                return;
            }

            // Clean up any existing quest icons to start fresh
            this.cleanupAllQuestIcons();
            
            // Add quest icons to existing items if relevant quests are active
            this.items.forEach((item) => {
                try {
                    if (item && item.active) {
                        const itemType = item.getItemType();
                        this.addQuestIconToNewItem(item, itemType);
                    }
                } catch (error) {
                    console.error('Error adding quest icon to item:', error);
                }
            });

            // Add quest icons to existing enemies
            this.enemies.forEach(enemy => {
                try {
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
                } catch (error) {
                    console.error('Error adding quest icon to enemy:', error);
                }
            });
        } catch (error) {
            console.error('Error in addQuestIconsToExistingItems:', error);
        }
    }

    /**
     * Clean up all existing quest icons to start fresh
     */
    private cleanupAllQuestIcons(): void {
        // Clean up quest icons from all items
        this.items.forEach(item => {
            if (item && item.active) {
                const questIcon = item.getData('questIcon');
                if (questIcon) {
                    questIcon.destroy();
                    item.setData('questIcon', null);
                }
                
                // Clean up sparkle animations
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
            }
        });
        
        // Clean up quest icons from all enemies
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                const questIcon = enemy.getData('questIcon');
                if (questIcon) {
                    questIcon.destroy();
                    enemy.setData('questIcon', null);
                }
            }
        });
        
        console.log('✓ Cleaned up all existing quest icons');
    }

    // Removed old addQuestIconToItem method - replaced with addQuestIconToNewItem to prevent multiple icons

    /**
     * Add sparkle animation to an item (herbs, etc.)
     */
    private addSparkleAnimationToItem(item: Item): void {
        try {
            if (!item || !item.active) {
                return;
            }

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
        } catch (error) {
            console.error('Error adding sparkle animation to item:', error);
        }
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
        
        // Prevent duplicate quest completion processing
        const questId = questData.id;
        if (this.processedQuestCompletions && this.processedQuestCompletions.has(questId)) {
            console.log(`Quest ${questId} already processed, skipping duplicate completion`);
            return;
        }
        
        // Initialize processed quest completions set if it doesn't exist
        if (!this.processedQuestCompletions) {
            this.processedQuestCompletions = new Set();
        }
        
        // Mark this quest as processed
        this.processedQuestCompletions.add(questId);
        
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
                        sparkleTween.stop();
                        sparkleTween.destroy();
                        item.setData('sparkleTween', null);
                    }
                    if (glowTween) {
                        glowTween.stop();
                        glowTween.destroy();
                        item.setData('glowTween', null);
                    }
                    
                    // Reset item scale and alpha to original values
                    item.setScale(0.8);
                    item.setAlpha(1.0);
                    
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
    private collectItem(item: Item | LongSword): void {
        try {
            console.log(`collectItem called for: ${item.getItemType()}, Active: ${item.active}, Visible: ${item.visible}`);
            
            // Check if item is already being collected to prevent duplicates
            if (item.getData('isBeingCollected')) {
                console.log(`Item ${item.getItemType()} is already being collected, skipping duplicate`);
                return;
            }
            
            // Mark item as being collected
            item.setData('isBeingCollected', true);
            
            // Check if item is a weapon
            if (item instanceof LongSword) {
                console.log(`Item is LongSword, calling collectWeapon`);
                this.collectWeapon(item);
            } else {
                console.log(`Item is regular item, calling collectRegularItem`);
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
                // Emit item collected event for quest system
                this.events.emit('itemCollected', itemType, 1);
                
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
                    sparkleTween.stop();
                    sparkleTween.destroy();
                    item.setData('sparkleTween', null);
                }
                if (glowTween) {
                    glowTween.stop();
                    glowTween.destroy();
                    item.setData('glowTween', null);
                }
                
                // Play collection sound
                item.collect();
                
                // Handle respawnable items differently
                if (item.getData('isRespawnable')) {
                    // Set collected time for respawn system
                    item.setData('collectedTime', Date.now());
                    // Hide the item instead of destroying it
                    item.setVisible(false);
                    item.setActive(false);
                    // Don't remove from items array - let respawn system handle it
                } else {
                    // Remove non-respawnable items from items array
                    const index = this.items.indexOf(item);
                    if (index > -1) {
                        this.items.splice(index, 1);
                    }
                    // Destroy the item to prevent further interactions
                    item.destroy();
                }
                
                console.log(`Collected ${itemType}`);
            } else {
                console.log(`Inventory full, cannot collect ${itemType}`);
            }
        }
    }

    /**
     * Handles collection of weapons
     */
    private collectWeapon(weapon: LongSword): void {
        console.log(`Attempting to collect weapon: ${weapon.getItemType()} (ID: ${weapon.getData('swordId')})`);
        
        if (this.player && this.player.p1Inventory) {
            // Add weapon to inventory as a regular item
            const added = this.player.p1Inventory.addItem(weapon.getItemType(), 1);
            
            if (added) {
                console.log(`✓ Weapon added to inventory successfully`);
                
                // Update quest progress when weapon is collected
                if (this.questSystem) {
                    this.questSystem.updateQuestProgress('weapon', 1);
                }
                
                // Play collection sound
                weapon.collect();
                
                // Hide weapon immediately
                weapon.setVisible(false);
                
                // Remove from items array
                const index = this.items.indexOf(weapon);
                if (index > -1) {
                    this.items.splice(index, 1);
                    console.log(`✓ Weapon removed from items array at index ${index}`);
                }
                
                // Destroy the weapon to prevent further interactions
                console.log(`Destroying weapon - Active: ${weapon.active}, Visible: ${weapon.visible}`);
                weapon.destroy();
                console.log(`✓ Weapon destroyed - Active: ${weapon.active}, Visible: ${weapon.visible}`);
                
                // Check if sword is still in the scene
                const remainingSwords = this.children.list.filter(child => child instanceof LongSword);
                console.log(`Remaining swords in scene after destruction: ${remainingSwords.length}`);
                
                console.log(`✓ Collected ${weapon.getItemType()}`);
            } else {
                console.log(`✗ Inventory full, cannot collect weapon.`);
            }
        } else {
            console.log(`✗ Player or inventory not available`);
        }
    }


    /**
     * Setup camera zoom controls for testing
     */
    private setupCameraZoomControls(): void {
        if (!this.input.keyboard) return;

        // Zoom in with + key
        this.input.keyboard.on('keydown-PLUS', () => {
            const currentZoom = this.cameras.main.zoom;
            const newZoom = Math.min(currentZoom + 0.1, 3.0); // Max zoom 3x
            this.cameras.main.setZoom(newZoom);
            console.log(`Camera zoom: ${newZoom.toFixed(1)}x`);
        });

        // Zoom out with - key
        this.input.keyboard.on('keydown-MINUS', () => {
            const currentZoom = this.cameras.main.zoom;
            const newZoom = Math.max(currentZoom - 0.1, 0.5); // Min zoom 0.5x
            this.cameras.main.setZoom(newZoom);
            console.log(`Camera zoom: ${newZoom.toFixed(1)}x`);
        });

        // Reset zoom with 0 key
        this.input.keyboard.on('keydown-ZERO', () => {
            this.cameras.main.setZoom(1.0);
            console.log('Camera zoom reset to 1.0x');
        });
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

            // Tree of Life removed - all trees now come from tilemap object layers
        } catch (error) {
            console.error('Error creating trees:', error);
        }
    }


    /**
     * Create items from tilemap spawn points
     */
    private createItemFromSpawnPoint(element: any): void {
        console.log('=== CREATING ITEM FROM SPAWN POINT ===');
        console.log('Element name:', element.name);
        console.log('Element position:', element.x, element.y);
        
        if (element.name === 'bush_1') {
            console.log('Creating dimensional herb from bush_1 spawn point');
            // Create dimensional herb from bush_1 spawn point
            const herb = new Item(this, element.x as number, element.y as number, 'dimensional-herb', { 
                sound: 'collect-herb', 
                volume: 0.5 
            });
            
            herb.setScale(0.8).setSize(32, 32).setOffset(0, 0);
            herb.setVisible(true);
            herb.setDepth(100);
            
            // Quest icons will be added when quests start via event listener
            
            // Add respawn capability
            herb.setData('respawnTime', 30000); // 30 seconds
            herb.setData('originalType', 'dimensional herb');
            herb.setData('spawnPoint', { x: element.x, y: element.y });
            herb.setData('isRespawnable', true);
            
            this.items.push(herb);
            
            // Add quest icon if quest 1 is active (dimensional herb quest)
            this.addQuestIconToNewItem(herb, 'dimensional herb');
            
            // Herb pickup now handled by proximity-based mouse pickup system
            
            // Herbs don't bounce - only player-dropped items bounce
            
            console.log(`Created dimensional herb from tilemap at (${element.x}, ${element.y})`);
        } else if (element.name === 'sword_spawn') {
            // Create sword from sword_spawn spawn point
            const sword = new LongSword(this, element.x as number, element.y as number);
            
            // Set sword properties - proper scale for world display
            sword.setScale(0.4).setSize(40, 60).setOffset(-10, -10);
            sword.setVisible(true);
            sword.setDepth(1000); // Very high depth to ensure visibility
            sword.setAlpha(1.0);
            sword.clearTint();
            sword.setData('isRespawnable', false); // Sword is not respawnable - one-time pickup
            
            // Add unique identifier for debugging
            sword.setData('swordId', `sword_${Date.now()}`);
            
            this.items.push(sword);
            
            // Sword pickup now handled by proximity-based mouse pickup system
            
            console.log(`Created sword from tilemap at (${element.x}, ${element.y})`);
        }
    }

    /**
     * Create a weapon spawn point near Narvark for testing
     */

    private setupMinimap(): void {
        console.log('=== SETTING UP MINIMAP ===');
        const minimapSize = 120; // Smaller minimap for reduced canvas size
        const minimapX = 15;
        const minimapY = 15;
 
        // Create circular minimap camera
        this.miniMapCamera = this.cameras.add(minimapX, minimapY, minimapSize, minimapSize);
        console.log('Minimap camera created:', this.miniMapCamera);
        
        // Safety check for tilemap dimensions
        if (this.tilemap && this.tilemap.widthInPixels && this.tilemap.heightInPixels) {
            this.miniMapCamera.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
            console.log(`✓ Minimap bounds set: ${this.tilemap.widthInPixels}x${this.tilemap.heightInPixels}`);
        } else {
            console.error('❌ Tilemap dimensions not available for minimap setup');
            this.miniMapCamera.setBounds(0, 0, 1600, 1200);
        }
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
        console.log('Minimap mask created');

        // Create medieval-themed minimap ring with ornate compass design
        const minimapRing = this.createMedievalMinimapRing(minimapX, minimapY, minimapSize);
        minimapRing.setScrollFactor(0).setDepth(1000); // Fix the ring in place on the screen
        this.miniMapCamera.ignore(minimapRing);
        console.log('Minimap ring created:', minimapRing);

        console.log('Minimap ring created successfully');

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

        // Clear previous debug text and graphics
        this.debugManager.clearDebugText();
        this.debugManager.clearDebugGraphics();

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

        // Draw collision objects from collision layer
        let collisionObjectCount = 0;
        
        this.children.list.forEach(child => {
            if (child.getData('collisionObject') === true) {
                const isCircle = child.getData('isCircle');
                const radius = child.getData('radius');
                
                if (isCircle && radius) {
                    // Draw circle collision using original object data
                    const originalX = child.getData('originalX');
                    const originalY = child.getData('originalY');
                    const originalWidth = child.getData('originalWidth');
                    const originalHeight = child.getData('originalHeight');
                    
                    if (originalX !== undefined && originalY !== undefined) {
                        const centerX = originalX + originalWidth / 2;
                        const centerY = originalY + originalHeight / 2;
                        this.debugManager.drawCircleCollision(centerX, centerY, radius, 0xffff00);
                    }
                } else {
                    // Draw rectangle collision using original object data
                    const originalX = child.getData('originalX');
                    const originalY = child.getData('originalY');
                    const originalWidth = child.getData('originalWidth');
                    const originalHeight = child.getData('originalHeight');
                    
                    if (originalX !== undefined && originalY !== undefined && originalWidth !== undefined && originalHeight !== undefined) {
                        // Draw rectangle outline
                        this.debugManager.drawRectangleCollision(originalX, originalY, originalWidth, originalHeight, 0xffff00);
                        
                        // Draw vector points at corners
                        this.debugManager.drawVectorPoints(originalX, originalY, originalWidth, originalHeight, 0xffff00);
                    }
                }
                
                collisionObjectCount++;
            }
        });

        // Add debug info for collision objects
        if (collisionObjectCount > 0) {
            this.debugManager.addInfoText(10, 200, `Collision Objects: ${collisionObjectCount}`, 0xffff00);
        }

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
        // Get all collision objects that were created in setupCollisionObjects()
        const collisionObjects = this.children.list.filter(child => 
            child.getData('collisionObject') === true
        );
        
        if (collisionObjects.length > 0) {
            console.log(`✓ Found ${collisionObjects.length} collision objects for collision setup`);
            
            // Set up collision between player and collision objects
            this.physics.add.collider(this.player, collisionObjects);
            
            // Set up collision between enemies and collision objects
            this.enemies.forEach(enemy => {
                this.physics.add.collider(enemy, collisionObjects);
            });
            
            // Set up collision between NPCs and collision objects
            this.npcs.forEach(npc => {
                this.physics.add.collider(npc, collisionObjects);
            });
            
            console.log('✓ Object-based collision system set up');
        } else {
            console.warn('❌ No collision objects found for collision setup');
        }

        // Player collision with trees
        this.physics.add.collider(this.player, this.trees);

        // Player collision with tilemap layers (water, mines, walls, rocks, building walls)
        const tilemapLayers = [
            this.tilemap.getLayer('Walls'),
            this.tilemap.getLayer('Rocks'),
            this.tilemap.getLayer('Mines'),
            this.tilemap.getLayer('Building walls'),
            this.tilemap.getLayer('Building roofs'),
            this.tilemap.getLayer('Building props')
        ];
        
        tilemapLayers.forEach(layer => {
            if (layer && layer.tilemapLayer) {
                // Set collision for non-zero tiles
                layer.tilemapLayer.setCollisionByExclusion([-1, 0]);
                this.physics.add.collider(this.player, layer.tilemapLayer);
                console.log(`✓ Player collision with ${layer.name} layer set up`);
            }
        });

        // Enemy collision with trees
        this.enemies.forEach(enemy => {
            this.physics.add.collider(enemy, this.trees);
        });

        // Enemy collision with tilemap layers
        this.enemies.forEach(enemy => {
            tilemapLayers.forEach(layer => {
                if (layer && layer.tilemapLayer) {
                    this.physics.add.collider(enemy, layer.tilemapLayer);
                }
            });
        });

        // Enemy collision with player
        this.enemies.forEach(enemy => {
            this.physics.add.collider(enemy, this.player);
        });

        // NPC collision with trees
        this.npcs.forEach(npc => {
            this.physics.add.collider(npc, this.trees);
        });

        // NPC collision with tilemap layers
        this.npcs.forEach(npc => {
            tilemapLayers.forEach(layer => {
                if (layer && layer.tilemapLayer) {
                    this.physics.add.collider(npc, layer.tilemapLayer);
                }
            });
        });

        // NPC collision with player
        this.npcs.forEach(npc => {
            this.physics.add.collider(npc, this.player);
        });

        // Item collection - now handled by proximity-based mouse pickup system
        // Old click handlers removed to prevent pickup without proximity check
    }

    private loadSaveData(): void {
        try {
            const saveData = SaveSystem.loadGame();
            if (saveData) {
                SaveSystem.applySaveData(this, saveData);
            }
        } catch (error) {
            console.error('Error loading save data:', error);
            // Clear corrupted save data and continue with new game
            SaveSystem.clearCorruptedSaveData();
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
                if (respawnData.type === 'dimensional herb') {
                    this.createHerbSpawnPoint(respawnData.spawnPoint.x, respawnData.spawnPoint.y, respawnData.type);
                } else if (respawnData.type === 'fruit') {
                    // Fruit respawn removed - all items now come from tilemap object layers
                    console.log('Fruit respawn skipped - using tilemap object layers');
                }
            } catch (error) {
                console.error('Error respawning item:', error);
            }
        });
    }


    private setupInteractionControls(): void {
        // Setup E key for interaction and proximity pickup
        this.input.keyboard?.on('keydown-E', () => {
            // Check for NPC interaction first
            if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                this.questGiverNPC.interact();
            } else {
                // If no NPC interaction, do proximity pickup of all items in range
                this.handleProximityPickupAll();
            }
        });

        // Setup F key as alternative interaction - DISABLED per user request
        // this.input.keyboard?.on('keydown-F', () => {
        //     if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
        //         this.questGiverNPC.interact();
        //     }
        // });

        // Setup mouse click interaction
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Check for NPC interaction first
            if (this.questGiverNPC && this.questGiverNPC.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                // Check if click is near NPC
                const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.questGiverNPC.x, this.questGiverNPC.y);
                if (distance < 50) {
                    this.questGiverNPC.interact();
                    return; // Exit early if NPC interaction occurred
                }
            }
            
            // Check for item pickup on hovered item within E key range (80 pixels)
            this.handleItemPickupOnHover(pointer);
        });

        // Setup T key to force reset debug mode (in case time gets stuck)
        this.input.keyboard?.on('keydown-T', () => {
            if (this.dayNightCycle) {
                this.dayNightCycle.forceResetDebugMode();
            }
        });

    }

    /**
     * Handle E key proximity pickup - grabs all items within range
     */
    private handleProximityPickupAll(): void {
        if (!this.player) return;

        const itemsInRange = this.items.filter(item => 
            item && item.active && item.visible && this.isItemInPickupRange(item)
        );

        if (itemsInRange.length > 0) {
            console.log(`E key proximity pickup: Collecting ${itemsInRange.length} items`);
            itemsInRange.forEach(item => {
                this.collectItem(item);
            });
        }
    }

    /**
     * Handle item pickup when clicking on hovered items within E key range
     */
    private handleItemPickupOnHover(pointer: Phaser.Input.Pointer): void {
        if (!this.player) return;

        // Find the item that the mouse is hovering over
        const hoveredItem = this.findHoveredItem(pointer.worldX, pointer.worldY);
        
        if (hoveredItem && this.isItemInPickupRange(hoveredItem)) {
            console.log(`Mouse pickup: Collecting ${hoveredItem.getItemType()} at distance ${this.getDistanceToItem(hoveredItem)}`);
            this.collectItem(hoveredItem);
        }
    }

    /**
     * Find the item that the mouse is hovering over (within a small tolerance)
     */
    private findHoveredItem(clickX: number, clickY: number): Item | null {
        const hoverTolerance = 20; // Small tolerance for hovering detection
        
        for (const item of this.items) {
            if (item && item.active && item.visible) {
                const distance = Phaser.Math.Distance.Between(clickX, clickY, item.x, item.y);
                if (distance <= hoverTolerance) {
                    return item;
                }
            }
        }
        
        return null;
    }

    /**
     * Check if an item is within pickup range (same as E key range - 80 pixels)
     */
    private isItemInPickupRange(item: Item): boolean {
        if (!this.player) return false;
        return this.getDistanceToItem(item) <= 80; // Same range as NPC E key interaction
    }

    /**
     * Get distance from player to an item
     */
    private getDistanceToItem(item: Item): number {
        if (!this.player) return Infinity;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
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
                }
            });


        } catch (error) {
            console.error('Error in game fade in:', error);
        }
    }

    /**
     * Clean up resources when scene is destroyed
     */
    shutdown(): void {
        this.performCleanup();
    }

    /**
     * Clean up resources when scene is destroyed (called by both shutdown and destroy)
     */
    destroy(): void {
        this.performCleanup();
    }

    /**
     * Centralized cleanup method to prevent resource leaks
     */
    private performCleanup(): void {
        try {
            // Clean up pause menu
            if (this.pauseMenu) {
                try {
                    this.pauseMenu.destroy();
                } catch (error) {
                    console.error('Error destroying pause menu:', error);
                }
                this.pauseMenu = undefined as any;
            }

            // Clean up game object arrays to prevent stale references
            this.enemies.forEach(enemy => {
                try {
                    if (enemy && enemy.destroy) {
                        enemy.destroy();
                    }
                } catch (error) {
                    console.error('Error destroying enemy:', error);
                }
            });
            this.enemies = [];

            this.npcs.forEach(npc => {
                try {
                    if (npc && npc.destroy) {
                        npc.destroy();
                    }
                } catch (error) {
                    console.error('Error destroying NPC:', error);
                }
            });
            this.npcs = [];

            this.items.forEach(item => {
                try {
                    if (item && item.destroy) {
                        item.destroy();
                    }
                } catch (error) {
                    console.error('Error destroying item:', error);
                }
            });
            this.items = [];

            this.trees.forEach(tree => {
                try {
                    if (tree && tree.destroy) {
                        tree.destroy();
                    }
                } catch (error) {
                    console.error('Error destroying tree:', error);
                }
            });
            this.trees = [];

            // Clean up keyboard event listeners to prevent accumulation
            if (this.input.keyboard) {
                try {
                    this.input.keyboard.removeAllListeners();
                } catch (error) {
                    console.error('Error removing keyboard listeners:', error);
                }
            }

            // Clean up input event listeners
            try {
                this.input.removeAllListeners();
            } catch (error) {
                console.error('Error removing input listeners:', error);
            }

            // Clean up scene event listeners
            try {
                this.events.removeAllListeners();
            } catch (error) {
                console.error('Error removing scene event listeners:', error);
            }

            // Stop all tweens
            try {
                this.tweens.killAll();
            } catch (error) {
                console.error('Error killing tweens:', error);
            }

            // Stop all timers
            try {
                this.time.removeAllEvents();
            } catch (error) {
                console.error('Error removing timers:', error);
            }

            // Stop music manager with fade out
            if (this.musicManager) {
                try {
                    this.musicManager.stopPlaylist();
                } catch (error) {
                    console.error('Error stopping music playlist:', error);
                }
            }

            // Clean up day/night cycle
            if (this.dayNightCycle) {
                try {
                    this.dayNightCycle.destroy();
                } catch (error) {
                    console.error('Error destroying day/night cycle:', error);
                }
            }

            // Clean up other UI components
            if (this.inventoryUI) {
                try {
                    this.inventoryUI.destroy();
                } catch (error) {
                    console.error('Error destroying inventory UI:', error);
                }
            }

            // QuestUI cleanup handled by Phaser automatically

            if (this.characterGearUI) {
                try {
                    this.characterGearUI.destroy();
                } catch (error) {
                    console.error('Error destroying character gear UI:', error);
                }
            }

            if (this.dialogueUI) {
                try {
                    this.dialogueUI.destroy();
                } catch (error) {
                    console.error('Error destroying dialogue UI:', error);
                }
            }

            // Clean up debug manager
            if (this.debugManager) {
                try {
                    this.debugManager.destroy();
                } catch (error) {
                    console.error('Error destroying debug manager:', error);
                }
            }

            // Clean up physics bodies
            if (this.physics && this.physics.world) {
                try {
                    this.physics.world.destroy();
                } catch (error) {
                    console.error('Error destroying physics world:', error);
                }
            }
        } catch (error) {
            console.error('Error in performCleanup:', error);
        }
    }
}
