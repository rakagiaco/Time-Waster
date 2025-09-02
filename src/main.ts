import Phaser from 'phaser';
import { Loader } from './scenes/general/Loader';
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

const game = new Phaser.Game(config);

// Initialize input keys
export let keyUp: Phaser.Input.Keyboard.Key;
export let keyDown: Phaser.Input.Keyboard.Key;
export let keyLeft: Phaser.Input.Keyboard.Key;
export let keyRight: Phaser.Input.Keyboard.Key;
export let keyAttackLight: Phaser.Input.Keyboard.Key;
export let keyAttackHeavy: Phaser.Input.Keyboard.Key;
export let keyInventory: Phaser.Input.Keyboard.Key;
export let keySprint: Phaser.Input.Keyboard.Key;

export const amountOfQuests = 7;

// Initialize keys after game is created
game.events.once('texturesReady', () => {
    const keyboard = game.input.keyboard;
    if (keyboard) {
        keyUp = (keyboard as any).addKey('W');
        keyDown = (keyboard as any).addKey('S');
        keyLeft = (keyboard as any).addKey('A');
        keyRight = (keyboard as any).addKey('D');
        keyAttackLight = (keyboard as any).addKey('ONE');
        keyAttackHeavy = (keyboard as any).addKey('TWO');
        keyInventory = (keyboard as any).addKey('I');
        keySprint = (keyboard as any).addKey('SHIFT');
    }
});

