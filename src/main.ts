/**
 * Time-Waster RPG Game - Main Entry Point
 * 
 * A comprehensive Phaser.js RPG game featuring quest systems, dynamic inventory,
 * custom AI, and persistent save states. Built with TypeScript and Vite for 
 * modern development workflow.
 * 
 * Original game created by C.J. Moshy for UCSC's CMPM 120
 * Converted to TypeScript and modernized build system
 * 
 * Technical Features:
 * - Physics engine with arcade physics
 * - Advanced camera system with minimap
 * - Rich text rendering with bitmap fonts
 * - Smooth tweens and animations
 * - Timer-based event system
 * - Custom tilemap integration (Tiled Map Editor)
 * 
 * Game Features:
 * - Scalable quest system with JSON configuration
 * - Dynamic inventory management
 * - Entity-component architecture for game objects
 * - Intelligent AI with state machines
 * - Local storage for game state persistence
 * - Day/night cycle with lighting effects
 * 
 * Audio assets licensed under Pixabay License:
 * https://pixabay.com/service/license-summary/
 * Visual assets created in-house
 */

import Phaser from 'phaser';
import { Loader } from './scenes/general/Loader';
import { Menu } from './scenes/general/Menu';
import { World } from './scenes/game/World';
import { Credits } from './scenes/general/Credits';
import { GameOver } from './scenes/general/GameOver';
import { MemoryManager } from './systems/MemoryManager';

/**
 * Phaser Game Configuration
 * 
 * Core configuration object that defines the game's rendering, physics,
 * scaling, and scene management settings.
 */
const config: Phaser.Types.Core.GameConfig = {
    parent: 'gameContainer',           // HTML element ID to mount the game
    type: Phaser.AUTO,                // Use AUTO to fallback to Canvas if WebGL fails
    width: 1000,                      // Reasonable canvas size
    height: 750,                      // Reasonable canvas size
    
    // Rendering configuration
    render: {
        pixelArt: true,               // Crisp pixel art rendering without smoothing
        antialias: false,             // Disable antialiasing to save memory
        roundPixels: true,            // Round pixels for crisp rendering
        powerPreference: "high-performance",  // Enable hardware acceleration
        maxTextures: 8,               // Limit texture count to prevent memory overflow
        batchSize: 1000               // Reduce batch size to save memory
    },
    
    // Scaling and responsive design
    scale: {
        mode: Phaser.Scale.FIT,       // Scale to fit container while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH  // Center the game in the container
    },
    
    // Physics engine configuration
    physics: {
        default: 'arcade',            // Use Arcade Physics for simple 2D physics
        arcade: {
            debug: false,             // Disable physics debug rendering in production
            gravity: {
                x: 0,                 // No horizontal gravity (top-down game)
                y: 0                  // No vertical gravity (top-down game)
            }
        }
    },
    
    // Scene loading order - scenes are loaded in array order
    scene: [Loader, Menu, World, Credits, GameOver],
    
    // Audio configuration for memory efficiency
    audio: {
        disableWebAudio: false,       // Keep Web Audio enabled
        noAudio: false               // Enable audio but with limits
    },
    
    // WebGL context attributes are handled automatically by Phaser
    // Custom webgl configuration removed to avoid TypeScript errors
    
    // Memory management callbacks
    callbacks: {
        postBoot: (game: Phaser.Game) => {
            // Limit texture size to reduce memory usage
            if (game.renderer && (game.renderer as any).gl) {
                const gl = (game.renderer as any).gl;
                const maxTextureSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048); // Reduced from 4096 to 2048
                console.log(`Max texture size limited to: ${maxTextureSize}px`);
            }
            
            // Set up memory monitoring
            const memoryManager = MemoryManager.getInstance();
            memoryManager.startMemoryMonitoring();
            console.log(`Memory status: ${memoryManager.getMemoryStatus()}`);
        }
    }
};

/**
 * Global game instance - stores the main Phaser.Game object
 */
let game: Phaser.Game;

/**
 * Global Error Handling
 * 
 * Set up comprehensive error handling to catch and log any runtime errors
 * or unhandled promise rejections for debugging purposes.
 */

// Catch uncaught JavaScript errors
window.addEventListener('error', (event) => {
    console.error('=== GLOBAL ERROR ===');
    console.error('Error:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno, 'Column:', event.colno);
    console.error('Stack:', event.error?.stack);
    console.error('===================');
});

// Catch unhandled Promise rejections
window.addEventListener('unhandledrejection', (event) => {
    // Log audio errors but don't crash the game
    if (event.reason && (
        event.reason.message && event.reason.message.includes('decodeAudioData') ||
        event.reason.message && event.reason.message.includes('Unable to decode audio data') ||
        event.reason.name === 'EncodingError'
    )) {
        console.warn('Audio decoding error:', event.reason.message || event.reason);
        console.warn('This might be due to file format or corruption issues');
        event.preventDefault(); // Prevent the error from crashing the game
        return;
    }
    
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.error('===================================');
});

/**
 * Game Initialization
 * 
 * Initialize the Phaser game with comprehensive error handling and validation.
 * Performs pre-flight checks for DOM elements and browser compatibility.
 */
try {

    // Validate that the game container exists in the DOM
    const container = document.getElementById('gameContainer');
    if (!container) {
        throw new Error('Game container element "gameContainer" not found in DOM');
    }

    // Check WebGL support and warn if unavailable
    if (!Phaser.WEBGL) {
        console.warn('WebGL not available, falling back to Canvas rendering');
    }

    // Create the main Phaser game instance
    game = new Phaser.Game(config);

    // Set up game event listeners for monitoring game lifecycle
    game.events.on('ready', () => {
        // Game ready
    });

    game.events.on('start', () => {
        // Game started
    });

    game.events.on('error', (error: any) => {
        console.error('Game runtime error:', error);
    });

} catch (error) {
    // Handle critical initialization errors
    console.error('=== CRITICAL ERROR CREATING PHASER GAME ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    console.error('Full error object:', error);
    console.error('===========================================');


}

