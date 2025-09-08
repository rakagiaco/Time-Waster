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

import Phaser from 'phaser';
import { AssetOptimizer } from '../../systems/AssetOptimizer';

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
     * Uses AssetOptimizer to load only essential assets to prevent memory errors.
     */
    preload(): void {
        // Use AssetOptimizer to load only essential assets
        this.loadOptimizedAssets();
    }
    
    private loadOptimizedAssets(): void {
        const assets = AssetOptimizer.getOptimizedAssets();
        
        // Load assets with memory restrictions to prevent array buffer allocation failures
        for (const asset of assets) {
            if (AssetOptimizer.shouldLoadAsset(asset.type, 0)) {
                switch (asset.type) {
                    case 'image':
                        // console.log(`Loading image: ${asset.key} from /${asset.url}`);
                        this.load.image(asset.key, `/${asset.url}`);
                        break;
                        
                    case 'spritesheet':
                        console.log(`Loading spritesheet: ${asset.key} from /${asset.url} with config:`, asset.frameConfig);
                        this.load.spritesheet(asset.key, `/${asset.url}`, asset.frameConfig);
                        break;
                        
                    case 'bitmapFont':
                        this.load.bitmapFont(asset.key, `/${asset.textureURL}`, `/${asset.fontDataURL}`);
                        break;
                        
                    case 'audio':
                        // Load audio with debugging
                        // console.log(`Loading audio: ${asset.key} from ${asset.url}`);
                        this.load.audio(asset.key, `/${asset.url}`);
                        break;
                        
                    case 'json':
                        this.load.json(asset.key, `/${asset.url}`);
                        break;
                }
            } else {
                console.warn(`Skipping ${asset.type} asset: ${asset.key} due to memory constraints`);
            }
        }
        
        // Load tilemap and tileset (essential for world)
        this.load.image('base-tileset', '/tilesets/base_tileset.png');
        this.load.tilemapTiledJSON('tilemapJSON', '/tilesets/aetheron.tmj');
    }
    

    /**
     * Create animations and start the menu scene
     * 
     * Defines animation sequences for all game entities including player,
     * enemies, environment objects, and UI elements. All animations are
     * created here to ensure they're available when needed.
     */
    create(): void {
        // Add loading success handlers
        this.load.on('filecomplete-audio', (key: string) => {
            console.log(`✓ Audio loaded successfully: ${key}`);
        });
        
        this.load.on('filecomplete-spritesheet', (key: string) => {
            console.log(`✓ Spritesheet loaded successfully: ${key}`);
        });
        
        this.load.on('loaderror', (file: any) => {
            if (file.type === 'audio') {
                console.error(`❌ Audio loading failed: ${file.key} - ${file.url}`);
                console.error(`Error details:`, file.error);
            } else if (file.type === 'spritesheet') {
                console.error(`❌ Spritesheet loading failed: ${file.key} - ${file.url}`);
                console.error(`Error details:`, file.error);
            }
        });
        
        // Create all animations
        this.createAllAnimations();
        
        console.log('=== LOADER SCENE CREATE ===');
        console.log('All assets loaded, starting menu scene');
        console.log('Available textures:', Object.keys(this.textures.list));
        
        // Debug: Check if orc-shaman textures exist
        console.log('Orc Shaman texture check:');
        console.log('- orc-shaman-idle exists:', this.textures.exists('orc-shaman-idle'));
        console.log('- orc-shaman-run exists:', this.textures.exists('orc-shaman-run'));
        console.log('- orc-shaman-death exists:', this.textures.exists('orc-shaman-death'));
        
        console.log('=== END LOADER SCENE CREATE ===');
        
        // Start the menu scene
        this.scene.start('menuScene');
    }

    /**
     * Create all game animations
     */
    private createAllAnimations(): void {
        // Create only the most essential animations to prevent memory errors
        try {
            // Player animations (if player spritesheet is loaded)
            if (this.textures.exists('player')) {
                // Player idle animations (Knight_1 layout: frames 1-4 for idle)
                this.anims.create({
                    key: 'player-idle-down',
                    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
                    frameRate: 1,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-idle-right',
                    frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
                    frameRate: 1,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-idle-left',
                    frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
                    frameRate: 1,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-idle-up',
                    frames: this.anims.generateFrameNumbers('player', { start: 3, end: 3 }),
                    frameRate: 1,
                    repeat: -1
                });
                
                // Player walk animations (Knight_1 layout: frames 5-12 for walking)
                this.anims.create({
                    key: 'player-walk-down',
                    frames: this.anims.generateFrameNumbers('player', { start: 4, end: 5 }),
                    frameRate: 6,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-walk-left',
                    frames: this.anims.generateFrameNumbers('player', { start: 6, end: 7 }),
                    frameRate: 6,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-walk-right',
                    frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
                    frameRate: 6,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'player-walk-up',
                    frames: this.anims.generateFrameNumbers('player', { start: 10, end: 11 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
            
            // Enemy animations (if enemy spritesheets are loaded)
            if (this.textures.exists('enemy-1')) {
                this.anims.create({
                    key: 'enemy-idle-anim',
                    frames: this.anims.generateFrameNumbers('enemy-1', { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });
            }
            
            if (this.textures.exists('enemy-2')) {
                this.anims.create({
                    key: 'enemy2-idle-anim',
                    frames: this.anims.generateFrameNumbers('enemy-2', { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });
            }
            
            // Orc Shaman animations - using 32x32 frame size
            if (this.textures.exists('orc-shaman-idle')) {
                // Try different frame arrangement - maybe it's organized differently
                this.anims.create({
                    key: 'orc-shaman-idle-right',
                    frames: this.anims.generateFrameNumbers('orc-shaman-idle', { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'orc-shaman-idle-left',
                    frames: this.anims.generateFrameNumbers('orc-shaman-idle', { start: 4, end: 7 }),
                    frameRate: 4,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'orc-shaman-idle-down',
                    frames: this.anims.generateFrameNumbers('orc-shaman-idle', { start: 8, end: 11 }),
                    frameRate: 4,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'orc-shaman-idle-up',
                    frames: this.anims.generateFrameNumbers('orc-shaman-idle', { start: 12, end: 15 }),
                    frameRate: 4,
                    repeat: -1
                });
            }
            
            // Orc Shaman run animations - using separate spritesheets for each direction
            console.log('Creating Orc Shaman run animations from separate spritesheets...');
            
            if (this.textures.exists('orc-shaman-run-right')) {
                console.log('Creating orc-shaman-run-right animation');
                this.anims.create({
                    key: 'orc-shaman-run-right',
                    frames: this.anims.generateFrameNumbers('orc-shaman-run-right', { start: 0, end: 5 }),
                    frameRate: 8, // 8 fps as specified by user
                    repeat: -1
                });
            } else {
                console.log('orc-shaman-run-right texture not found');
            }
            
            if (this.textures.exists('orc-shaman-run-left')) {
                console.log('Creating orc-shaman-run-left animation');
                this.anims.create({
                    key: 'orc-shaman-run-left',
                    frames: this.anims.generateFrameNumbers('orc-shaman-run-left', { start: 0, end: 5 }),
                    frameRate: 8, // 8 fps as specified by user
                    repeat: -1
                });
            } else {
                console.log('orc-shaman-run-left texture not found');
            }
            
            if (this.textures.exists('orc-shaman-run-down')) {
                console.log('Creating orc-shaman-run-down animation');
                this.anims.create({
                    key: 'orc-shaman-run-down',
                    frames: this.anims.generateFrameNumbers('orc-shaman-run-down', { start: 0, end: 1 }),
                    frameRate: 4, // 4 fps as specified by user
                    repeat: -1
                });
            } else {
                console.log('orc-shaman-run-down texture not found');
            }
            
            if (this.textures.exists('orc-shaman-run-up')) {
                console.log('Creating orc-shaman-run-up animation');
                this.anims.create({
                    key: 'orc-shaman-run-up',
                    frames: this.anims.generateFrameNumbers('orc-shaman-run-up', { start: 0, end: 1 }),
                    frameRate: 4, // 4 fps as specified by user
                    repeat: -1
                });
            } else {
                console.log('orc-shaman-run-up texture not found');
            }
            
            if (this.textures.exists('orc-shaman-death')) {
                // Death animations - 14 frames total: 7 frames for death right, 7 frames for death left
                this.anims.create({
                    key: 'orc-shaman-death-right',
                    frames: this.anims.generateFrameNumbers('orc-shaman-death', { start: 0, end: 6 }),
                    frameRate: 8,
                    repeat: 0
                });
                
                this.anims.create({
                    key: 'orc-shaman-death-left',
                    frames: this.anims.generateFrameNumbers('orc-shaman-death', { start: 7, end: 13 }),
                    frameRate: 8,
                    repeat: 0
                });
            }
            
            // Quest icon animation will be created in World scene where it's needed
            
            console.log('✓ Essential animations created successfully');
        } catch (error) {
            console.warn('Some animations could not be created:', error);
        }
    }
}