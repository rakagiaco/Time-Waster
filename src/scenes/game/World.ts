import Phaser from 'phaser';
import { Player } from '../../prefabs/Player';
import { Enemy } from '../../prefabs/Enemy';
import { Ally } from '../../prefabs/Ally';
import { Item } from '../../prefabs/Item';
import { Tree } from '../../prefabs/Tree';
import { DebugManager } from '../../debug/DebugManager';
import { InventoryUI } from '../../ui/InventoryUI';
import { DayNightCycle } from '../../systems/DayNightCycle';
import { Flashlight } from '../../systems/Flashlight';
import { TreeLightEmission } from '../../systems/TreeLightEmission';
import { Pathfinding } from '../../systems/Pathfinding';
import { PauseMenu } from '../../ui/PauseMenu';
import { SaveSystem } from '../../systems/SaveSystem';


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
    // private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
    private objlayer!: Phaser.Tilemaps.ObjectLayer | null

    private miniMapCamera!: Phaser.Cameras.Scene2D.Camera;
    private minimapMask!: Phaser.GameObjects.Graphics;
    private debugManager!: DebugManager;
    private inventoryUI!: InventoryUI;

    // Day/Night and Lighting Systems
    private dayNightCycle!: DayNightCycle;
    private flashlight!: Flashlight;
    private treeLightEmission!: TreeLightEmission;
    private pathfinding!: Pathfinding;
    private pauseMenu!: PauseMenu;

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

            // Load save data if requested
            if (data.loadSaveData) {
                console.log('Loading save data...');
                this.loadSaveData();
            }

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

            // Setup camera
            console.log('Setting up camera...');
            this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
            this.cameras.main.startFollow(this.player);
            // absolutely under no circumstances should we change the zoom level of the main camera
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
            this.inventoryUI.setPlayer(this.player);
            console.log('Inventory UI setup complete');

            // Setup custom cursor
            console.log('Setting up custom cursor...');
            this.input.setDefaultCursor('url(/img/cursor.png), pointer');
            console.log('Custom cursor setup complete');

            // Setup Day/Night Cycle
            console.log('Setting up day/night cycle...');
            this.dayNightCycle = new DayNightCycle(this);

            // Listen for day/night changes
            this.events.on('dayNightChange', (data: { isDay: boolean; isTransitioning: boolean }) => {
                if (this.flashlight) {
                    if (data.isDay) {
                        this.flashlight.deactivate();
                    } else {
                        this.flashlight.activate();
                    }
                }

                if (this.treeLightEmission) {
                    if (data.isDay) {
                        this.treeLightEmission.deactivate();
                    } else {
                        this.treeLightEmission.activate();
                    }
                }
            });

            console.log('Day/night cycle setup complete');

            // Setup Flashlight
            console.log('Setting up flashlight...');
            this.flashlight = new Flashlight(this, this.player);
            this.player.flashlight = this.flashlight; // Connect flashlight to player
            console.log('Flashlight setup complete');

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
        const delta = this.game.loop.delta;

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

        // Update Day/Night Cycle
        if (this.dayNightCycle) {
            this.dayNightCycle.update(delta);
        }

        // Update Flashlight
        if (this.flashlight) {
            this.flashlight.update(delta);
        }

        // Update Tree Light Emission
        if (this.treeLightEmission) {
            this.treeLightEmission.update(delta);
        }

        // Update minimap to follow player

        // Update debug manager
        if (this.debugManager) {
            this.updateDebugInfo();
            this.debugManager.update();
        }

        // Inventory UI doesn't need update calls - it's event-driven
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

    // no clankers allowed in this function please
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

    }

    private createAllies(): void {
        try {
            console.log('Creating quest giver Narvark near spawn...');
            // Create quest giver near spawn point (500, 400) with slight offset
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
            console.log('Creating biome-specific items...');
            // for now all there is are herbs

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
        this.minimapMask.fillStyle(0xffffff, 0); // Transparent mask
        this.minimapMask.fillCircle(minimapX + minimapSize / 2, minimapY + minimapSize / 2, minimapSize / 2);

        const minimapRing = this.add.graphics().lineStyle(5, 0x000000, 1); // thickness=4, black color, full alpha
        minimapRing.strokeCircle(minimapX + minimapSize / 2, minimapY + minimapSize / 2, (minimapSize / 2) + 5)
        minimapRing.setScrollFactor(0).setDepth(1000) // Fix the ring in place on the screen
        this.miniMapCamera.ignore(minimapRing)

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
            flashlightActive: this.flashlight ? this.flashlight.isLightActive() : false,
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

    public getPauseMenu(): PauseMenu {
        return this.pauseMenu;
    }

    public getInventoryUI(): InventoryUI {
        return this.inventoryUI;
    }
}
