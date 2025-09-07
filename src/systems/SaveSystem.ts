import { Player } from '../prefabs/Player';
import { Enemy } from '../prefabs/Enemy';
import { Tree } from '../prefabs/Tree';
import { Item } from '../prefabs/Item';

export interface SaveData {
    player: {
        x: number;
        y: number;
        health: number;
        maxHealth: number;
        inventory: [string, number][];
        questStatus: any;
        gearSlots: {
            weapon: {
                itemType: string | null;
                count: number;
                equipped: boolean;
            };
            armor: {
                itemType: string | null;
                count: number;
                equipped: boolean;
            };
            accessory: {
                itemType: string | null;
                count: number;
                equipped: boolean;
            };
        };
    };
    enemies: Array<{
        x: number;
        y: number;
        health: number;
        maxHealth: number;
        entity_type: string;
        isDead: boolean;
        nightStatsApplied: boolean;
    }>;
    trees: Array<{
        x: number;
        y: number;
        treeType: string;
        hasFruit: boolean;
        fruitItems: Array<{
            x: number;
            y: number;
            itemType: string;
        }>;
    }>;
    items: Array<{
        x: number;
        y: number;
        itemType: string;
    }>;
    gameState: {
        timeOfDay: string;
        currentTime: number;
        darknessIntensity: number;
        enemiesEnhanced: number;
        lanternActive: boolean;
        treeLightActive: boolean;
        playerStamina: boolean;
        attackLightCooldown: boolean;
        attackHeavyCooldown: boolean;
        cameraX: number;
        cameraY: number;
    };
    metadata: {
        saveDate: number;
        playTime: number;
        version: string;
    };
}

export class SaveSystem {
    private static readonly SAVE_KEY = 'time-waster-save';
    private static readonly VERSION = '1.0.0';

