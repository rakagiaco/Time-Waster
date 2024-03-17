//created by cj moshy

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
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    scene: [Loader, Menu, World]
}

let game = new Phaser.Game(config)

let keyUp, keyDown, keyLeft, keyRight, keyAttackLight, keyAttackHeavy, keyInventory, keySprint

const ammountOfQuests = 7

