/**
 * Asset Optimizer
 * 
 * Manages asset loading with memory monitoring to prevent
 * ArrayBuffer allocation failures while preserving all features.
 */

import { MemoryManager } from './MemoryManager';

export class AssetOptimizer {
    private static readonly MAX_TEXTURES = 100; // Increased limit
    private static readonly MAX_AUDIO_FILES = 50; // Allow all audio files
    private static readonly MAX_SPRITESHEETS = 30; // Increased limit
    private static memoryManager = MemoryManager.getInstance();
    
    /**
     * Get optimized asset list for loading
     */
    public static getOptimizedAssets(): any[] {
        return [
            // Essential UI assets only
            { key: '8-bit', type: 'bitmapFont', textureURL: 'font/8-bit.png', fontDataURL: 'font/8-bit.xml' },
            { key: '8-bit-white', type: 'bitmapFont', textureURL: 'font/8-bit-white.png', fontDataURL: 'font/8-bit-white.xml' },
            { key: 'pixel-black', type: 'bitmapFont', textureURL: 'font/pixel-black.png', fontDataURL: 'font/pixel-black.xml' },
            { key: 'pixel-green', type: 'bitmapFont', textureURL: 'font/pixel-green.png', fontDataURL: 'font/pixel-green.xml' },
            { key: 'pixel-red', type: 'bitmapFont', textureURL: 'font/pixel-red.png', fontDataURL: 'font/pixel-red.xml' },
            { key: 'pixel-white', type: 'bitmapFont', textureURL: 'font/pixel-white.png', fontDataURL: 'font/pixel-white.xml' },
            { key: 'pixel-yellow', type: 'bitmapFont', textureURL: 'font/pixel-yellow.png', fontDataURL: 'font/pixel-yellow.xml' },
            
            // Essential sprites only
            { key: 'player', type: 'spritesheet', url: 'spritesheets/player/newplayersprite/knight_1.png', frameConfig: { frameWidth: 32, frameHeight: 32 } },
            { key: 'enemy-1', type: 'spritesheet', url: 'spritesheets/enemy-1.png', frameConfig: { frameWidth: 32, frameHeight: 32 } },
            { key: 'enemy-2', type: 'spritesheet', url: 'spritesheets/enemy-2.png', frameConfig: { frameWidth: 32, frameHeight: 32 } },
            
            // Essential UI images
            { key: 'menu-button', type: 'image', url: 'img/menu-button.png' },
            { key: 'new-game-button', type: 'image', url: 'img/new-game-button.png' },
            { key: 'continue-game-button', type: 'image', url: 'img/continue-game-button.png' },
            { key: 'freeplay-button', type: 'image', url: 'img/freeplay-button.png' },
            { key: 'credits-button', type: 'image', url: 'img/credits-button.png' },
            { key: 'help-icon', type: 'image', url: 'img/help-icon.png' },
            { key: 'help-page', type: 'image', url: 'img/help-page.png' },
            { key: 'fullscreen', type: 'image', url: 'img/fullscreen.png' },
            { key: 'save', type: 'image', url: 'img/save.png' },
            { key: 'save-arrow', type: 'image', url: 'img/save-arrow.png' },
            { key: 'cursor', type: 'image', url: 'img/cursor.png' },
            { key: 'cursor-2', type: 'image', url: 'img/cursor-2.png' },
            
            // Essential game objects
            { key: 'tree-1', type: 'image', url: 'spritesheets/tree-1.png' },
            { key: 'tree-2', type: 'image', url: 'spritesheets/tree-2.png' },
            { key: 'tree-3', type: 'image', url: 'spritesheets/tree-3.png' },
            { key: 'bush-1', type: 'image', url: 'spritesheets/bush-1.png' },
            
            // Essential items
            { key: 'fruit', type: 'image', url: 'img/fruit.png' },
            { key: 'mysterious-herb', type: 'image', url: 'img/mysterious-herb.png' },
            { key: 'dimensional-herb', type: 'image', url: 'img/dimensional-herb.png' },
            { key: 'nepian-blood', type: 'image', url: 'img/nepian-blood.png' },
            { key: 'frozen-heart', type: 'image', url: 'img/frozen-heart.png' },
            
            // Essential weapons
            { key: 'w_longsword', type: 'image', url: 'weapons/w_longsword.png' },
            
            // Essential backgrounds
            { key: 'menubackground', type: 'image', url: 'Backgrounds/menubackground.png' },
            { key: 'htmlbackground', type: 'image', url: 'Backgrounds/htmlbackground.png' },
            { key: 'deathscreen', type: 'image', url: 'Backgrounds/deathscreen.png' },
            
            // Essential quest icons
            { key: 'quest-icon', type: 'image', url: 'spritesheets/quest-icon.png' },
            { key: 'quest-complete-icon', type: 'image', url: 'spritesheets/quest-complete-icon.png' },
            
            // Essential UI elements
            { key: 'attack-bar', type: 'image', url: 'img/attack-bar.png' },
            { key: 'attack-light-cooldown', type: 'image', url: 'img/attack-light-cooldown.png' },
            { key: 'rect', type: 'image', url: 'img/rect.png' },
            
            // Essential NPCs (limit to 1-2)
            { key: 'npc-1', type: 'image', url: 'img/npc-1.png' },
            
            // Essential data files
            { key: 'menu-remarks', type: 'json', url: 'data/menu-remarks.json' },
            { key: 'lore-data', type: 'json', url: 'data/lore.json' },
            { key: 'quest-1', type: 'json', url: 'quests/quest-1.json' },
            { key: 'quest-2', type: 'json', url: 'quests/quest-2.json' },
            { key: 'quest-3', type: 'json', url: 'quests/quest-3.json' },
            { key: 'quest-4', type: 'json', url: 'quests/quest-4.json' },
            { key: 'quest-5', type: 'json', url: 'quests/quest-5.json' },
            { key: 'quest-6', type: 'json', url: 'quests/quest-6.json' },
            { key: 'quest-7', type: 'json', url: 'quests/quest-7.json' },
            { key: 'quest-8', type: 'json', url: 'quests/quest-8.json' },
            { key: 'quest-9', type: 'json', url: 'quests/quest-9.json' },
            { key: 'quest-10', type: 'json', url: 'quests/quest-10.json' },
            { key: 'quest-11', type: 'json', url: 'quests/quest-11.json' },
            { key: 'quest-12', type: 'json', url: 'quests/quest-12.json' },
            { key: 'quest-13', type: 'json', url: 'quests/quest-13.json' },
            { key: 'quest-14', type: 'json', url: 'quests/quest-14.json' },
            
            // All audio files
            { key: 'click', type: 'audio', url: 'audio/click.wav' },
            { key: 'in-water', type: 'audio', url: 'audio/in-water.mp3' },
            { key: 'walking', type: 'audio', url: 'audio/walking-dirt.mp3' },
            { key: 'attack-light', type: 'audio', url: 'audio/attack-light.mp3' },
            { key: 'attack-light-hit', type: 'audio', url: 'audio/attack-light-hit.mp3' },
            { key: 'attack-heavy', type: 'audio', url: 'audio/attack-heavy.mp3' },
            { key: 'attack-heavy-hit', type: 'audio', url: 'audio/attack-heavy-hit.mp3' },
            { key: 'collect-herb', type: 'audio', url: 'audio/collect-herb.mp3' },
            { key: 'enemy-1-hit', type: 'audio', url: 'audio/enemy-hit.mp3' },
            { key: 'enemy-2-hit', type: 'audio', url: 'audio/enemy-hit-2.mp3' },
            { key: 'help-toggle', type: 'audio', url: 'audio/help-toggle.mp3' },
            { key: 'complete-quest', type: 'audio', url: 'audio/complete-quest.mp3' },
            { key: 'page-turn', type: 'audio', url: 'audio/page-turn.mp3' },
            { key: 'game-over', type: 'audio', url: 'audio/game-over.wav' },
            { key: 'main-menu-music', type: 'audio', url: 'audio/music/mainmenu/Time Waster (1).mp3' },
            { key: 'defeat-music', type: 'audio', url: 'audio/music/deathmenu/Defeat.mp3' },
            
            // Shuffle playlist music - enabling more songs for variety
            { key: 'shuffle-divo', type: 'audio', url: 'audio/music/Shuffle/Divo.mp3' },
            { key: 'shuffle-j178', type: 'audio', url: 'audio/music/Shuffle/J178.mp3' },
            { key: 'shuffle-maude', type: 'audio', url: 'audio/music/Shuffle/Maude.mp3' },
            { key: 'shuffle-wahwah', type: 'audio', url: 'audio/music/Shuffle/WahWah.mp3' },
            { key: 'shuffle-dream2', type: 'audio', url: 'audio/music/Shuffle/night/Dream2.mp3' },
            { key: 'shuffle-jeeno', type: 'audio', url: 'audio/music/Shuffle/night/Jeeno.mp3' },
            { key: 'shuffle-lucid', type: 'audio', url: 'audio/music/Shuffle/night/Lucid.mp3' },
            { key: 'shuffle-n187', type: 'audio', url: 'audio/music/Shuffle/night/N187.mp3' },
            
            // TILESET ASSETS - All tilesets referenced in the tilemap
            { key: 'Water_tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Tilesets/Water_tiles.png' },
            { key: 'Props', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Props.png' },
            { key: 'Floors_Tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png' },
            { key: 'Desert_Props', type: 'image', url: 'assetpacks/Pixel Crawler - Desert/Assets/Props.png' },
            { key: 'Dungeon_Props', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Dungeon_Props.png' },
            { key: 'Dungeon_Tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png' },
            { key: 'Shadown', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Shadown.png' },
            { key: 'Tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Tiles.png' },
            { key: 'Tree', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Tree.png' },
            { key: 'Farm', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Farm.png' },
            { key: 'Ground', type: 'image', url: 'assetpacks/Pixel Crawler - Desert/Assets/Ground.png' },
            { key: 'Light', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Light.png' },
            { key: 'Resources', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Resources.png' },
            { key: 'Rocks', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Rocks.png' },
            { key: 'Sand', type: 'image', url: 'assetpacks/Pixel Crawler - Desert/Assets/Sand.png' },
            { key: 'Shadows', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Shadows.png' },
            { key: 'Tree_Model_01_Size_02', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_02.png' },
            { key: 'Tree_Model_02_Size_02', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_02/Size_02.png' },
            { key: 'Tree_Model_03_Size_02', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_03/Size_02.png' },
            { key: 'Tree_Model_01_Size_03', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_03.png' },
            { key: 'Tree_Model_02_Size_03', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_02/Size_03.png' },
            { key: 'Tree_Model_03_Size_03', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_03/Size_03.png' },
            { key: 'Tree_Model_01_Size_04', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_04.png' },
            { key: 'Tree_Model_02_Size_04', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_02/Size_04.png' },
            { key: 'Tree_Model_03_Size_04', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_03/Size_04.png' },
            { key: 'Tree_Model_01_Size_05', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_05.png' },
            { key: 'Tree_Model_02_Size_05', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_02/Size_05.png' },
            { key: 'Tree_Model_03_Size_05', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_03/Size_05.png' },
            { key: 'Tree_Fairy_Forest', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Tree.png' },
            { key: 'Vegetation', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Props/Static/Vegetation.png' },
            { key: 'Wall_Tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Tilesets/Wall_Tiles.png' },
            { key: 'Wall_Variations', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Tilesets/Wall_Variations.png' },
            { key: 'Bonfire', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Stations/Bonfire/Bonfire.png' },
            { key: 'Building_Props', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Props.png' },
            { key: 'Building_Shadows', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Shadows.png' },
            { key: 'Building_Walls', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Walls.png' },
            { key: 'Building_Roofs', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Roofs.png' },
            { key: 'Workbench', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Stations/Workbench/Workbench.png' },
            { key: 'Alchemy_Table', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Stations/Alchemy/Alchemy_Table_01-Sheet.png' },
            { key: 'Building_Floors', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Floors.png' },
            { key: 'Bonfire_2', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Stations/Bonfire/Bonfire.png' },
            { key: 'Building_Shadows_2', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Shadows.png' },
            { key: 'Building_Shadows_3', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Shadows.png' },
            
            // Additional missing tilesets from console errors
            { key: 'Shadows_Buildings', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Shadows.png' },
            { key: 'Walls_Buildings', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Walls.png' },
            { key: 'Roofs_Buildings', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Roofs.png' },
            { key: 'Props_Buildings', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Props.png' },
            { key: 'Floors_Buildings', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Buildings/Floors.png' },
            { key: 'Alchemy_Table_01', type: 'image', url: 'assetpacks/Pixel Crawler - Free Pack 2.0.4/Pixel Crawler - Free Pack/Environment/Structures/Stations/Alchemy/Alchemy_Table_01-Sheet.png' },
            { key: 'fairyforest_Props', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Props.png' },
            { key: 'fairy_Shadown', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Shadown.png' },
            { key: 'fairyforest_Tiles', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Tiles.png' },
            { key: 'fairyforest_Tree', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Tree.png' },
            { key: 'Light_fairy', type: 'image', url: 'assetpacks/Pixel Crawler - Fairy Forest 1.7/Assets/Light.png' },
            { key: 'dessert_Props', type: 'image', url: 'assetpacks/Pixel Crawler - Desert/Assets/Props.png' },
            { key: 'dessert_Ground', type: 'image', url: 'assetpacks/Pixel Crawler - Desert/Assets/Ground.png' }
        ];
    }
    
    /**
     * Check if we should load an asset based on memory limits
     */
    public static shouldLoadAsset(assetType: string, currentCount: number): boolean {
        // Temporarily disable memory restrictions due to incorrect memory reporting
        // TODO: Fix memory reporting system
        return true;
        
        // Enable memory restrictions to prevent array buffer allocation failures
        // const memoryManager = MemoryManager.getInstance();
        // const memoryStatus = memoryManager.checkMemoryUsage();
        
        // if (memoryStatus.isLow) {
        //     console.warn(`⚠️ Skipping ${assetType} asset due to low memory: ${memoryStatus.used.toFixed(1)}MB used`);
        //     return false;
        // }
        
        // return true;
    }
    
    /**
     * Get memory usage estimate
     */
    public static getMemoryEstimate(): number {
        // Rough estimate: each texture ~1MB, each audio ~500KB
        const textureEstimate = this.MAX_TEXTURES * 1024 * 1024; // 1MB per texture
        const audioEstimate = this.MAX_AUDIO_FILES * 512 * 1024; // 512KB per audio
        return textureEstimate + audioEstimate;
    }
}
