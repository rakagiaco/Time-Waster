import Phaser from 'phaser';

// Input key declarations
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
export function initializeInputKeys(game: Phaser.Game): void {
    if (game) {
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
                
                console.log('Input keys initialized successfully');
            }
        });
    }
}
