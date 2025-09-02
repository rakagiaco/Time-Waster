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
        gameState: any
    ): boolean {
        try {
            const saveData: SaveData = {
                player: {
                    x: player.x,
                    y: player.y,
                    health: player.getHealth(),
                    maxHealth: player.getMaxHealth(),
                    inventory: player.p1Inventory.getInventoryData(),
                    questStatus: player.questStatus
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
                        itemType: fruit.item_type
                    })) || []
                })),
                items: items.map(item => ({
                    x: item.x,
                    y: item.y,
                    itemType: item.item_type
                })),
                gameState: {
                    timeOfDay: gameState.timeOfDay || 'day',
                    currentTime: gameState.currentTime || 0,
                    darknessIntensity: gameState.darknessIntensity || 0,
                    enemiesEnhanced: gameState.enemiesEnhanced || 0
                },
                metadata: {
                    saveDate: Date.now(),
                    playTime: this.getPlayTime(),
                    version: this.VERSION
                }
            };

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log('Game saved successfully');
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

            // Apply item data
            if (scene.items) {
                // Clear existing items
                scene.items.forEach((item: Item) => item.destroy());
                scene.items = [];

                // Recreate items from save data
                saveData.items.forEach(itemData => {
                    const item = new Item(scene, itemData.x, itemData.y, itemData.itemType);
                    scene.items.push(item);
                });
            }

            // Apply game state
            if (scene.dayNightCycle) {
                scene.dayNightCycle.setTime(saveData.gameState.currentTime);
            }

            console.log('Save data applied successfully');
        } catch (error) {
            console.error('Failed to apply save data:', error);
        }
    }
}
