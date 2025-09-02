import Phaser from 'phaser';
import GameConfig from '../../config/GameConfig';

export class Loader extends Phaser.Scene {

    constructor() {
        super('Loader');
    }

    init(): void {
        console.log('Loader scene init() called');
    }

    preload(): void {
        console.log('Loader scene preload() called');
        
        // Add loading text
        this.add.text((this.game.config.width as number) / 2, (this.game.config.height as number) / 2, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#0000FF',
            align: 'center',
            padding: { top: 5, bottom: 5 },
            fixedWidth: 0,
        }).setOrigin(0.5);

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

        // Load player atlas
        this.load.atlas('player', 'spritesheets/player/player.png', 'spritesheets/player/player-walk-anims.json');

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
        console.log('Loader scene create() called');
        
        // Create animations
        this.createAnimations();
        
        console.log('Animations created, transitioning to Menu scene...');
        
        // Transition to Menu scene
        this.scene.start('menuScene');
        
        console.log('Scene transition initiated');
    }

    private createAnimations(): void {
        // Water animations
        this.anims.create({
            key: 'water-anim',
            frames: this.anims.generateFrameNumbers('water-pond', { start: 0, end: 3 }),
            frameRate: GameConfig.ANIMATION.WATER_FRAMERATE,
            repeat: -1
        });

        // Tree animations with loop (tree-1 has 31 frames, so 7 animations of 4-5 frames each)
        for (let i = 0; i < 7; i++) {
            const startFrame = i * 4;
            const endFrame = Math.min(startFrame + 3, 30); // Don't exceed 30 (31 frames total)
            this.anims.create({
                key: `tree-1-anim-${i}`,
                frames: this.anims.generateFrameNumbers('tree-1', { start: startFrame, end: endFrame }),
                frameRate: GameConfig.ANIMATION.TREE_FRAMERATE,
                repeat: -1
            });
        }

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

        // Enemy animations (check actual frame counts)
        this.anims.create({
            key: 'enemy-1-walk',
            frames: this.anims.generateFrameNumbers('enemy-1-anim', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.ENEMY_FRAME_RATE,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy-2-walk',
            frames: this.anims.generateFrameNumbers('enemy-2-anim', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.ENEMY_FRAME_RATE,
            repeat: -1
        });

        // Boss animations (check actual frame counts)
        this.anims.create({
            key: 'boss-1-walk',
            frames: this.anims.generateFrameNumbers('boss-1', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.BOSS_FRAME_RATE,
            repeat: -1
        });

        this.anims.create({
            key: 'boss-aoe-anim',
            frames: this.anims.generateFrameNumbers('boss-aoe', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.BOSS_AOE_FRAME_RATE,
            repeat: 0
        });

        // NPC animation
        this.anims.create({
            key: 'npc-1',
            frames: this.anims.generateFrameNumbers('npc-1', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });

        // Death animations (check actual frame counts)
        this.anims.create({
            key: 'enemy-1-death',
            frames: this.anims.generateFrameNumbers('enemy-1-death', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.DEATH_FRAME_RATE,
            repeat: 0
        });

        this.anims.create({
            key: 'enemy-2-death',
            frames: this.anims.generateFrameNumbers('enemy-2-death', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.DEATH_FRAME_RATE,
            repeat: 0
        });

        this.anims.create({
            key: 'boss-death',
            frames: this.anims.generateFrameNumbers('boss-death', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.BOSS_DEATH_FRAMERATE,
            repeat: 0
        });

        // Quest animations
        this.anims.create({
            key: 'quest-icon-bounce',
            frames: this.anims.generateFrameNumbers('quest-icon', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.QUEST_ICON_FRAME_RATE,
            repeat: -1
        });

        this.anims.create({
            key: 'quest-complete-icon-bounce',
            frames: this.anims.generateFrameNumbers('quest-complete-icon', { start: 0, end: 1 }),
            frameRate: GameConfig.ANIMATION.QUEST_COMPLETE_FRAME_RATE,
            repeat: -1
        });
    }
}
