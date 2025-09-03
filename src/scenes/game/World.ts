import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { Ally } from '../../prefabs/Ally';
import { Item } from '../../prefabs/Item';
import { Tree } from '../../prefabs/Tree';
import { DebugManager } from '../../debug/DebugManager';
import { InventoryUI } from '../../ui/InventoryUI';
import { DayNightCycle } from '../../systems/DayNightCycle';
import { Lantern } from '../../systems/Lantern';
import { NPC } from '../../prefabs/NPC';
import { QuestSystem } from '../../systems/QuestSystem';
import { DialogueUI } from '../../ui/DialogueUI';
import { TreeLightEmission } from '../../systems/TreeLightEmission';
import { Pathfinding } from '../../systems/Pathfinding';
import { PauseMenu } from '../../ui/PauseMenu';
import { QuestUI } from '../../ui/QuestUI';
import { SaveSystem } from '../../systems/SaveSystem';
import { MusicManager } from '../../systems/MusicManager';

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
    private allies: Ally[] = [];
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
    private npc!: NPC;
    private questSystem!: QuestSystem;
    private dialogueUI!: DialogueUI;
    private treeLightEmission!: TreeLightEmission;
    private pathfinding!: Pathfinding;
    private pauseMenu!: PauseMenu;
    private questUI!: QuestUI;
    private musicManager!: MusicManager;

    constructor() {
        super('worldScene');
    }

    create(data: WorldData): void {
        try {

            // Create tilemap
            this.createTilemap();

            // player
            this.player = new Player(this, 500, 400, data.inv, data.qobj);

            // Day/Night Cycle
            this.dayNightCycle = new DayNightCycle(this, undefined);

            // Music Manager
            this.musicManager = new MusicManager(this);
            this.musicManager.reset();
            this.musicManager.startPlaylist();

            // Create game entities
            this.createEnemies();
            this.createAllies();
            this.createItems();
            this.createTrees();

            // camera ** do not change zoom level of main camera ** o7
            this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.cameras.main.startFollow(this.player);

            // minimap
            this.setupMinimap();

            // Setup debug manager
            console.log('Setting up debug manager...');
            this.debugManager = new DebugManager(this);
            console.log('Debug manager setup complete');

            // Setup inventory UI
            console.log('Setting up inventory UI...');
            this.inventoryUI = new InventoryUI(this);
            this.inventoryUI.setPlayer(this.player);
            console.log('Inventory UI setup complete');

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
                    console.log('🌅 Debug event (scene): Set to peak day');
                }
            });

            this.events.on('debug-setToPeakNight', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakNight();
                    console.log('🌙 Debug event (scene): Set to peak night');
                }
            });

            // Method 2: Global game events
            this.game.events.on('debug-setToPeakDay', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakDay();
                    console.log('🌅 Debug event (global): Set to peak day');
                }
            });

            this.game.events.on('debug-setToPeakNight', () => {
                if (this.dayNightCycle) {
                    this.dayNightCycle.setToPeakNight();
                    console.log('🌙 Debug event (global): Set to peak night');
                }
            });

            // Method 3: Registry change listener
            this.registry.events.on('changedata-debugCommand', (_parent: any, _key: string, data: any) => {
                if (data && this.dayNightCycle) {
                    if (data.type === 'setToPeakDay') {
                        this.dayNightCycle.setToPeakDay();
                        console.log('🌅 Debug event (registry): Set to peak day');
                    } else if (data.type === 'setToPeakNight') {
                        this.dayNightCycle.setToPeakNight();
                        console.log('🌙 Debug event (registry): Set to peak night');
                    }
                }
            });

            // Setup Lantern
            console.log('Setting up lantern...');
            this.lantern = new Lantern(this, this.player);
            this.player.lantern = this.lantern; // Connect lantern to player
            console.log('Lantern setup complete');

            // Setup Quest System and NPC
            console.log('Setting up quest system...');
            this.questSystem = new QuestSystem(this, this.player);
            this.data.set('questSystem', this.questSystem); // Store quest system in scene data

            // Create Narvark the quest giver NPC
            const narvarkAlly = this.allies.find(ally => ally.entity_type === 'Narvark');
            if (narvarkAlly) {
                this.npc = new NPC(this, narvarkAlly);
                this.npc.setPlayer(this.player);
                this.questSystem.setNPC(this.npc);
                this.data.set('npc', this.npc);
                console.log('Narvark NPC system initialized');
            } else {
                console.error('Narvark ally not found!');
            }

            // Setup Dialogue UI
            this.dialogueUI = new DialogueUI(this);

            // Setup interaction controls
            this.setupInteractionControls();

            // Setup Tree Light Emission
            console.log('Setting up tree light emission...');
            this.treeLightEmission = new TreeLightEmission(this);
            this.trees.forEach(tree => {
                this.treeLightEmission.addTreeLight(tree);
            });
            console.log('Tree light emission setup complete');

            // Setup Pathfinding System
            console.log('Setting up pathfinding system...');
            this.pathfinding = new Pathfinding(this);
            this.pathfinding.setObstacles(this.trees);
            console.log('Pathfinding system setup complete');

            // Setup Collision Detection
            console.log('Setting up collision detection...');
            this.setupCollisionDetection();
            console.log('Collision detection setup complete');

            // Setup Pause Menu
            console.log('Setting up pause menu...');
            this.pauseMenu = new PauseMenu(this);
            console.log('Pause menu setup complete');

            // Setup quest UI
            this.questUI = new QuestUI(this);
            console.log('Quest UI setup complete');

            let initialTime
            if (data.loadSaveData) {
                this.loadSaveData();
                const saveData = SaveSystem.loadGame();
                if (saveData && saveData.gameState) {
                    initialTime = saveData.gameState.currentTime;
                    console.log(`Found saved time in save data: ${initialTime}`);
                }
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

        // Update Lantern
        if (this.lantern) {
            this.lantern.update(delta);
        }

        // Update NPC
        if (this.npc) {
            this.npc.update();
        }

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
            // o7
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
                if (element.name === 'boss_spawn') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-1').setSize(12.5, 45).setOffset(9, 2.5).anims.play('boss-1-idle-anim') as Enemy)
                } else if (element.name === 'enemy_spawn') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-1-anim').setScale(1.25).anims.play('enemy-idle-anim') as Enemy)
                } else if (element.name === 'enemy_spawn_2') {
                    this.enemies.push(new Enemy(this, element.x as number, element.y as number, 'enemy-2-anim').setScale(1.25).anims.play('enemy2-idle-anim') as Enemy)
                }
            })
        }

    }

    private createAllies(): void {
        try {
            console.log('Creating quest giver Narvark near spawn...');
            const npc1Spawn = this.tilemap.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
            if (!npc1Spawn) {
                console.error('NPC spawn point not found in tilemap!');
                return;
            }
            const questGiver = new Ally(this, npc1Spawn.x as number, npc1Spawn.y as number,).setScale(1.5);
            questGiver.entity_type = 'Narvark'; // Name the quest giver

            // Set Narvark as static (no movement, no interaction detection)
            questGiver.setStatic(true);

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
            // Create collectible items from tilemap object layer
            // Uses named objects like 'bush_1' to spawn herb items
            // Positions are set visually in Tiled Map Editor
            if (this.objlayer) {
                this.objlayer.objects.forEach(element => {
                    if (element.name === 'bush_1') {
                        const bush = new Item(this, element.x as number, element.y as number, 'mysterious herb', { sound: 'collect-herb', volume: 0.5 })
                        bush.setScale(0.75).setSize(35, 30).anims.play('bush-1-anim')
                        this.items.push(bush)
                    }
                })
            }

        } catch (error) {
            console.error('Error creating items:', error);
        }
    }

    private createTrees(): void {
        try {
            // Create environmental trees from tilemap object layer
            // Uses 'tree_1', 'tree_2' etc. objects placed in Tiled
            if (this.objlayer) {
                this.objlayer.objects.forEach(element => {
                    // if (element.name === 'pond') {
                    //     this.ponds.push(this.physics.add.sprite(element.x, element.y, 'water-pond', 0).setSize(22, 22).setScale(2.5).setImmovable(true).anims.play('water-moving', true))
                    if (element.name === 'tree_1') {
                        this.trees.push(new Tree(this, element.x as number, element.y as number, 'tree-1'));
                    } else if (element.name === 'tree_2') {
                        this.trees.push(new Tree(this, element.x as number, element.y as number, 'tree-2'));
                    } else if (element.name === 'tree_3') {
                        // TODO : logic for interacting with trees can be baked into tree prefab
                        // let x = this.physics.add.sprite(element.x, element.y, 'tree-3', 0).setSize(30, 2).setOffset(15, 62).setDepth(2).setScale(2.5).setImmovable(true).setInteractive().on('pointerdown', () => {
                        //     if (listen(this, x)) {
                        //         toggleCursor(this)
                        //         x.anims.play('tree-3-anim')
                        //         this.time.delayedCall(2000, () => {
                        //             let y = new Item(this, x.x, x.y, 'fruit', 0, 'fruit', true, true).setAlpha(0)
                        //             this.p1.windowOpen ? undefined : createLootInterfaceWindow(y, this)
                        //         })
                        //         x.input.enabled = false
                        //     }
                        // })
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
        console.log('Creating Tree of Life (Top Left)...');

        // Create the Tree of Life in the top left corner of the map
        const treeOfLife = new Tree(this, 350, 400, 'tree-2-second')
        treeOfLife.clearFruit()

        // Make it extra special - larger scale and unique properties
        treeOfLife.setScale(4); // Much larger than normal trees
        treeOfLife.setDepth(10); // Ensure it's visible above other objects

        // Create the title text
        this.createTreeOfLifeTitle(treeOfLife);
        // Add the tree to our trees array
        this.trees.push(treeOfLife);

        console.log('Tree of Life created successfully');
    }

    private createTreeOfLifeTitle(tree: Tree): void {
        // Create the main title
        const title = this.add.bitmapText(
            tree.x,
            tree.y - 120,
            '8-bit',
            'TREE OF LIFE',
            32
        ).setOrigin(0.5);

        title.setDepth(tree.depth + 2);
        title.setTint(0x00ff00); // Green color

        // Add a subtle glow effect to the title
        this.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Create a subtitle
        const subtitle = this.add.bitmapText(
            tree.x,
            tree.y - 90,
            '8-bit',
            'Ancient & Sacred',
            16
        ).setOrigin(0.5);

        subtitle.setDepth(tree.depth + 2);
        subtitle.setTint(0x90EE90); // Light green color

        // Add floating animation to the subtitle
        this.tweens.add({
            targets: subtitle,
            y: subtitle.y - 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private setupMinimap(): void {
        const minimapSize = 175;
        const minimapX = 20;
        const minimapY = 20;
 
        // Create circular minimap camera
        this.miniMapCamera = this.cameras.add(minimapX, minimapY, minimapSize, minimapSize);
        this.miniMapCamera.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
        this.miniMapCamera.setZoom(0.25);
        this.miniMapCamera.startFollow(this.player, true, 0.1, 0.1);

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
            inputKeys: this.getInputKeyStates(),
            // Day/Night Cycle Info
            timeOfDay: this.dayNightCycle ? this.dayNightCycle.getTimeOfDay() : 'Unknown',
            currentTime: this.dayNightCycle ? this.dayNightCycle.getCurrentTime() : 0,
            darknessIntensity: this.dayNightCycle ? this.dayNightCycle.getDarknessIntensity() : 0,
            lanternActive: this.lantern ? this.lantern.isLit() : false,
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

        // Ally collision with trees
        this.allies.forEach(ally => {
            this.physics.add.collider(ally, this.trees);
        });

        // Ally collision with player
        this.allies.forEach(ally => {
            this.physics.add.collider(ally, this.player);
        });

        console.log('Collision detection configured for all entities');
    }

    private loadSaveData(): void {
        const saveData = SaveSystem.loadGame();
        if (saveData) {
            console.log('Applying save data...');
            SaveSystem.applySaveData(this, saveData);
            console.log('Save data applied successfully');
        } else {
            console.log('No save data found or failed to load');
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

    // o7
    // private createQuestHerbs(): void {}

    private setupInteractionControls(): void {
        // Setup E key for interaction
        this.input.keyboard?.on('keydown-E', () => {
            if (this.npc && this.npc.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                this.npc.interact();
            }
        });

        // Setup F key as alternative interaction
        this.input.keyboard?.on('keydown-F', () => {
            if (this.npc && this.npc.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                this.npc.interact();
            }
        });

        // Setup mouse click interaction
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.npc && this.npc.isPlayerInRange() && !this.dialogueUI.isDialogueActive()) {
                // Check if click is near NPC
                const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.npc.ally.x, this.npc.ally.y);
                if (distance < 50) {
                    this.npc.interact();
                }
            }
        });

        console.log('Interaction controls setup complete');
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
                    console.log('Game fade in complete');
                }
            });

            console.log('Starting game fade in...');

        } catch (error) {
            console.error('Error in game fade in:', error);
        }
    }

    /**
     * Clean up resources when scene is destroyed
     */
    shutdown(): void {
        console.log('World scene shutting down...');

        // Stop music manager with fade out
        if (this.musicManager) {
            console.log('Stopping shuffle playlist...');
            this.musicManager.stopPlaylist();
        }

        // Clean up day/night cycle
        if (this.dayNightCycle) {
            this.dayNightCycle.destroy();
        }

        console.log('World scene cleanup complete');
    }
}
