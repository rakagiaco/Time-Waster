/**
 * Asset Loader Scene
 * 
 * Handles loading of all game assets including sprites, audio, fonts, tilemaps,
 * and quest data. Also manages save game state restoration and animation setup.
 * 
 * This scene runs before the main menu and ensures all resources are available
 * before gameplay begins. It also creates all sprite animations used throughout
 * the game.
 * 
 *  HONESTLY THIS IS THE ONLY FILE THAT SHOULD EVEN BE REMOTELY CLOSE TO 1000 LINES ... YET ITS ONE OF THE SMALLER FILES ... 
 */
export class Loader extends Phaser.Scene {
    quest: any;                 // Saved quest data from localStorage
    existing_inv: any;          // Saved inventory data from localStorage

    constructor() {
        super('Loader');
    }

    /**
     * Initialize scene state and clear any existing data
     */
    init(): void {
        this.quest = undefined;
        this.existing_inv = undefined;
    }

    /**
     * Load all game assets including graphics, audio, fonts, and data files
     * 
     * Organized into sections for different asset types. Also handles
     * loading save game data from localStorage if available.
     */
    preload(): void {
        // Note: Loading screen code commented out but preserved for future use
        // Can be uncommented to show loading progress to players


        // =====================================================================
        // TILEMAP AND WORLD ASSETS
        // =====================================================================
        this.load.image('base-tileset', '/tilesets/base_tileset.png');
        this.load.tilemapTiledJSON('tilemapJSON', '/tilesets/main-tileset-1.json');

        // =====================================================================
        // ANIMATED SPRITE SHEETS
        // =====================================================================
        this.load.spritesheet('water-pond', '/spritesheets/water-anims.png', { frameWidth: 32, frameHeight: 32 })
        this.load.spritesheet('tree-1', '/spritesheets/tree-1.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('tree-2', '/spritesheets/tree-2.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('tree-2-second', '/spritesheets/tree-2-second.png', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('tree-3', '/spritesheets/tree-3.png', { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet('bush-1', '/spritesheets/bush-1.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('quest-icon', '/spritesheets/quest-icon.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('quest-complete-icon', '/spritesheets/quest-complete-icon.png', { frameWidth: 16, frameHeight: 16 })
        this.load.spritesheet('enemy-1-anim', '/spritesheets/enemy-1.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('enemy-2-anim', '/spritesheets/enemy-2.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('boss-aoe', '/spritesheets/damage-aoe-boss.png', { frameWidth: 32, frameHeight: 32 })
        this.load.spritesheet('player-light-attack-anim', '/spritesheets/player/player-light-attack-anim.png', { frameWidth: 32, frameHeight: 32 })
        this.load.spritesheet('player-heavy-attack-anim', '/spritesheets/player/player-heavy-attack-anim.png', { frameWidth: 32, frameHeight: 32 })
        this.load.spritesheet('attack-heavy-cooldown', '/spritesheets/player/attack-heavy-cooldown.png', { frameWidth: 47, frameHeight: 16 })
        this.load.spritesheet('enemy-1-death', '/spritesheets/enemy-1-death.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('enemy-2-death', '/spritesheets/enemy-2-death.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('enemy-2-lootable', '/spritesheets/enemy-2-lootable.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('boss-1', '/spritesheets/boss-1.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('boss-death', '/spritesheets/boss-death.png', { frameWidth: 32, frameHeight: 50 })
        this.load.spritesheet('boss-lootable', '/spritesheets/boss-lootable.png', { frameWidth: 32, frameHeight: 50 })

        // =====================================================================
        // KNIGHT SPRITESHEET (replacing player atlas)
        // =====================================================================
        this.load.spritesheet('player', '/spritesheets/player/newplayersprite/knight_1.png?v=3', { frameWidth: 32, frameHeight: 32 });

        // =====================================================================
        // STATIC IMAGES AND UI ELEMENTS
        // =====================================================================
        this.load.image('continue-game-button', '/img/continue-game-button.png')
        this.load.image('cursor-2', '/img/cursor-2.png')
        this.load.image('cursor', '/img/cursor.png')
        this.load.image('enemy-1', '/img/enemy-1.png')
        this.load.image('Frozen Heart', '/img/frozen-heart.png')
        this.load.image('fruit', '/img/fruit.png')
        this.load.image('apple', '/img/fruit.png') // Using fruit.png as placeholder for apple
        this.load.image('pinecone', '/img/fruit.png') // Using fruit.png as placeholder for pinecone
        this.load.image('ancient-fruit', '/img/fruit.png') // Using fruit.png as placeholder for ancient-fruit
        this.load.image('cherry', '/img/fruit.png') // Using fruit.png as placeholder for cherry
        this.load.image('tree-of-life-fruit', '/img/fruit.png') // Special fruit from Tree of Life
        this.load.image('fullscreen', '/img/fullscreen.png')
        this.load.image('mysterious herb', '/img/mysterious-herb.png')
        this.load.image('lesser nepian blood', '/img/nepian-blood.png')
        this.load.image('new-game-button', '/img/new-game-button.png')
        this.load.image('npc-1', '/img/npc-1.png')
        this.load.image('rect', '/img/rect.png')
        this.load.image('save-arrow', '/img/save-arrow.png')
        this.load.image('save', '/img/save.png')
        this.load.image('attack-bar', '/img/attack-bar.png')
        this.load.image('attack-light-cooldown', '/img/attack-light-cooldown.png')
        this.load.image('help-page', '/img/help-page.png')
        this.load.image('help-icon', '/img/help-icon.png')
        this.load.image('credits-button', '/img/credits-button.png')
        this.load.image('menu-button', '/img/menu-button.png')
        this.load.image('freeplay-button', '/img/freeplay-button.png')

        // =====================================================================
        // QUEST DATA FILES
        // =====================================================================
        this.load.json('quest-1', '/quests/quest-1.json')
        this.load.json('quest-2', '/quests/quest-2.json')
        this.load.json('quest-3', '/quests/quest-3.json')
        this.load.json('quest-4', '/quests/quest-4.json')
        this.load.json('quest-5', '/quests/quest-5.json')
        this.load.json('quest-6', '/quests/quest-6.json')
        this.load.json('quest-7', '/quests/quest-7.json')

        // =====================================================================
        // AUDIO FILES
        // =====================================================================
        this.load.audio('click', '/audio/click.wav')
        this.load.audio('in-water', '/audio/in-water.mp3')
        this.load.audio('walking', '/audio/walking-dirt.mp3')
        this.load.audio('attack-light', '/audio/attack-light.mp3')
        this.load.audio('attack-light-hit', '/audio/attack-light-hit.mp3')
        this.load.audio('attack-heavy', '/audio/attack-heavy.mp3')
        this.load.audio('attack-heavy-hit', '/audio/attack-heavy-hit.mp3')
        this.load.audio('collect-herb', '/audio/collect-herb.mp3')
        this.load.audio('enemy-1-hit', '/audio/enemy-hit.mp3')
        this.load.audio('enemy-2-hit', '/audio/enemy-hit-2.mp3')
        this.load.audio('help-toggle', '/audio/help-toggle.mp3')
        this.load.audio('complete-quest', '/audio/complete-quest.mp3')
        this.load.audio('page-turn', '/audio/page-turn.mp3')
        this.load.audio('game-over', '/audio/game-over.wav')
        this.load.audio('main-menu-music', '/audio/music/mainmenu/Time Waster (1).mp3')
        
        // =====================================================================
        // SHUFFLE PLAYLIST MUSIC
        // =====================================================================
        // Day songs
        this.load.audio('shuffle-divo', '/audio/music/Shuffle/Divo.mp3')
        this.load.audio('shuffle-j178', '/audio/music/Shuffle/J178.mp3')
        this.load.audio('shuffle-maude', '/audio/music/Shuffle/Maude.mp3')
        this.load.audio('shuffle-wahwah', '/audio/music/Shuffle/WahWah.mp3')
        
        // Night songs
        this.load.audio('shuffle-dream2', '/audio/music/Shuffle/night/Dream2.mp3')
        this.load.audio('shuffle-jeeno', '/audio/music/Shuffle/night/Jeeno.mp3')
        this.load.audio('shuffle-lucid', '/audio/music/Shuffle/night/Lucid.mp3')
        this.load.audio('shuffle-n187', '/audio/music/Shuffle/night/N187.mp3')

        this.load.bitmapFont('8-bit', '/font/8-bit.png', '/font/8-bit.xml')
        this.load.bitmapFont('8-bit-white', '/font/8-bit-white.png', '/font/8-bit-white.xml')
        this.load.bitmapFont('pixel-red', '/font/pixel-red.png', '/font/pixel-red.xml')
        this.load.bitmapFont('pixel-yellow', '/font/pixel-yellow.png', '/font/pixel-yellow.xml')
        this.load.bitmapFont('pixel-green', '/font/pixel-green.png', '/font/pixel-green.xml')
        this.load.bitmapFont('pixel-black', '/font/pixel-black.png', '/font/pixel-black.xml')
        this.load.bitmapFont('pixel-white', '/font/pixel-white.png', '/font/pixel-white.xml')

        // =====================================================================
        // SAVE GAME DATA RESTORATION
        // =====================================================================
        
        // Load saved quest progress from localStorage
        if (window.localStorage.getItem('existing_quest') != null) {
            this.quest = window.localStorage.getItem('existing_quest');
            this.quest = JSON.parse(this.quest);
        }

        // Load saved inventory data from localStorage
        if (window.localStorage.getItem('existing_inv') != null) {
            this.existing_inv = window.localStorage.getItem('existing_inv');
            const parse = JSON.parse(this.existing_inv);
            this.existing_inv = new Map(parse);
        }
    }



    /**
     * Create all sprite animations and transition to main menu
     * 
     * Defines animation sequences for all game entities including player,
     * enemies, environment objects, and UI elements. All animations are
     * created here to ensure they're available when needed.
     */
    create(): void {
        // =====================================================================
        // KNIGHT ANIMATIONS (using knight_1 spritesheet)
        // ====================================================================="
        // Knight_1 layout: frames 0-3 are idle, frames 4-13 are walking (2 frames each direction)
        // Idle: 0=down, 1=right, 2=left, 3=up
        // Walking: 4-5=down, 6-7=left, 8-9=right, 10-11=up
        
        this.anims.create({
            key: 'player-walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 10, end: 11 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 5 }),
            frameRate: 5,
            repeat: -1
        })


        this.anims.create({
            key: 'player-walk-left',
            frames: this.anims.generateFrameNumbers('player', { start: 6, end: 7 }),
            frameRate: 5,
            repeat: -1
        })


        this.anims.create({
            key: 'player-walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
            frameRate: 5,
            repeat: -1
        })

        // Idle animations for each direction
        // Frame layout: 0=down, 1=right, 2=left, 3=up (0-indexed!)
        this.anims.create({
            key: 'player-idle-down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'player-idle-right',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'player-idle-left',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'player-idle-up',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 3 }),
            frameRate: 5,
            repeat: -1
        })


        this.anims.create({
            key: 'player-light-attack',
            frames: this.anims.generateFrameNumbers('player-light-attack-anim', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: 0
        })

        this.anims.create({
            key: 'player-heavy-attack',
            frames: this.anims.generateFrameNumbers('player-heavy-attack-anim', { start: 0, end: 9 }),
            frameRate: 10,
            repeat: 0
        })

        this.anims.create({
            key: 'attack-heavy-cooldown-anim',
            frames: this.anims.generateFrameNumbers('attack-heavy-cooldown', { start: 0, end: 2 }),
            frameRate: 1,
            repeat: 0
        })


        // =====================================================================
        // ENEMY ANIMATIONS
        // =====================================================================
        this.anims.create({
            key: 'enemy-idle-anim',
            frames: this.anims.generateFrameNumbers('enemy-1-anim', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: 'enemy-1-death-anim',
            frames: this.anims.generateFrameNumbers('enemy-1-death', { start: 0, end: 7 }),
            frameRate: 6,
            repeat: 0,
        })

        this.anims.create({
            key: 'enemy2-idle-anim',
            frames: this.anims.generateFrameNumbers('enemy-2-anim', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: 'enemy-2-death-anim',
            frames: this.anims.generateFrameNumbers('enemy-2-death', { start: 0, end: 4 }),
            frameRate: 6,
            repeat: 0,
        })

        this.anims.create({
            key: 'enemy-2-lootable-anim',
            frames: this.anims.generateFrameNumbers('enemy-2-lootable', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
        })

        this.anims.create({
            key: 'boss-1-idle-anim',
            frames: this.anims.generateFrameNumbers('boss-1', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
        })

        this.anims.create({
            key: 'boss-1-death-anim',
            frames: this.anims.generateFrameNumbers('boss-death', { start: 0, end: 5 }),
            frameRate: 6,
            repeat: 0,
        })

        this.anims.create({
            key: 'boss-1-lootable-anim',
            frames: this.anims.generateFrameNumbers('boss-lootable', { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1,
        })


        // =====================================================================
        // BOSS SPECIAL ANIMATIONS
        // =====================================================================
        this.anims.create({
            key: 'boss-aoe-anim',
            frames: this.anims.generateFrameNumbers('boss-aoe', { start: 0, end: 15 }),
            frameRate: 8,
            repeat: 1
        })

        // =====================================================================
        // ENVIRONMENT AND UI ANIMATIONS
        // =====================================================================
        
        // Quest indicator animations
        this.anims.create({
            key: 'quest-icon',
            frames: this.anims.generateFrameNumbers('quest-icon', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'quest-complete-icon-anim',
            frames: this.anims.generateFrameNumbers('quest-complete-icon', { start: 0, end: 6 }),
            frameRate: 5,
            repeat: -1
        })

        this.anims.create({
            key: 'water-moving',
            frames: this.anims.generateFrameNumbers('water-pond', { start: 0, end: 5 }),
            frameRate: 4,
            repeat: -1
        })

        this.anims.create({
            key: 'tree-1-anim0',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 2500
        })

        this.anims.create({
            key: 'tree-1-anim1',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 3500
        })

        this.anims.create({
            key: 'tree-1-anim2',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 4500
        })

        this.anims.create({
            key: 'tree-1-anim3',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 5500
        })

        this.anims.create({
            key: 'tree-1-anim4',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 6500
        })

        this.anims.create({
            key: 'tree-1-anim5',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 4 }),
            frameRate: 3,
            repeat: -1,
            repeatDelay: 7500
        })

        this.anims.create({
            key: 'tree-2-anim0',
            frames: this.anims.generateFrameNumbers('tree-2', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 2500
        })

        this.anims.create({
            key: 'tree-2-anim1',
            frames: this.anims.generateFrameNumbers('tree-2', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 3500
        })

        this.anims.create({
            key: 'tree-2-anim2',
            frames: this.anims.generateFrameNumbers('tree-2', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 4500
        })

        this.anims.create({
            key: 'tree-2-anim3',
            frames: this.anims.generateFrameNumbers('tree-2', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 5500
        })

        this.anims.create({
            key: 'tree-2-anim4',
            frames: this.anims.generateFrameNumbers('tree-2-second', { start: 0, end: 18 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 2500
        })

        this.anims.create({
            key: 'tree-2-anim5',
            frames: this.anims.generateFrameNumbers('tree-2-second', { start: 0, end: 18 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 3500
        })

        this.anims.create({
            key: 'tree-2-anim6',
            frames: this.anims.generateFrameNumbers('tree-2-second', { start: 0, end: 18 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 4500
        })

        this.anims.create({
            key: 'tree-2-anim7',
            frames: this.anims.generateFrameNumbers('tree-2-second', { start: 0, end: 18 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 5506
        })

        this.anims.create({
            key: 'tree-3-anim',
            frames: this.anims.generateFrameNumbers('tree-3', { start: 0, end: 7 }),
            frameRate: 4,
            repeat: 0,
        })

        this.anims.create({
            key: 'bush-1-anim',
            frames: this.anims.generateFrameNumbers('bush-1', { start: 0, end: 6 }),
            frameRate: 5,
            repeat: -1
        })
        
        // Start the main menu scene with loaded save data
        this.scene.start('menuScene', { qobj: this.quest, inv: this.existing_inv });
    }
}