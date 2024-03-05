//created by cj moshy

'use strict'

let config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 800,
    render: {
        pixelArt: true
    },
    scale: {
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
    scene: [Loader, World]
}

let game = new Phaser.Game(config)

let keyUp, keyDown, keyLeft, keyRight, keyAttackLight, keyAttackHeavy

