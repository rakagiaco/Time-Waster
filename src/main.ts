import Phaser from 'phaser';
import { Loader} from './scenes/general/Loader';
import { Menu } from './scenes/general/Menu';
import { World } from './scenes/game/World';
import { Credits } from './scenes/general/Credits';
import { GameOver } from './scenes/general/GameOver';

//created by C.J. Moshy for UCSC's CMPM 120

// Technical Execution: Components used -> physics, cameras, text objects, tweens, timers, tilemaps
// Polish and Style: code base is clean and organized, with good comments
// Polish and Style: all visual assets made in house 

// audio assets from Pixabay: https://pixabay.com/service/license-summary/ 

/**
 *      Features
 * ---- easily scalable quest chain with json formatting support
 * ---- dynamic inventory
 * ---- general framework for creating 'entities' and 'items' -> ensures ease of use for future additions by using high level abstractions for gameobjects
 * ---- custom AI for enemy units
 * ---- local storage and gamestate saves
 * ---- custom tilemap made in tiled for unlimited map resizing and reworking
 * 
 */

const config: Phaser.Types.Core.GameConfig = {
    parent: 'gameContainer',
    type: Phaser.WEBGL,
    width: 1000,
    height: 800,
    render: {
        pixelArt: true,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    scene: [Loader, Menu, World, Credits, GameOver]
};

let game: Phaser.Game;

// Add global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('=== GLOBAL ERROR ===');
    console.error('Error:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Lineno:', event.lineno);
    console.error('Colno:', event.colno);
    console.error('Stack:', event.error?.stack);
    console.error('===================');
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.error('===================================');
});

try {
    console.log('=== PHASER GAME INITIALIZATION ===');
    console.log('Phaser version:', Phaser.VERSION);
    console.log('Phaser object:', typeof Phaser);
    console.log('Phaser.Game:', typeof Phaser.Game);
    console.log('Game config:', config);
    console.log('Available scenes:', Array.isArray(config.scene) ? config.scene.map((s: any) => 'Scene') : 'Scene');

    // Check if gameContainer exists
    const container = document.getElementById('gameContainer');
    if (!container) {
        throw new Error('Game container element "gameContainer" not found in DOM');
    }
    console.log('Game container found:', container);

    // Check if WebGL is supported
    if (!Phaser.WEBGL) {
        console.warn('WebGL not available, falling back to Canvas');
    }

    console.log('Creating Phaser game...');
    game = new Phaser.Game(config);
    console.log('Phaser game created successfully');

    // Add game event listeners for debugging
    game.events.on('ready', () => {
        console.log('Game ready event fired');
    });

    game.events.on('start', () => {
        console.log('Game start event fired');
    });

    game.events.on('error', (error: any) => {
        console.error('Game error event:', error);
    });

} catch (error) {
    console.error('=== CRITICAL ERROR CREATING PHASER GAME ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    console.error('Full error object:', error);
    console.error('===========================================');

    // Try to provide helpful debugging info
    console.log('=== DEBUGGING INFO ===');
    console.log('Document ready state:', document.readyState);
    console.log('Window load state:', window.performance?.navigation?.type);
    console.log('Available DOM elements:', {
        gameContainer: document.getElementById('gameContainer'),
        body: document.body,
        html: document.documentElement
    });
    console.log('=====================');
}

