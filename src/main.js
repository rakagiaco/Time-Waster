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
 */

'use strict'

let config = {
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
}

let game = new Phaser.Game(config)

let keyUp, keyDown, keyLeft, keyRight, keyAttackLight, keyAttackHeavy, keyInventory, keySprint

const ammountOfQuests = 7

