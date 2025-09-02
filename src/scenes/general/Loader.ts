import Phaser from 'phaser';
import GameConfig from '../../config/GameConfig';

export class Loader extends Phaser.Scene {

    constructor() {
        super('Loader');
    }

    init(): void {
        try {
            console.log('=== LOADER SCENE INIT ===');
            console.log('Scene key:', this.scene.key);
            console.log('Scene name:', 'Loader');
            console.log('Game config:', this.game.config);
            console.log('=======================');
        } catch (error) {
            console.error('Error in Loader init():', error);
        }
    }

    preload(): void {
        try {
            console.log('=== LOADER SCENE PRELOAD ===');
            console.log('Scene key:', this.scene.key);
            console.log('Game width:', this.game.config.width);
            console.log('Game height:', this.game.config.height);
            
            // Add loading text
            const loadingText = this.add.text((this.game.config.width as number) / 2, (this.game.config.height as number) / 2, 'Loading...', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#0000FF',
                align: 'center',
                padding: { top: 5, bottom: 5 },
                fixedWidth: 0,
            }).setOrigin(0.5);
            
            console.log('Loading text created:', loadingText);
            
            // Loading bar
            let loadingBar = this.add.graphics();
            console.log('Loading bar created:', loadingBar);
            
            this.load.on('progress', (_value: number) => {
                try {
                    loadingBar.clear();
                    loadingBar.fillStyle(0x00FFFF, 1);
                    loadingBar.fillRect((this.game.config.width as number) / 4, (this.game.config.height as number) / 2 + 100, 500, 25);
                } catch (error) {
                    console.error('Error in progress handler:', error);
                }
            });
            
            this.load.on('complete', () => {
                try {
                    console.log('=== ASSET LOADING COMPLETE ===');
                    console.log('All assets loaded successfully');
                    loadingBar.destroy();
                    console.log('Loading bar destroyed');
                } catch (error) {
                    console.error('Error in complete handler:', error);
                }
            });
            
            this.load.on('loaderror', (file: any) => {
                console.error('=== ASSET LOAD ERROR ===');
                console.error('Failed to load asset:', file.key);
                console.error('File type:', file.type);
                console.error('URL:', file.url);
                console.error('Error:', file.state);
                console.error('======================');
            });
            
            console.log('Asset loading event handlers set up');
            
        } catch (error) {
            console.error('=== CRITICAL ERROR IN LOADER PRELOAD ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('=========================================');
        }

        // Loading bar
        let loadingBar = this.add.graphics();
        this.load.on('progress', (_value: number) => {
            loadingBar.clear();
            loadingBar.fillStyle(0x00FFFF, 1);
            loadingBar.fillRect((this.game.config.width as number) / 4, (this.game.config.height as number) / 2 + 100, 500, 25);
        });
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            loadingBar.destroy();
        });

        // Load tilemap
        this.load.image('base-tileset', 'tilesets/base_tileset.png');
        this.load.tilemapTiledJSON('tilemapJSON', 'tilesets/main-tileset-1.json');

        // Load animated sprites
        this.load.spritesheet('water-pond', 'spritesheets/water-anims.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('tree-1', 'spritesheets/tree-1.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('tree-2', 'spritesheets/tree-2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('tree-2-second', 'spritesheets/tree-2-second.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('tree-3', 'spritesheets/tree-3.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('bush-1', 'spritesheets/bush-1.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('quest-icon', 'spritesheets/quest-icon.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('quest-complete-icon', 'spritesheets/quest-complete-icon.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('enemy-1-anim', 'spritesheets/enemy-1.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('enemy-2-anim', 'spritesheets/enemy-2.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('boss-aoe', 'spritesheets/damage-aoe-boss.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('player-light-attack-anim', 'spritesheets/player/player-light-attack-anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('player-heavy-attack-anim', 'spritesheets/player/player-heavy-attack-anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('attack-heavy-cooldown', 'spritesheets/player/attack-heavy-cooldown.png', { frameWidth: 47, frameHeight: 16 });
        this.load.spritesheet('enemy-1-death', 'spritesheets/enemy-1-death.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('enemy-2-death', 'spritesheets/enemy-2-death.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('enemy-2-lootable', 'spritesheets/enemy-2-lootable.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('boss-1', 'spritesheets/boss-1.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('boss-death', 'spritesheets/boss-death.png', { frameWidth: 32, frameHeight: 50 });
        this.load.spritesheet('boss-lootable', 'spritesheets/boss-lootable.png', { frameWidth: 32, frameHeight: 32 });
        
        // Load player spritesheet
        this.load.spritesheet('player', 'spritesheets/player/player.png', { frameWidth: 32, frameHeight: 32 });

        // Load images
        this.load.image('continue-game-button', 'img/continue-game-button.png');
        this.load.image('cursor-2', 'img/cursor-2.png');
        this.load.image('cursor', 'img/cursor.png');
        this.load.image('enemy-1', 'img/enemy-1.png');
        this.load.image('frozen-heart', 'img/frozen-heart.png');
        this.load.image('fruit', 'img/fruit.png');
        this.load.image('fullscreen', 'img/fullscreen.png');
        this.load.image('mysterious-herb', 'img/mysterious-herb.png');
        this.load.image('nepian-blood', 'img/nepian-blood.png');
        this.load.image('new-game-button', 'img/new-game-button.png');
        this.load.image('npc-1', 'img/npc-1.png');
        this.load.image('rect', 'img/rect.png');
        this.load.image('save-arrow', 'img/save-arrow.png');
        this.load.image('save', 'img/save.png');
        this.load.image('attack-bar', 'img/attack-bar.png');
        this.load.image('attack-light-cooldown', 'img/attack-light-cooldown.png');
        this.load.image('help-page', 'img/help-page.png');
        this.load.image('help-icon', 'img/help-icon.png');
        this.load.image('credits-button', 'img/credits-button.png');
        this.load.image('menu-button', 'img/menu-button.png');
        this.load.image('freeplay-button', 'img/freeplay-button.png');

        // Load quests
        this.load.json('quest-1', 'quests/quest-1.json');
        this.load.json('quest-2', 'quests/quest-2.json');
        this.load.json('quest-3', 'quests/quest-3.json');
        this.load.json('quest-4', 'quests/quest-4.json');
        this.load.json('quest-5', 'quests/quest-5.json');
        this.load.json('quest-6', 'quests/quest-6.json');
        this.load.json('quest-7', 'quests/quest-7.json');

        // Load audio
        this.load.audio('click', 'audio/click.wav');
        this.load.audio('attack-light', 'audio/attack-light.mp3');
        this.load.audio('attack-light-hit', 'audio/attack-light-hit.mp3');
        this.load.audio('attack-heavy', 'audio/attack-heavy.mp3');
        this.load.audio('attack-heavy-hit', 'audio/attack-heavy-hit.mp3');
        this.load.audio('collect-herb', 'audio/collect-herb.mp3');
        this.load.audio('complete-quest', 'audio/complete-quest.mp3');
        this.load.audio('enemy-hit', 'audio/enemy-hit.mp3');
        this.load.audio('enemy-hit-2', 'audio/enemy-hit-2.mp3');
        this.load.audio('game-over', 'audio/game-over.wav');
        this.load.audio('help-toggle', 'audio/help-toggle.mp3');
        this.load.audio('in-water', 'audio/in-water.mp3');
        this.load.audio('page-turn', 'audio/page-turn.mp3');
        this.load.audio('walking-dirt', 'audio/walking-dirt.mp3');

        // Load fonts
        this.load.bitmapFont('8-bit', 'font/8-bit.png', 'font/8-bit.xml');
        this.load.bitmapFont('8-bit-white', 'font/8-bit-white.png', 'font/8-bit-white.xml');
        this.load.bitmapFont('pixel-black', 'font/pixel-black.png', 'font/pixel-black.xml');
        this.load.bitmapFont('pixel-green', 'font/pixel-green.png', 'font/pixel-green.xml');
        this.load.bitmapFont('pixel-red', 'font/pixel-red.png', 'font/pixel-red.xml');
        this.load.bitmapFont('pixel-white', 'font/pixel-white.png', 'font/pixel-white.xml');
        this.load.bitmapFont('pixel-yellow', 'font/pixel-yellow.png', 'font/pixel-yellow.xml');
    }

    create(): void {
        try {
            console.log('Loader scene create() called');
            
            // Create animations
            this.createAnimations();
            
            console.log('Animations created, transitioning to Menu scene...');
            
            // Transition to Menu scene
            this.scene.start('menuScene');
            
            console.log('Scene transition initiated');
        } catch (error) {
            console.error('Error in Loader create():', error);
        }
    }

    private createAnimations(): void {
        try {
            console.log('=== CREATING ANIMATIONS ===');
            
            // Water animations
            try {
                this.anims.create({
                    key: 'water-anim',
                    frames: this.anims.generateFrameNumbers('water-pond', { start: 0, end: 3 }),
                    frameRate: GameConfig.ANIMATION.WATER_FRAMERATE,
                    repeat: -1
                });
                console.log('Water animation created successfully');
            } catch (error) {
                console.error('Failed to create water animation:', error);
            }

        // Tree animations - create simple animations for each tree type
        this.anims.create({
            key: 'tree-1-anim',
            frames: this.anims.generateFrameNumbers('tree-1', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'tree-2-anim',
            frames: this.anims.generateFrameNumbers('tree-2', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'tree-3-anim',
            frames: this.anims.generateFrameNumbers('tree-3', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        // Player animations (2 frames per direction)
        this.anims.create({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.PLAYER_WALK_FRAMERATE,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 5 }),
            frameRate: GameConfig.ANIMATION.PLAYER_WALK_FRAMERATE,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-left',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 3 }),
            frameRate: GameConfig.ANIMATION.PLAYER_WALK_FRAMERATE,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 3 }),
            frameRate: GameConfig.ANIMATION.PLAYER_WALK_FRAMERATE,
            repeat: -1
        });

        // Attack animations
        this.anims.create({
            key: 'player-light-attack',
            frames: this.anims.generateFrameNumbers('player-light-attack-anim', { start: 0, end: 3 }),
            frameRate: GameConfig.ANIMATION.ATTACK_FRAME_RATE,
            repeat: 0
        });

        this.anims.create({
            key: 'player-heavy-attack',
            frames: this.anims.generateFrameNumbers('player-heavy-attack-anim', { start: 0, end: 3 }),
            frameRate: GameConfig.ANIMATION.ATTACK_FRAME_RATE,
            repeat: 0
        });

        // Enemy animations (single frame since spritesheets are small)
        this.anims.create({
            key: 'enemy-1-walk',
            frames: this.anims.generateFrameNumbers('enemy-1-anim', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy-2-walk',
            frames: this.anims.generateFrameNumbers('enemy-2-anim', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        // Boss animations (single frame since spritesheets are small)
        this.anims.create({
            key: 'boss-1-walk',
            frames: this.anims.generateFrameNumbers('boss-1', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'boss-aoe-anim',
            frames: this.anims.generateFrameNumbers('boss-aoe', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: 0
        });

        // NPC animation - use static image
        this.anims.create({
            key: 'npc-1',
            frames: [{ key: 'npc-1', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        // Death animations (single frame since spritesheets are small)
        this.anims.create({
            key: 'enemy-1-death',
            frames: this.anims.generateFrameNumbers('enemy-1-death', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'enemy-2-death',
            frames: this.anims.generateFrameNumbers('enemy-2-death', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'boss-death',
            frames: this.anims.generateFrameNumbers('boss-death', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: 0
        });

        // Quest animations (single frame since spritesheets are small)
        try {
            this.anims.create({
                key: 'quest-icon-bounce',
                frames: this.anims.generateFrameNumbers('quest-icon', { start: 0, end: 0 }),
                frameRate: 1,
                repeat: -1
            });
            console.log('Quest icon animation created successfully');
        } catch (error) {
            console.error('Failed to create quest icon animation:', error);
        }

        try {
            this.anims.create({
                key: 'quest-complete-icon-bounce',
                frames: this.anims.generateFrameNumbers('quest-complete-icon', { start: 0, end: 0 }),
                frameRate: 1,
                repeat: -1
            });
            console.log('Quest complete icon animation created successfully');
        } catch (error) {
            console.error('Failed to create quest complete icon animation:', error);
        }
        
        console.log('=== ANIMATION CREATION COMPLETE ===');
        
        } catch (error) {
            console.error('=== CRITICAL ERROR IN CREATE ANIMATIONS ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('==========================================');
        }
    }
}