    public static saveGame(
        player: Player, 
        enemies: Enemy[], 
        trees: Tree[], 
        items: Item[], 
        gameState: any,
        gearSlotState?: any,
        scene?: any
    ): boolean {
        try {
            const saveData: SaveData = {
                player: {
                    x: player.x,
                    y: player.y,
                    health: player.getHealth(),
                    maxHealth: player.getMaxHealth(),
                    inventory: player.p1Inventory.getInventoryData(),
                    questStatus: player.questStatus,
                    gearSlots: gearSlotState || {
                        weapon: { itemType: null, count: 0, equipped: false },
                        armor: { itemType: null, count: 0, equipped: false },
                        accessory: { itemType: null, count: 0, equipped: false }
                    }
                },
                enemies: enemies.map(enemy => ({
                    x: enemy.x,
                    y: enemy.y,
                    health: enemy.getHealth(),
                    maxHealth: enemy.getMaxHealth(),
                    entity_type: enemy.entity_type,
                    isDead: enemy.isDead(),
                    nightStatsApplied: (enemy as any).nightStatsApplied || false
                })),
                trees: trees.map(tree => ({
                    x: tree.x,
                    y: tree.y,
                    treeType: tree.getTreeType(),
                    hasFruit: tree.hasFruitAvailable(),
                    fruitItems: (tree as any).fruitItems?.map((fruit: Item) => ({
                        x: fruit.x,
                        y: fruit.y,
                        itemType: fruit.getItemType()
                    })) || []
                })),
                items: items.filter(item => {
                    const itemType = item.getItemType();
                    // Don't save swords - they should not persist between sessions
                    return itemType !== 'w_longsword';
                }).map(item => {
                    const itemType = item.getItemType();
                    console.log(`Saving item: ${itemType} at (${item.x}, ${item.y})`);
                    return {
                        x: item.x,
                        y: item.y,
                        itemType: itemType
                    };
                }),
                gameState: {
                    timeOfDay: gameState.timeOfDay || 'day',
                    currentTime: gameState.currentTime || 0.5,
                    darknessIntensity: gameState.darknessIntensity || 0,
                    enemiesEnhanced: gameState.enemiesEnhanced || 0,
                    lanternActive: gameState.lanternActive || false,
                    treeLightActive: gameState.treeLightActive || false,
                    playerStamina: gameState.playerStamina || false,
                    attackLightCooldown: gameState.attackLightCooldown || false,
                    attackHeavyCooldown: gameState.attackHeavyCooldown || false,
                    cameraX: gameState.cameraX || 0,
                    cameraY: gameState.cameraY || 0
                },
                metadata: {
                    saveDate: Date.now(),
                    playTime: this.getPlayTime(),
                    version: this.VERSION
                }
            };

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            
            // Save quest system state separately
            const questSystem = scene.data.get('questSystem');
            if (questSystem && questSystem.saveQuestState) {
                const questState = questSystem.saveQuestState();
                localStorage.setItem('quest_system_state', JSON.stringify(questState));
                console.log('QuestSystem: Quest state saved to localStorage');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    public static loadGame(): SaveData | null {
        try {
            const saveDataString = localStorage.getItem(this.SAVE_KEY);
            if (!saveDataString) {
                console.log('No save data found');
                return null;
            }

            const saveData: SaveData = JSON.parse(saveDataString);
            
            // Check version compatibility
            if (saveData.metadata.version !== this.VERSION) {
                console.warn('Save data version mismatch, may cause issues');
            }

            console.log('Game loaded successfully');
            console.log('Save data items:', saveData.items);
            
            // Validate save data integrity
            if (!this.validateSaveData(saveData)) {
                console.warn('Save data validation failed, returning null');
                return null;
            }
            
            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    public static hasSaveData(): boolean {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    public static deleteSaveData(): boolean {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save data:', error);
            return false;
        }
    }

    public static clearCorruptedSaveData(): boolean {
        try {
            const saveData = this.loadGame();
            if (saveData && !this.validateSaveData(saveData)) {
                console.log('Clearing corrupted save data...');
                return this.deleteSaveData();
            }
            return false;
        } catch (error) {
            console.error('Failed to clear corrupted save data:', error);
            return false;
        }
    }

    public static forceClearSaveData(): boolean {
        console.log('Force clearing all save data...');
        return this.deleteSaveData();
    }

    public static clearAllGameData(): boolean {
        try {
            console.log('=== CLEARING ALL GAME DATA ===');
            console.log('Before clearing - localStorage keys:', Object.keys(localStorage));
            localStorage.removeItem(this.SAVE_KEY);
            localStorage.removeItem('existing_inv');
            localStorage.removeItem('existing_quest');
            localStorage.removeItem('quest_system_state');
            console.log('After clearing - localStorage keys:', Object.keys(localStorage));
            console.log('All game data cleared from localStorage');
            console.log('=== END CLEARING GAME DATA ===');
            return true;
        } catch (error) {
            console.error('Failed to clear all game data:', error);
            return false;
        }
    }

    public static getSaveInfo(): { date: number; playTime: number; version: string } | null {
        try {
            const saveDataString = localStorage.getItem(this.SAVE_KEY);
            if (!saveDataString) {
                return null;
            }

            const saveData: SaveData = JSON.parse(saveDataString);
            return {
                date: saveData.metadata.saveDate,
                playTime: saveData.metadata.playTime,
                version: saveData.metadata.version
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }

    private static getPlayTime(): number {
        // This would ideally track actual play time
        // For now, we'll use a simple approximation
        return Date.now() - (this.getSaveInfo()?.date || Date.now());
    }

    private static validateSaveData(saveData: SaveData): boolean {
        try {
            // Check if items array exists and is valid
            if (saveData.items && Array.isArray(saveData.items)) {
                // Check for corrupted items with undefined itemType
                const corruptedItems = saveData.items.filter(item => !item.itemType || item.itemType === 'undefined');
                if (corruptedItems.length > 0) {
                    console.warn(`Found ${corruptedItems.length} corrupted items in save data`);
                    return false;
                }
            }
            
            // Check if player data exists
            if (!saveData.player || typeof saveData.player.x !== 'number' || typeof saveData.player.y !== 'number') {
                console.warn('Invalid player data in save file');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error validating save data:', error);
            return false;
        }
    }

    public static applySaveData(scene: any, saveData: SaveData): void {
        try {
            // Apply player data
            if (scene.player) {
                const player = scene.player;
                player.setPosition(saveData.player.x, saveData.player.y);
                player.setHealth(saveData.player.health);
                player.p1Inventory.loadFromData(saveData.player.inventory);
                player.questStatus = saveData.player.questStatus;
            }

            // Apply gear slot data
            if (scene.characterGearUI && saveData.player.gearSlots) {
                scene.characterGearUI.loadGearSlotState(saveData.player.gearSlots);
                console.log('Gear slot state restored');
            }

            // Apply enemy data
            if (scene.enemies) {
                saveData.enemies.forEach((enemyData, index) => {
                    if (scene.enemies[index]) {
                        const enemy = scene.enemies[index];
                        enemy.setPosition(enemyData.x, enemyData.y);
                        enemy.setHealth(enemyData.health);
                        
                        if (enemyData.isDead) {
                            enemy.die();
                        }
                        
                        if (enemyData.nightStatsApplied) {
                            (enemy as any).applyNightStats();
                        }
                    }
                });
            }

            // Apply tree data
            if (scene.trees) {
                saveData.trees.forEach((treeData, index) => {
                    if (scene.trees[index]) {
                        const tree = scene.trees[index];
                        // Trees are generally static, but we could restore fruit state
                        if (!treeData.hasFruit) {
                            (tree as any).hasFruit = false;
                            (tree as any).fruitItems = [];
                        }
                    }
                });
            }

            // Apply item data - PRESERVE newly spawned items that weren't saved
            if (scene.items) {
                console.log(`SaveSystem: Before applying save data - ${scene.items.length} items exist`);
                
                // Get list of saved item positions to avoid duplicates
                const savedItemPositions = new Set<string>();
                saveData.items.forEach(itemData => {
                    if (itemData.itemType && itemData.itemType !== 'undefined') {
                        savedItemPositions.add(`${itemData.x},${itemData.y}`);
                    }
                });
                console.log(`SaveSystem: Found ${savedItemPositions.size} saved item positions`);

                // Remove only items that were saved (to avoid duplicates)
                const itemsToRemove: Item[] = [];
                scene.items.forEach((item: Item) => {
                    const itemPosition = `${item.x},${item.y}`;
                    if (savedItemPositions.has(itemPosition)) {
                        itemsToRemove.push(item);
                    }
                });
                console.log(`SaveSystem: Removing ${itemsToRemove.length} duplicate items`);
                
                // Destroy saved items to avoid duplicates
                itemsToRemove.forEach((item: Item) => item.destroy());
                scene.items = scene.items.filter((item: Item) => !itemsToRemove.includes(item));
                console.log(`SaveSystem: After removing duplicates - ${scene.items.length} items remain`);

                // Recreate items from save data
                saveData.items.forEach(itemData => {
                    console.log(`Loading item: ${itemData.itemType} at (${itemData.x}, ${itemData.y})`);
                    // Skip items with undefined itemType (corrupted save data)
                    // Skip swords as they should not be saved/loaded
                    if (itemData.itemType && itemData.itemType !== 'undefined' && itemData.itemType !== 'w_longsword') {
                        // Map quest item types to texture keys
                        let textureKey = itemData.itemType;
                        if (itemData.itemType === 'dimensional herb') {
                            textureKey = 'dimensional-herb';
                        } else if (itemData.itemType === 'mysterious herb') {
                            textureKey = 'mysterious-herb';
                        }
                        
                        const item = new Item(scene, itemData.x, itemData.y, textureKey);
                        
                        // Restore respawn data for herbs to match new game behavior
                        if (itemData.itemType === 'mysterious herb') {
                            item.setData('respawnTime', 30000); // 30 seconds
                            item.setData('originalType', 'mysterious herb');
                            item.setData('spawnPoint', { x: itemData.x, y: itemData.y });
                            item.setData('isRespawnable', true);
                        } else if (itemData.itemType === 'dimensional herb') {
                            item.setData('respawnTime', 30000); // 30 seconds
                            item.setData('originalType', 'dimensional herb');
                            item.setData('spawnPoint', { x: itemData.x, y: itemData.y });
                            item.setData('isRespawnable', true);
                            
                            // Set proper herb properties to match new game herbs
                            item.setScale(0.8).setSize(32, 32).setOffset(0, 0);
                            item.setVisible(true);
                            item.setDepth(100);
                            
                            // Quest icons will be added when quests start via event listener
                        }
                        
                        scene.items.push(item);
                    } else if (itemData.itemType === 'w_longsword') {
                        console.log(`Skipping sword from save data - swords are not saved/loaded`);
                    } else {
                        console.warn(`Skipping corrupted item with undefined itemType at (${itemData.x}, ${itemData.y})`);
                    }
                });
                console.log(`SaveSystem: After loading save data - ${scene.items.length} total items`);
            }

            // Apply comprehensive game state
            console.log('Restoring game state:', saveData.gameState);
            
            // Restore day/night cycle
            if (scene.dayNightCycle) {
                scene.dayNightCycle.restoreSavedTime(saveData.gameState.currentTime);
                scene.dayNightCycle.setDarknessIntensity(saveData.gameState.darknessIntensity);
                console.log(`Time of day restored: ${saveData.gameState.timeOfDay} (${saveData.gameState.currentTime})`);
            }
            
            // Restore lantern state
            if (scene.lantern && saveData.gameState.lanternActive) {
                scene.lantern.setActive(true);
                console.log('Lantern state restored: active');
            }
            
            // Restore tree light emission state
            if (scene.treeLightEmission && saveData.gameState.treeLightActive) {
                scene.treeLightEmission.setActive(true);
                console.log('Tree lights restored: active');
            }
            
            // Restore player cooldowns and stamina
            if (scene.player) {
                scene.player.sprintCooldown = saveData.gameState.playerStamina;
                scene.player.attackLightCooldown = saveData.gameState.attackLightCooldown;
                scene.player.attackHeavyCooldown = saveData.gameState.attackHeavyCooldown;
                console.log('Player cooldowns restored');
            }
            
            // Restore camera position
            if (scene.cameras.main) {
                scene.cameras.main.setScroll(saveData.gameState.cameraX, saveData.gameState.cameraY);
                console.log(`Camera position restored: (${saveData.gameState.cameraX}, ${saveData.gameState.cameraY})`);
            }

            console.log('Save data applied successfully with full game state restoration');
        } catch (error) {
            console.error('Failed to apply save data:', error);
        }
    }
}
